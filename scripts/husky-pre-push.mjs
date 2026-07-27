import { spawnSync } from 'node:child_process';
import process from 'node:process';

import { getChangedFiles, resolveBaseRef } from './workspace-git-utils.mjs';

function runCommand(command, args, label) {
  console.info(`[pre-push] ${label}`);

  const useShell = process.platform === 'win32';

  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: useShell,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runPnpm(args, label) {
  const pnpmCommand = 'pnpm';
  runCommand(pnpmCommand, args, label);
}

function isDocsOnly(files) {
  if (files.length === 0) {
    return false;
  }

  return files.every((file) => {
    if (file.endsWith('.md')) {
      return true;
    }

    return (
      file.startsWith('docs/') ||
      file.startsWith('.github/') ||
      file === 'README.md' ||
      file === 'CONTRIBUTING.md' ||
      file === 'AGENTS.md' ||
      file === 'ARCHITECTURE.md'
    );
  });
}

function main() {
  runPnpm(['exec', 'validate-branch-name'], 'Validation du nom de branche');

  const gitOptions = { errorPrefix: '[pre-push]' };
  const changedFiles = getChangedFiles(resolveBaseRef(gitOptions), {
    ...gitOptions,
    warningMessage:
      '[pre-push] Impossible de détecter finement les changements, fallback sur validation minimale.',
  });

  if (changedFiles.length === 0) {
    console.info(
      '[pre-push] Aucun changement détecté dans le diff de branche, contrôles minimaux appliqués.',
    );
    return;
  }

  if (isDocsOnly(changedFiles)) {
    console.info(
      '[pre-push] Changements documentation uniquement, contrôles de code ignorés.',
    );
    return;
  }

  runPnpm(['affected:lint'], 'Lint ciblé des workspaces affectés');
  runPnpm(['affected:test'], 'Tests ciblés des workspaces affectés');
  runPnpm(['test:integration'], "Tests d'intégration API");

  const touchesScripts = changedFiles.some((file) =>
    file.startsWith('scripts/'),
  );

  if (touchesScripts) {
    runPnpm(['test:workspace'], 'Tests des scripts workspace');
  }
}

try {
  main();
} catch (error) {
  console.error('[pre-push] Erreur inattendue durant les contrôles:', error);
  process.exit(1);
}
