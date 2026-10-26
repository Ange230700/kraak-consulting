import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { getPnpmCommand, quoteWindowsArgument } from './workspace-commands.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const localEnvPath = path.join(repositoryRoot, '.env.local');
const scannerWorkDirectory = path.join(repositoryRoot, '.scannerwork');
const scannerReportDirectory = path.join(
  scannerWorkDirectory,
  'scanner-report',
);
const scannerLockPath = path.join(scannerWorkDirectory, 'sonarcloud-scan.lock');
const strictDiagnosticDefaultLogPath = path.join(
  scannerWorkDirectory,
  'sonar-strict-diagnostic.log',
);
const sonarScanPackageName = '@sonar/scan';
const lcovReportPathToSourcePrefix = {
  'coverage/lcov.info': '',
  'apps/api/coverage/lcov.info': 'apps/api',
  'apps/client/coverage/web/lcov.info': 'apps/client',
  'apps/client/coverage/mobile/lcov.info': 'apps/client',
  'packages/contracts/coverage/lcov.info': 'packages/contracts',
  'packages/domain/coverage/lcov.info': 'packages/domain',
  'packages/api-client/coverage/lcov.info': 'packages/api-client',
  'packages/tokens/coverage/lcov.info': 'packages/tokens',
};
const lcovReportPaths = Object.keys(lcovReportPathToSourcePrefix);

export function assertLcovReports(reportPaths = lcovReportPaths) {
  for (const reportPath of reportPaths) {
    const absolutePath = path.resolve(repositoryRoot, reportPath);
    if (
      !existsSync(absolutePath) ||
      readFileSync(absolutePath, 'utf8').trim().length === 0
    ) {
      throw new Error(
        `Rapport LCOV absent ou vide : ${reportPath}. Lancez pnpm coverage avant le scan.`,
      );
    }
  }
}

function getSourceLineCount(sourcePath, lineCountCache, root) {
  if (lineCountCache.has(sourcePath)) {
    return lineCountCache.get(sourcePath);
  }

  const absoluteSourcePath = path.join(root, sourcePath);

  if (!existsSync(absoluteSourcePath)) {
    lineCountCache.set(sourcePath, null);
    return null;
  }

  const sourceLines = readFileSync(absoluteSourcePath, 'utf8').split(/\r?\n/u);
  const lineCount =
    sourceLines.length > 0 && sourceLines.at(-1) === ''
      ? sourceLines.length - 1
      : sourceLines.length;
  lineCountCache.set(sourcePath, lineCount);
  return lineCount;
}

function parseEnvironmentFile(content) {
  const variables = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (line.length === 0 || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');

    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1);

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    variables[key] = value;
  }

  return variables;
}

export function readLocalSonarEnvironment(filePath = localEnvPath) {
  if (!existsSync(filePath)) {
    return {};
  }

  return parseEnvironmentFile(readFileSync(filePath, 'utf8'));
}

export function resolveSonarEnvironment(
  baseEnvironment = process.env,
  filePath = localEnvPath,
) {
  const localEnvironment = readLocalSonarEnvironment(filePath);
  const localToken = localEnvironment.SONAR_TOKEN?.trim() ?? '';
  const shellToken = baseEnvironment.SONAR_TOKEN?.trim() ?? '';
  const localHostUrl = localEnvironment.SONAR_HOST_URL?.trim() ?? '';
  const shellHostUrl = baseEnvironment.SONAR_HOST_URL?.trim() ?? '';

  return {
    ...baseEnvironment,
    SONAR_TOKEN: localToken || shellToken,
    SONAR_HOST_URL: localHostUrl || shellHostUrl || 'https://sonarcloud.io',
  };
}

export function createSonarScanCommand(platform = process.platform) {
  return {
    command: getPnpmCommand(platform),
    args: ['dlx', sonarScanPackageName, '-Dsonar.qualitygate.wait=true'],
  };
}

function toPosixPath(value) {
  return value.replaceAll('\\', '/');
}

function trimTrailingSlashes(value) {
  let endIndex = value.length;

  while (endIndex > 0 && value.charAt(endIndex - 1) === '/') {
    endIndex -= 1;
  }

  return endIndex === value.length ? value : value.slice(0, endIndex);
}

function trimLeadingDotSlash(value) {
  if (!value.startsWith('./')) {
    return value;
  }

  return value.slice(2);
}

function collapseConsecutiveSlashes(value) {
  let result = '';
  let previousWasSlash = false;

  for (const character of value) {
    if (character === '/') {
      if (!previousWasSlash) {
        result += character;
      }

      previousWasSlash = true;
      continue;
    }

    previousWasSlash = false;
    result += character;
  }

  return result;
}

