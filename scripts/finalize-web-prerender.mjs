import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
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
const defaultRootRedirectDestination = '/fr/';

export function finalizeWebPrerender({
  browserDistFolder = defaultBrowserDistFolder,
  rootRedirectDestination = defaultRootRedirectDestination,
  consoleTarget = console,
} = {}) {
  const notFoundSource = resolve(browserDistFolder, 'fr', '404', 'index.html');
  const notFoundTarget = resolve(browserDistFolder, '404.html');
  const rootRedirectTarget = resolve(browserDistFolder, 'index.html');

  if (!existsSync(notFoundSource)) {
    throw new Error(
      `Impossible de finaliser le prerender web : ${notFoundSource} est introuvable.`,
    );
  }

  mkdirSync(dirname(notFoundTarget), { recursive: true });
  copyFileSync(notFoundSource, notFoundTarget);
  writeFileSync(
    rootRedirectTarget,
    buildStaticRootRedirectHtml(rootRedirectDestination),
    'utf8',
  );
  consoleTarget.info(
    `[web-prerender] 404 statique localisee generee: ${notFoundTarget}`,
  );
  consoleTarget.info(
    `[web-prerender] redirection racine statique generee: ${rootRedirectTarget} -> ${rootRedirectDestination}`,
  );

  return {
    notFoundSource,
    notFoundTarget,
    rootRedirectDestination,
    rootRedirectTarget,
  };
}

export function buildStaticRootRedirectHtml(destination) {
  const escapedDestination = escapeHtml(destination);

  return `<!doctype html>
<html lang="fr-CI">
  <head>
    <meta charset="utf-8" />
    <title>Redirection KRAAK</title>
    <meta name="robots" content="noindex, follow" />
    <meta http-equiv="refresh" content="0; url=${escapedDestination}" />
    <link rel="canonical" href="${escapedDestination}" />
    <script>
      globalThis.location.replace(${JSON.stringify(destination)} + globalThis.location.search + globalThis.location.hash);
    </script>
  </head>
  <body>
    <p>Redirection vers <a href="${escapedDestination}">${escapedDestination}</a>.</p>
  </body>
</html>
`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

if (resolve(process.argv[1] ?? '') === scriptFilePath) {
  finalizeWebPrerender();
}
