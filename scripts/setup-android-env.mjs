#!/usr/bin/env node

/**
 * Setup Android build environment variables for the current shell session.
 *
 * Usage:
 *   # Bash/Zsh
 *   eval $(node scripts/setup-android-env.mjs)
 *
 *   # PowerShell
 *   & node scripts/setup-android-env.mjs | Out-String | Invoke-Expression
 *
 *   # Or run Android builds directly through this wrapper:
 *   node scripts/setup-android-env.mjs --run "pnpm build:debug:android"
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import os from 'node:os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isWindows = os.platform() === 'win32';

// Configure paths
const javaHome = isWindows
  ? String.raw`C:\Program Files\Java\jdk-21`
  : process.env.JAVA_HOME || '/usr/lib/jvm/java-21-openjdk';

const androidHome = isWindows
  ? String.raw`C:\Users\USER\AppData\Local\Android\Sdk`
  : process.env.ANDROID_HOME || `${process.env.HOME}/Android/Sdk`;

function splitCommandTokens(input) {
  const tokens = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escaped = false;

  for (const char of input) {
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      continue;
    }

    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && /\s/u.test(char)) {
      if (current.length > 0) {
        tokens.push(current);
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (escaped || inSingleQuote || inDoubleQuote) {
    throw new Error(
      '[android-env] Error: commande invalide. Vérifiez les guillemets et échappements.',
    );
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return tokens;
}

export function parseRunCommand(input) {
  if (typeof input !== 'string' || input.trim().length === 0) {
    throw new Error(
      '[android-env] Error: --run requires a non-empty command string.',
    );
  }

  const [command, ...args] = splitCommandTokens(input.trim());

  if (!command) {
    throw new Error(
      '[android-env] Error: --run requires a non-empty command string.',
    );
  }

  return { args, command };
}

function runWithoutShell(command, args, env) {
  let result = spawnSync(command, args, {
    env,
    shell: false,
    stdio: 'inherit',
  });

  if (
    isWindows &&
    result.error?.code === 'ENOENT' &&
    !path.extname(command)
  ) {
    result = spawnSync(`${command}.cmd`, args, {
      env,
      shell: false,
      stdio: 'inherit',
    });
  }

  return result;
}

export function runCommandWithAndroidEnv(
  commandInput,
  {
    environmentSource = process.env,
    exit = process.exit,
    runProcess = runWithoutShell,
  } = {},
) {
  const { args, command } = parseRunCommand(commandInput);
  const env = {
    ...environmentSource,
    JAVA_HOME: javaHome,
    ANDROID_HOME: androidHome,
    ANDROID_SDK_ROOT: androidHome,
  };

  if (!isWindows) {
    env.PATH = `${javaHome}/bin:${env.PATH}`;
  }

  console.error(`[android-env] Running: ${command} ${args.join(' ')}`.trim());

  const result = runProcess(command, args, env);

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    exit(result.status ?? 1);
  }
}

export function setupAndroidEnvFromCli(argv = process.argv.slice(2)) {
  const isShell = argv.includes('--shell');
  const runFlagIndex = argv.indexOf('--run');
  const runCommand = runFlagIndex >= 0 ? argv[runFlagIndex + 1] : undefined;

  if (isShell || !runCommand) {
    if (isWindows && !isShell) {
      // PowerShell format
      console.log(`$env:JAVA_HOME='${javaHome}'`);
      console.log(`$env:ANDROID_HOME='${androidHome}'`);
      console.log(`$env:ANDROID_SDK_ROOT='${androidHome}'`);
    } else {
      // Bash/Zsh format
      console.log(`export JAVA_HOME='${javaHome}'`);
      console.log(`export ANDROID_HOME='${androidHome}'`);
      console.log(`export ANDROID_SDK_ROOT='${androidHome}'`);
      if (!isWindows) {
        console.log(`export PATH="$JAVA_HOME/bin:$PATH"`);
      }
    }

    console.error('[android-env] Environment variables set:', {
      JAVA_HOME: javaHome,
      ANDROID_HOME: androidHome,
      ANDROID_SDK_ROOT: androidHome,
    });
    return;
  }

  runCommandWithAndroidEnv(runCommand);
}

if (path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  try {
    setupAndroidEnvFromCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(error?.status || 1);
  }
}