function normalizeSourcePathForReport(sourcePath, sourcePrefix) {
  const normalizedPrefix = trimTrailingSlashes(toPosixPath(sourcePrefix));
  const normalizedSourcePath = trimLeadingDotSlash(toPosixPath(sourcePath));

  if (path.isAbsolute(normalizedSourcePath)) {
    const relativeSourcePath = toPosixPath(
      path.relative(repositoryRoot, normalizedSourcePath),
    );

    if (!relativeSourcePath.startsWith('..')) {
      return relativeSourcePath;
    }
  }

  if (
    !normalizedPrefix ||
    normalizedSourcePath.startsWith(`${normalizedPrefix}/`)
  ) {
    return normalizedSourcePath;
  }

  return collapseConsecutiveSlashes(
    `${normalizedPrefix}/${normalizedSourcePath}`,
  );
}

export function normalizeLcovContent(content, sourcePrefix) {
  const normalizedLines = content.split(/\r?\n/u).map((line) => {
    if (!line.startsWith('SF:')) {
      return line;
    }

    const sourcePath = line.slice(3);
    const normalizedSourcePath = normalizeSourcePathForReport(
      sourcePath,
      sourcePrefix,
    );
    return `SF:${normalizedSourcePath}`;
  });

  while (normalizedLines.at(-1) === '') {
    normalizedLines.pop();
  }
  return `${normalizedLines.join('\n')}\n`;
}

function shouldDropCoverageLine(line, currentSourcePath, lineCountCache, root) {
  if (!currentSourcePath) {
    return false;
  }

  if (!line.startsWith('DA:') && !line.startsWith('BRDA:')) {
    return false;
  }

  const separatorIndex = line.indexOf(':');
  const payload = line.slice(separatorIndex + 1);
  const firstField = payload.split(',')[0];
  const parsedLine = Number.parseInt(firstField, 10);
  const sourceLineCount = getSourceLineCount(
    currentSourcePath,
    lineCountCache,
    root,
  );

  if (!Number.isInteger(parsedLine) || !sourceLineCount) {
    return false;
  }

  return parsedLine < 1 || parsedLine > sourceLineCount;
}

function sanitizeNormalizedLcovContent(content, lineCountCache, root) {
  const state = {
    currentSourcePath: null,
    lines: [],
  };

  for (const line of content.split(/\r?\n/u)) {
    if (line.startsWith('SF:')) {
      state.currentSourcePath = line.slice(3);
      state.lines.push(line);
      continue;
    }

    if (
      shouldDropCoverageLine(
        line,
        state.currentSourcePath,
        lineCountCache,
        root,
      )
    ) {
      continue;
    }

    state.lines.push(line);
  }

  return state.lines.join('\n');
}

export function normalizeLcovReports(
  reportPaths = lcovReportPaths,
  root = repositoryRoot,
) {
  const lineCountCache = new Map();

  for (const reportPath of reportPaths) {
    const absoluteReportPath = path.join(root, reportPath);

    if (!existsSync(absoluteReportPath)) {
      continue;
    }

    const sourcePrefix = lcovReportPathToSourcePrefix[reportPath];

    if (sourcePrefix === undefined) {
      continue;
    }

    const reportContent = readFileSync(absoluteReportPath, 'utf8');
    const normalizedReportContent = sanitizeNormalizedLcovContent(
      normalizeLcovContent(reportContent, sourcePrefix),
      lineCountCache,
      root,
    );

    if (normalizedReportContent !== reportContent) {
      writeFileSync(absoluteReportPath, normalizedReportContent);
    }
  }
}

export function resetScannerReportDirectory(
  directory = scannerReportDirectory,
) {
  rmSync(directory, { force: true, recursive: true });
  mkdirSync(directory, { recursive: true });
}

function isTruthyFlag(value) {
  if (typeof value !== 'string') {
    return false;
  }

  const normalizedValue = value.trim().toLowerCase();
  return (
    normalizedValue === '1' ||
    normalizedValue === 'true' ||
    normalizedValue === 'yes' ||
    normalizedValue === 'on'
  );
}

export function resolveStrictDiagnosticOptions(baseEnvironment = process.env) {
  const strictDiagnosticEnabled = isTruthyFlag(
    baseEnvironment.SONAR_STRICT_DIAGNOSTIC,
  );
  const strictDiagnosticLogPath =
    baseEnvironment.SONAR_STRICT_DIAGNOSTIC_LOG?.trim() ||
    strictDiagnosticDefaultLogPath;

  return {
    enabled: strictDiagnosticEnabled,
    logPath: strictDiagnosticLogPath,
  };
}

