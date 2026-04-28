// scripts\workspace-runner.mjs

import { spawn } from 'node:child_process';
import process from 'node:process';

import { createWorkflows, getPnpmCommand } from './workspace-commands.mjs';

const workflows = createWorkflows();
const workflowName = process.argv[2];
const workflow = workflows[workflowName];

if (!workflow) {
  const availableWorkflows = Object.keys(workflows).join(', ');
  console.error(
    `Unknown workflow "${workflowName}". Available workflows: ${availableWorkflows}`,
  );
  process.exit(1);
}

const runningChildren = new Set();
let shutdownRequested = false;

process.on('SIGINT', () => {
  shutdownRequested = true;
  stopRunningChildren('SIGINT');
});

process.on('SIGTERM', () => {
  shutdownRequested = true;
  stopRunningChildren('SIGTERM');
});

function stopRunningChildren(signal) {
  for (const child of runningChildren) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
}

function prefixStream(stream, prefix, target) {
  let buffer = '';

  stream.on('data', (chunk) => {
    buffer += chunk.toString();

    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      target.write(`${prefix}${line}\n`);
    }
  });

  stream.on('end', () => {
    if (buffer.length > 0) {
      target.write(`${prefix}${buffer}\n`);
    }
  });
}

function quoteWindowsArgument(argument) {
  if (argument.length === 0) {
    return '""';
  }

  if (!/[ \t"]/u.test(argument)) {
    return argument;
  }

  const escaped1 = argument.replaceAll(/(\\*)"/g, String.raw`$1$1\"`);
  const escaped2 = escaped1.replaceAll(/(\\+)$/g, '$1$1');
  return `"${escaped2}"`;
}

function spawnCommand(command) {
  if (process.platform !== 'win32') {
    return spawn(getPnpmCommand(), command.args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: ['inherit', 'pipe', 'pipe'],
    });
  }

  const comspec = process.env.ComSpec ?? 'cmd.exe';
  const commandLine = [getPnpmCommand(), ...command.args]
    .map(quoteWindowsArgument)
    .join(' ');

  return spawn(comspec, ['/d', '/s', '/c', commandLine], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ['inherit', 'pipe', 'pipe'],
    windowsVerbatimArguments: true,
  });
}

function startCommand(command) {
  const child = spawnCommand(command);

  runningChildren.add(child);
  prefixStream(child.stdout, `[${command.name}] `, process.stdout);
  prefixStream(child.stderr, `[${command.name}] `, process.stderr);

  return new Promise((resolve) => {
    child.once('error', (error) => {
      resolve({ code: 1, command: command.name, error });
    });

    child.once('close', (code, signal) => {
      resolve({
        code: code ?? (signal ? 1 : 0),
        command: command.name,
        signal,
      });
    });
  }).finally(() => {
    runningChildren.delete(child);
  });
}

async function runParallelPhase(phase) {
  const results = await Promise.all(
    phase.commands.map((command) => startCommand(command)),
  );

  return results.find((result) => result.code !== 0)?.code ?? 0;
}

async function runSequentialPhase(phase) {
  for (const command of phase.commands) {
    const result = await startCommand(command);

    if (result.code !== 0) {
      return result.code;
    }
  }

  return 0;
}

async function main() {
  console.log(`[runner] ${workflow.description}`);

  for (const phase of workflow.phases) {
    if (shutdownRequested) {
      process.exit(1);
    }

    console.log(`[runner] Starting ${phase.name} phase.`);
    const exitCode = phase.parallel
      ? await runParallelPhase(phase)
      : await runSequentialPhase(phase);

    if (exitCode !== 0) {
      process.exit(exitCode);
    }
  }
}

await main();
