import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { getPnpmCommand } from './workspace-commands.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const localEnvPath = path.join(repositoryRoot, '.env.local');
const scannerWorkDirectory = path.join(repositoryRoot, '.scannerwork');
const scannerReportDirectory = path.join(scannerWorkDirectory, 'scanner-report');
const scannerLockPath = path.join(scannerWorkDirectory, 'sonarcloud-scan.lock');
const strictDiagnosticDefaultLogPath = path.join(scannerWorkDirectory, 'sonar-strict-diagnostic.log');
const lcovReportPathToSourcePrefix = {
  'apps/api/coverage/lcov.info': 'apps/api',
  'apps/client/coverage/web/lcov.info': 'apps/client',
  'apps/client/coverage/mobile/lcov.info': 'apps/client',
  'packages/contracts/coverage/lcov.info': 'packages/contracts',
  'packages/domain/coverage/lcov.info': 'packages/domain',
  'packages/api-client/coverage/lcov.info': 'packages/api-client',
  'packages/tokens/coverage/lcov.info': 'packages/tokens',
};
const lcovReportPaths = Object.keys(lcovReportPathToSourcePrefix);

function getSourceLineCount(sourcePath, lineCountCache) {
  if (lineCountCache.has(sourcePath)) {
    return lineCountCache.get(sourcePath);
  }

  const absoluteSourcePath = path.join(repositoryRoot, sourcePath);

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

export function resolveSonarEnvironment(baseEnvironment = process.env, filePath = localEnvPath) {
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
    args: ['--package=@sonar/scan', 'dlx', 'sonar-scanner'],
  };
}

function toPosixPath(value) {
  return value.replaceAll('\\', '/');
}