export function createDiagnosticLogger(strictDiagnosticOptions) {
  if (!strictDiagnosticOptions.enabled) {
    return {
      log: () => {},
    };
  }

  mkdirSync(path.dirname(strictDiagnosticOptions.logPath), { recursive: true });

  return {
    log: (eventName, message) => {
      const timestamp = new Date().toISOString();
      const line = `${timestamp} ${eventName} ${message}\n`;
      writeFileSync(strictDiagnosticOptions.logPath, line, { flag: 'a' });
    },
  };
}

export function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) {
    return false;
  }

  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    console.debug('[sonar] Processus du verrou indisponible.', error);
    return false;
  }
}

function readLockPid(lockPath) {
  if (!existsSync(lockPath)) {
    return null;
  }

  const lockContent = readFileSync(lockPath, 'utf8').trim();
  const lockPid = Number.parseInt(lockContent, 10);
  return Number.isInteger(lockPid) ? lockPid : null;
}

export function acquireScanLock(
  lockPath = scannerLockPath,
  currentPid = process.pid,
) {
  mkdirSync(path.dirname(lockPath), { recursive: true });

  const existingPid = readLockPid(lockPath);

  if (existingPid && isProcessAlive(existingPid)) {
    return { acquired: false, lockPid: existingPid };
  }

  if (existingPid && !isProcessAlive(existingPid)) {
    rmSync(lockPath, { force: true });
  }

  try {
    writeFileSync(lockPath, `${currentPid}\n`, { flag: 'wx' });
    return { acquired: true, lockPid: null };
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'EEXIST'
    ) {
      return { acquired: false, lockPid: readLockPid(lockPath) };
    }

    throw error;
  }
}

export function releaseScanLock(lockPath = scannerLockPath) {
  rmSync(lockPath, { force: true });
}

export function spawnSonarCommand(
  command,
  environment,
  {
    platform = process.platform,
    spawnImpl = spawn,
    baseEnvironment = process.env,
  } = {},
) {
  if (platform !== 'win32') {
    return spawnImpl(command.command, command.args, {
      cwd: repositoryRoot,
      env: environment,
      stdio: 'inherit',
    });
  }

  const comspec = baseEnvironment.ComSpec ?? 'cmd.exe';
  const commandLine = [command.command, ...command.args]
    .map(quoteWindowsArgument)
    .join(' ');

  return spawnImpl(comspec, ['/d', '/s', '/c', `"${commandLine}"`], {
    cwd: repositoryRoot,
    env: environment,
    stdio: 'inherit',
    windowsVerbatimArguments: true,
  });
}

export function abortScannerProcess(
  childProcess,
  diagnosticLogger,
  {
    platform = process.platform,
    spawnSyncImpl = spawnSync,
    resolveTaskkill = resolveTaskkillExecutablePath,
  } = {},
) {
  const childPid = childProcess.pid;

  if (!childPid) {
    diagnosticLogger.log('ABORT_SKIPPED', 'PID indisponible');
    return;
  }

  if (platform === 'win32') {
    try {
      const taskkillExecutablePath = resolveTaskkill();
      const taskkillResult = spawnSyncImpl(
        taskkillExecutablePath,
        ['/PID', `${childPid}`, '/T', '/F'],
        {
          stdio: 'ignore',
        },
      );
      diagnosticLogger.log(
        'ABORT_TASKKILL',
        `pid=${childPid} status=${taskkillResult.status ?? 'null'}`,
      );
    } catch (error) {
      console.error('[sonar] Arrêt Windows du scanner impossible.', error);
      const message = error instanceof Error ? error.message : String(error);
      diagnosticLogger.log('ABORT_TASKKILL_ERROR', message);
      const wasKilled = childProcess.kill('SIGKILL');
      diagnosticLogger.log(
        'ABORT_FALLBACK_SIGKILL',
        `pid=${childPid} killed=${wasKilled}`,
      );
    }
    return;
  }

  const wasKilled = childProcess.kill('SIGKILL');
  diagnosticLogger.log('ABORT_SIGKILL', `pid=${childPid} killed=${wasKilled}`);
}

export function resolveTaskkillExecutablePath(baseEnvironment = process.env) {
  const systemRoot =
    baseEnvironment.SystemRoot?.trim() || baseEnvironment.WINDIR?.trim();

  if (!systemRoot) {
    throw new Error(
      'Impossible de determiner le chemin système Windows (SystemRoot/WINDIR manquant).',
    );
  }

  const taskkillExecutablePath = path.join(
    systemRoot,
    'System32',
    'taskkill.exe',
  );

  if (!existsSync(taskkillExecutablePath)) {
    throw new Error(
      `Executable taskkill introuvable: ${taskkillExecutablePath}`,
    );
  }

  return taskkillExecutablePath;
}

