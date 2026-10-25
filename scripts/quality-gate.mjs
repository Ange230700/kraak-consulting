import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

import { getGitHookChildEnvironment } from './git-hook-environment.mjs';

export function getQualityCommands(mode) {
  if (mode === '--coverage') {
    return [
      'test:workspace:coverage',
      'test:api:coverage',
      'test:client:coverage',
      'test:libs:coverage',
    ];
  }

  if (mode !== undefined && mode !== '--full') {
    throw new Error(`Option de contrôle qualité inconnue : ${mode}`);
  }

  const commands = ['format:check', 'lint:code', 'typecheck', 'test:coverage'];

  return mode === '--full'
    ? [...commands, 'build', 'test:e2e:all', 'sonar']
    : commands;
}

function runPnpm(script) {
  const pnpmCli = process.env.npm_execpath;
  const result = spawnSync(
    pnpmCli ? process.execPath : 'pnpm',
    pnpmCli ? [pnpmCli, 'run', script] : ['run', script],
    {
      env: getGitHookChildEnvironment(),
      stdio: 'inherit',
      shell: !pnpmCli && process.platform === 'win32',
    },
  );

  if (result.error) {
    console.error(`[quality] Impossible de lancer ${script} :`, result.error);
  }

  return result.status ?? 1;
}

export function runQualityGate(mode, run = runPnpm) {
  const failures = [];
  for (const script of getQualityCommands(mode)) {
    console.info(`[quality] ${script}`);
    if (run(script) !== 0) {
      failures.push(script);
      if (mode !== '--coverage') {
        break;
      }
    }
  }

  if (failures.length > 0) {
    console.error(`[quality] Contrôles en échec : ${failures.join(', ')}`);
    return 1;
  }

  return 0;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    if (process.argv.length > 3) {
      throw new Error('Une seule option de contrôle qualité est autorisée.');
    }
    process.exitCode = runQualityGate(process.argv[2]);
  } catch (error) {
    console.error('[quality] Contrôle impossible :', error);
    process.exitCode = 1;
  }
}