function normalizeSourcePathForReport(sourcePath, sourcePrefix) {
  const normalizedPrefix = toPosixPath(sourcePrefix).replace(/\/+$/u, '');
  const normalizedSourcePath = toPosixPath(sourcePath).replace(/^\.\//u, '');

  if (path.isAbsolute(normalizedSourcePath)) {
    const relativeSourcePath = toPosixPath(path.relative(repositoryRoot, normalizedSourcePath));

    if (!relativeSourcePath.startsWith('..')) {
      return relativeSourcePath;
    }
  }

  if (normalizedSourcePath.startsWith(`${normalizedPrefix}/`)) {
    return normalizedSourcePath;
  }

  return `${normalizedPrefix}/${normalizedSourcePath}`.replace(/\/+/gu, '/');
}

export function normalizeLcovContent(content, sourcePrefix) {
  const normalizedLines = content.split(/\r?\n/u).map((line) => {
    if (!line.startsWith('SF:')) {
      return line;
    }

    const sourcePath = line.slice(3);
    const normalizedSourcePath = normalizeSourcePathForReport(sourcePath, sourcePrefix);
    return `SF:${normalizedSourcePath}`;
  });

  return `${normalizedLines.join('\n')}\n`;
}

export function normalizeLcovReports(reportPaths = lcovReportPaths) {
  const lineCountCache = new Map();

  for (const reportPath of reportPaths) {
    const absoluteReportPath = path.join(repositoryRoot, reportPath);

    if (!existsSync(absoluteReportPath)) {
      continue;
    }

    const sourcePrefix = lcovReportPathToSourcePrefix[reportPath];

    if (!sourcePrefix) {
      continue;
    }

    const reportContent = readFileSync(absoluteReportPath, 'utf8');
    const normalizedReportContent = normalizeLcovContent(reportContent, sourcePrefix)
      .split(/\r?\n/u)
      .reduce(
        (state, line) => {
          if (line.startsWith('SF:')) {
            const sourcePath = line.slice(3);
            return {
              currentSourcePath: sourcePath,
              lines: [...state.lines, line],
            };
          }

          if (
            state.currentSourcePath &&
            (line.startsWith('DA:') || line.startsWith('BRDA:'))
          ) {
            const separatorIndex = line.indexOf(':');
            const payload = line.slice(separatorIndex + 1);
            const firstField = payload.split(',')[0];
            const parsedLine = Number.parseInt(firstField, 10);
            const sourceLineCount = getSourceLineCount(
              state.currentSourcePath,
              lineCountCache,
            );

            if (
              Number.isInteger(parsedLine) &&
              sourceLineCount &&
              (parsedLine < 1 || parsedLine > sourceLineCount)
            ) {
              return state;
            }
          }

          return {
            currentSourcePath: state.currentSourcePath,
            lines: [...state.lines, line],
          };
        },
        { currentSourcePath: null, lines: [] },
      )
      .lines.join('\n');

    if (normalizedReportContent !== reportContent) {
      writeFileSync(absoluteReportPath, normalizedReportContent);
    }
  }
}

export function resetScannerReportDirectory() {
  rmSync(scannerReportDirectory, { force: true, recursive: true });
  mkdirSync(scannerReportDirectory, { recursive: true });
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
  const strictDiagnosticEnabled = isTruthyFlag(baseEnvironment.SONAR_STRICT_DIAGNOSTIC);
  const strictDiagnosticLogPath =
    baseEnvironment.SONAR_STRICT_DIAGNOSTIC_LOG?.trim() || strictDiagnosticDefaultLogPath;

  return {
    enabled: strictDiagnosticEnabled,
    logPath: strictDiagnosticLogPath,
  };
}

function createDiagnosticLogger(strictDiagnosticOptions) {
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

function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) {
    return false;
  }

  try {
    process.kill(pid, 0);
    return true;
  } catch {
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

export function acquireScanLock(lockPath = scannerLockPath, currentPid = process.pid) {
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
    if (error && typeof error === 'object' && 'code' in error && error.code === 'EEXIST') {
      return { acquired: false, lockPid: readLockPid(lockPath) };
    }

    throw error;
  }
}

export function releaseScanLock(lockPath = scannerLockPath) {
  rmSync(lockPath, { force: true });
}

function needsWindowsQuoting(argument) {
  for (const character of argument) {
    if (character === ' ' || character === '\t' || character === '"') {
      return true;
    }
  }

  return false;
}

function quoteWindowsArgument(argument) {
  if (argument.length === 0) {
    return '""';
  }

  if (!needsWindowsQuoting(argument)) {
    return argument;
  }

  let quotedArgument = '"';
  let backslashCount = 0;

  for (const character of argument) {
    if (character === '\\') {
      backslashCount += 1;
      continue;
    }

    if (character === '"') {
      quotedArgument += '\\'.repeat(backslashCount * 2 + 1);
      quotedArgument += '"';
    } else {
      quotedArgument += '\\'.repeat(backslashCount);
      quotedArgument += character;
    }

    backslashCount = 0;
  }

  quotedArgument += '\\'.repeat(backslashCount * 2);
  quotedArgument += '"';

  return quotedArgument;
}

function spawnSonarCommand(command, environment) {
  if (process.platform !== 'win32') {
    return spawn(command.command, command.args, {
      cwd: repositoryRoot,
      env: environment,
      stdio: 'inherit',
    });
  }

  const comspec = process.env.ComSpec ?? 'cmd.exe';
  const commandLine = [command.command, ...command.args]
    .map(quoteWindowsArgument)
    .join(' ');

  return spawn(comspec, ['/d', '/s', '/c', commandLine], {
    cwd: repositoryRoot,
    env: environment,
    stdio: 'inherit',
    windowsVerbatimArguments: true,
  });
}

function abortScannerProcess(childProcess, diagnosticLogger) {
  const childPid = childProcess.pid;

  if (!childPid) {
    diagnosticLogger.log('ABORT_SKIPPED', 'PID indisponible');
    return;
  }

  if (process.platform === 'win32') {
    const taskkillResult = spawnSync('taskkill', ['/PID', `${childPid}`, '/T', '/F'], {
      stdio: 'ignore',
    });
    diagnosticLogger.log(
      'ABORT_TASKKILL',
      `pid=${childPid} status=${taskkillResult.status ?? 'null'}`,
    );
    return;
  }

  const wasKilled = childProcess.kill('SIGKILL');
  diagnosticLogger.log('ABORT_SIGKILL', `pid=${childPid} killed=${wasKilled}`);
}

function runSonarScan(command, environment, strictDiagnosticOptions) {
  return new Promise((resolve) => {
    const childProcess = spawnSonarCommand(command, environment);
    const diagnosticLogger = createDiagnosticLogger(strictDiagnosticOptions);
    const monitorIntervalMs = 250;
    const missingPersistenceMs = 1500;
    let isSettled = false;
    let hasAbortedForMissingReport = false;
    let hasSeenScannerReportDirectory = false;
    let missingSinceTimestamp = null;

    diagnosticLogger.log(
      'STRICT_MODE',
      `enabled=${strictDiagnosticOptions.enabled} logPath=${strictDiagnosticOptions.logPath}`,
    );
    diagnosticLogger.log('SCAN_STARTED', `pid=${childProcess.pid ?? 'unknown'}`);

    const monitorHandle = strictDiagnosticOptions.enabled
      ? setInterval(() => {
          if (hasAbortedForMissingReport || isSettled) {
            return;
          }

          const scannerReportExists = existsSync(scannerReportDirectory);

          if (scannerReportExists) {
            if (!hasSeenScannerReportDirectory) {
              hasSeenScannerReportDirectory = true;
              diagnosticLogger.log('SCANNER_REPORT_PRESENT', `path=${scannerReportDirectory}`);
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

          if (!scannerReportExists) {
            hasAbortedForMissingReport = true;
            diagnosticLogger.log(
              'SCANNER_REPORT_MISSING',
              `path=${scannerReportDirectory}`,
            );
            abortScannerProcess(childProcess, diagnosticLogger);
          }
        }, monitorIntervalMs)
      : null;

    const finalize = (exitCode, signal = null) => {
      if (isSettled) {
        return;
      }

      isSettled = true;

      if (monitorHandle) {
        clearInterval(monitorHandle);
      }

      if (signal) {
        diagnosticLogger.log('SCAN_EXIT', `code=${exitCode} signal=${signal}`);
      } else {
        diagnosticLogger.log('SCAN_EXIT', `code=${exitCode}`);
      }

      resolve(exitCode ?? 1);
    };

    childProcess.once('error', (error) => {
      console.error(`ERROR: Impossible de lancer SonarScanner: ${error.message}`);
      diagnosticLogger.log('SCAN_ERROR', error.message);
      finalize(1);
    });

    childProcess.once('close', (code, signal) => {
      finalize(code, signal ?? null);
    });
  });
}

export async function main() {
  const environment = resolveSonarEnvironment();

  if (!environment.SONAR_TOKEN) {
    console.error('ERROR: SONAR_TOKEN manquant. Renseignez .env.local puis relancez.');
    return 1;
  }

  const strictDiagnosticOptions = resolveStrictDiagnosticOptions(environment);

  const lock = acquireScanLock();

  if (!lock.acquired) {
    const pidLabel = lock.lockPid ?? 'inconnu';
    console.error(`ERROR: Un scan Sonar est deja en cours (PID ${pidLabel}). Attendez sa fin puis relancez.`);
    return 1;
  }

  try {
    resetScannerReportDirectory();
    normalizeLcovReports();

    const command = createSonarScanCommand();
    return runSonarScan(command, environment, strictDiagnosticOptions);
  } finally {
    releaseScanLock();
  }
}

const isExecutedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isExecutedDirectly) {
  const exitCode = await main();
  process.exit(exitCode);
}