export function createScannerReportMonitor(
  strictDiagnosticOptions,
  diagnosticLogger,
  childProcess,
  { directory = scannerReportDirectory, abort = abortScannerProcess } = {},
) {
  if (!strictDiagnosticOptions.enabled) {
    return {
      stop: () => {},
      shouldAbort: () => false,
    };
  }

  const monitorIntervalMs = 250;
  const missingPersistenceMs = 1500;
  let hasAbortedForMissingReport = false;
  let hasSeenScannerReportDirectory = false;
  let missingSinceTimestamp = null;

  const handle = setInterval(() => {
    if (hasAbortedForMissingReport) {
      return;
    }

    const scannerReportExists = existsSync(directory);

    if (scannerReportExists) {
      if (!hasSeenScannerReportDirectory) {
        hasSeenScannerReportDirectory = true;
        diagnosticLogger.log('SCANNER_REPORT_PRESENT', `path=${directory}`);
      }

      missingSinceTimestamp = null;
      return;
    }

    if (!hasSeenScannerReportDirectory) {
      return;
    }

    const now = Date.now();

    if (missingSinceTimestamp === null) {
      missingSinceTimestamp = now;
      return;
    }

    if (now - missingSinceTimestamp < missingPersistenceMs) {
      return;
    }

    hasAbortedForMissingReport = true;
    diagnosticLogger.log('SCANNER_REPORT_MISSING', `path=${directory}`);
    abort(childProcess, diagnosticLogger);
  }, monitorIntervalMs);

  return {
    stop: () => {
      clearInterval(handle);
    },
    shouldAbort: () => hasAbortedForMissingReport,
  };
}

export function runSonarScan(
  command,
  environment,
  strictDiagnosticOptions,
  {
    spawnImpl = spawnSonarCommand,
    monitorFactory = createScannerReportMonitor,
  } = {},
) {
  return new Promise((resolve) => {
    const childProcess = spawnImpl(command, environment);
    const diagnosticLogger = createDiagnosticLogger(strictDiagnosticOptions);
    let isSettled = false;

    diagnosticLogger.log(
      'STRICT_MODE',
      `enabled=${strictDiagnosticOptions.enabled} logPath=${strictDiagnosticOptions.logPath}`,
    );
    diagnosticLogger.log(
      'SCAN_STARTED',
      `pid=${childProcess.pid ?? 'unknown'}`,
    );

    const monitor = monitorFactory(
      strictDiagnosticOptions,
      diagnosticLogger,
      childProcess,
    );

    const finalize = (exitCode, signal = null) => {
      if (isSettled) {
        return;
      }

      isSettled = true;

      monitor.stop();

      if (monitor.shouldAbort()) {
        diagnosticLogger.log(
          'SCAN_ABORTED',
          'scanner-report a disparu pendant le run',
        );
      }

      if (signal) {
        diagnosticLogger.log('SCAN_EXIT', `code=${exitCode} signal=${signal}`);
      } else {
        diagnosticLogger.log('SCAN_EXIT', `code=${exitCode}`);
      }

      resolve(exitCode ?? 1);
    };

    childProcess.once('error', (error) => {
      console.error(
        `ERROR: Impossible de lancer SonarScanner: ${error.message}`,
      );
      diagnosticLogger.log('SCAN_ERROR', error.message);
      finalize(1);
    });

    childProcess.once('close', (code, signal) => {
      finalize(code, signal ?? null);
    });
  });
}

export async function main({
  environment = resolveSonarEnvironment(),
  lockPath = scannerLockPath,
  reportPaths = lcovReportPaths,
  reportDirectory = scannerReportDirectory,
  scan = runSonarScan,
} = {}) {
  if (!environment.SONAR_TOKEN) {
    console.error(
      'ERROR: SONAR_TOKEN manquant. Renseignez .env.local puis relancez.',
    );
    return 1;
  }

  const strictDiagnosticOptions = resolveStrictDiagnosticOptions(environment);

  const lock = acquireScanLock(lockPath);

  if (!lock.acquired) {
    const pidLabel = lock.lockPid ?? 'inconnu';
    console.error(
      `ERROR: Un scan Sonar est deja en cours (PID ${pidLabel}). Attendez sa fin puis relancez.`,
    );
    return 1;
  }

  try {
    assertLcovReports(reportPaths);
    resetScannerReportDirectory(reportDirectory);
    normalizeLcovReports(reportPaths);

    const command = createSonarScanCommand();
    return await scan(command, environment, strictDiagnosticOptions);
  } finally {
    releaseScanLock(lockPath);
  }
}

const isExecutedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isExecutedDirectly) {
  const exitCode = await main();
  process.exit(exitCode);
}
