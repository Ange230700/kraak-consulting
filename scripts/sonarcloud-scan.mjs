import { existsSync, readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { getPnpmCommand } from './workspace-commands.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const localEnvPath = path.join(repositoryRoot, '.env.local');

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

function runSonarScan(command, environment) {
  return new Promise((resolve) => {
    const childProcess = spawnSonarCommand(command, environment);

    childProcess.once('error', (error) => {
      console.error(`ERROR: Impossible de lancer SonarScanner: ${error.message}`);
      resolve(1);
    });

    childProcess.once('close', (code) => {
      resolve(code ?? 1);
    });
  });
}

export async function main() {
  const environment = resolveSonarEnvironment();

  if (!environment.SONAR_TOKEN) {
    console.error('ERROR: SONAR_TOKEN manquant. Renseignez .env.local puis relancez.');
    return 1;
  }

  const command = createSonarScanCommand();
  return runSonarScan(command, environment);
}

const isExecutedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isExecutedDirectly) {
  const exitCode = await main();
  process.exit(exitCode);
}
