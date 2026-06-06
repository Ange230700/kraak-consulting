import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import process from 'node:process';

function resolveGitExecutable() {
  const candidates = [];

  if (process.env.GIT_EXECUTABLE) {
    candidates.push(process.env.GIT_EXECUTABLE);
  }

  if (process.platform === 'win32') {
    candidates.push(
      String.raw`C:\Program Files\Git\cmd\git.exe`,
      String.raw`C:\Program Files\Git\bin\git.exe`,
    );
  } else {
    candidates.push(
      '/usr/bin/git',
      '/usr/local/bin/git',
      '/opt/homebrew/bin/git',
    );
  }

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    '[pre-push] Exécutable git introuvable. Définissez GIT_EXECUTABLE avec un chemin absolu fiable.',
  );
}

const gitExecutable = resolveGitExecutable();

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

function runGit(args) {
  return spawnSync(gitExecutable, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function getGitOutput(args) {
  const result = runGit(args);

  if (result.status !== 0) {
    return '';
  }

  return result.stdout.trim();
}

function refExists(ref) {
  const result = runGit([
    'rev-parse',
    '--verify',
    '--quiet',
    `${ref}^{commit}`,
  ]);
  return result.status === 0;
}

function resolveBaseRef() {
  const upstream = getGitOutput([
    'rev-parse',
    '--abbrev-ref',
    '--symbolic-full-name',
    '@{upstream}',
  ]);

  if (upstream && refExists(upstream)) {
    return upstream;
  }

  const candidates = [
    'origin/staging',
    'origin/main',
    'staging',
    'main',
    'HEAD~1',
  ];

  for (const candidate of candidates) {
    if (refExists(candidate)) {
      return candidate;
    }
  }

  return 'HEAD~1';
}

function getChangedFiles(baseRef) {
  const result = runGit([
    'diff',
    '--name-only',
    '--diff-filter=ACMRTUXB',
    `${baseRef}...HEAD`,
  ]);

  if (result.status !== 0) {
    console.warn(
      '[pre-push] Impossible de détecter finement les changements, fallback sur validation minimale.',
    );
    return [];
  }

  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
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

  const changedFiles = getChangedFiles(resolveBaseRef());

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
