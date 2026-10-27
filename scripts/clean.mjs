import { rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDirectory, '..');

const targetsByWorkspace = new Map([
  [
    '.',
    ['.cache', 'blob-report', 'coverage', 'playwright-report', 'test-results'],
  ],
  [
    'apps/client',
    [
      '.angular',
      'blob-report',
      'coverage',
      'dist',
      'playwright-report',
      'test-results',
    ],
  ],
  ['apps/api', ['coverage', 'dist']],
  ['packages/api-client', ['coverage', 'dist']],
  ['packages/contracts', ['coverage', 'dist']],
  ['packages/domain', ['coverage', 'dist']],
  ['packages/tokens', ['coverage', 'dist']],
]);

export async function cleanWorkspace(workspacePath, directory, dryRun) {
  const targets = targetsByWorkspace.get(workspacePath);

  if (targets) {
    if (!dryRun) {
      await Promise.all(
        targets.map((target) =>
          rm(path.join(directory, target), { force: true, recursive: true }),
        ),
      );
    }

    const action = dryRun ? 'seraient nettoyés' : 'nettoyés';
    console.log(`[clean] ${workspacePath} : ${targets.join(', ')} ${action}.`);
    return 0;
  } else {
    console.error(
      `Aucune configuration clean définie pour le workspace "${workspacePath}".`,
    );
    return 1;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.exitCode = await cleanWorkspace(
    normalizeWorkspacePath(path.relative(repoRoot, process.cwd())),
    process.cwd(),
    process.argv.includes('--dry-run'),
  );
}

function normalizeWorkspacePath(value) {
  if (!value) {
    return '.';
  }

  return value.split(path.sep).join('/');
}
