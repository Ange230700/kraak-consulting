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

import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isWindows = os.platform() === 'win32';
const isShell = process.argv.includes('--shell');
const runCommand = process.argv[process.argv.indexOf('--run') + 1];

// Configure paths
const javaHome = isWindows
  ? 'C:\\Program Files\\Java\\jdk-21'
  : process.env.JAVA_HOME || '/usr/lib/jvm/java-21-openjdk';

const androidHome = isWindows
  ? 'C:\\Users\\USER\\AppData\\Local\\Android\\Sdk'
  : process.env.ANDROID_HOME || `${process.env.HOME}/Android/Sdk`;

// Check if paths exist
try {
  // We won't throw here, just set them anyway
  // The build system will fail with clear messaging if paths don't exist
} catch (e) {
  // Silently continue
}

// Output shell-compatible export statements
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
} else if (runCommand) {
  // Validate that runCommand is a non-empty string before execution
  if (typeof runCommand !== 'string' || runCommand.trim().length === 0) {
    console.error('[android-env] Error: --run requires a non-empty command string.');
    process.exit(1);
  }

  // Run the command with environment variables set
  try {
    const env = {
      ...process.env,
      JAVA_HOME: javaHome,
      ANDROID_HOME: androidHome,
      ANDROID_SDK_ROOT: androidHome,
    };

    if (!isWindows) {
      env.PATH = `${javaHome}/bin:${env.PATH}`;
    }

    console.error(`[android-env] Running: ${runCommand}`);
    execSync(runCommand, {
      env,
      stdio: 'inherit',
      shell: true,
    });
  } catch (error) {
    process.exit(error.status || 1);
  }
}
