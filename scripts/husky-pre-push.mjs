import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

import { getGitHookChildEnvironment } from './git-hook-environment.mjs';

function runCommand(command, args, label) {
  console.info(`[pre-push] ${label}`);

  const useShell = process.platform === 'win32';

  const result = spawnSync(command, args, {
    env: getGitHookChildEnvironment(),
    stdio: 'inherit',
    shell: useShell,
  });

  if (result.error) {
    console.error('[pre-push] Commande impossible :', result.error);
  }
  return result.status ?? 1;
}

export function runPrePush(run = runCommand) {
  const branchStatus = run(
    'pnpm',
    ['exec', 'validate-branch-name'],
    'Validation du nom de branche',
  );
  if (branchStatus !== 0) return branchStatus;
  return run('pnpm', ['check'], 'Contrôle qualité complet du dépôt');
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    process.exitCode = runPrePush();
  } catch (error) {
    console.error('[pre-push] Erreur inattendue durant les contrôles:', error);
    process.exitCode = 1;
  }
}
