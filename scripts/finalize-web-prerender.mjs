import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptFilePath = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(scriptFilePath), '..');
const defaultBrowserDistFolder = resolve(
  repoRoot,
  'apps',
  'client',
  'dist',
  'web',
  'browser',
);

export function finalizeWebPrerender({
  browserDistFolder = defaultBrowserDistFolder,
  consoleTarget = console,
} = {}) {
  const notFoundSource = resolve(browserDistFolder, '404', 'index.html');
  const notFoundTarget = resolve(browserDistFolder, '404.html');

  if (!existsSync(notFoundSource)) {
    throw new Error(
      `Impossible de finaliser le prerender web : ${notFoundSource} est introuvable.`,
    );
  }

  mkdirSync(dirname(notFoundTarget), { recursive: true });
  copyFileSync(notFoundSource, notFoundTarget);
  consoleTarget.info(
    `[web-prerender] 404 statique générée: ${notFoundTarget}`,
  );

  return { notFoundSource, notFoundTarget };
}

if (resolve(process.argv[1] ?? '') === scriptFilePath) {
  finalizeWebPrerender();
}
