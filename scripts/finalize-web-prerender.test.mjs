import assert from 'node:assert/strict';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  buildStaticRootRedirectHtml,
  finalizeWebPrerender,
} from './finalize-web-prerender.mjs';

test('Given a prerendered /fr/404 route, When finalizing the web build, Then root 404.html is generated for static hosting', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'kraak-web-prerender-'));
  const browserDistFolder = join(tempRoot, 'browser');
  const notFoundRouteFolder = join(browserDistFolder, 'fr', '404');
  const expectedHtml = '<title>Page introuvable | KRAAK Consulting</title>';

  try {
    mkdirSync(notFoundRouteFolder, { recursive: true });
    writeFileSync(
      join(notFoundRouteFolder, 'index.html'),
      expectedHtml,
      'utf8',
    );

    const result = finalizeWebPrerender({
      browserDistFolder,
      consoleTarget: { info: () => undefined },
    });

    assert.equal(
      readFileSync(join(browserDistFolder, '404.html'), 'utf8'),
      expectedHtml,
    );
    assert.equal(result.notFoundTarget, join(browserDistFolder, '404.html'));
    assert.equal(
      result.notFoundSource,
      join(browserDistFolder, 'fr', '404', 'index.html'),
    );
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('Given a finalized static host output, When root index.html is generated, Then it redirects to the localized French home', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'kraak-web-prerender-'));
  const browserDistFolder = join(tempRoot, 'browser');
  const notFoundRouteFolder = join(browserDistFolder, 'fr', '404');

  try {
    mkdirSync(notFoundRouteFolder, { recursive: true });
    writeFileSync(
      join(notFoundRouteFolder, 'index.html'),
      '<title>404</title>',
      'utf8',
    );

    const result = finalizeWebPrerender({
      browserDistFolder,
      consoleTarget: { info: () => undefined },
    });
    const rootHtml = readFileSync(result.rootRedirectTarget, 'utf8');

    assert.match(rootHtml, /<html lang="fr-CI">/);
    assert.match(rootHtml, /<meta name="robots" content="noindex, follow" \/>/);
    assert.match(rootHtml, /<link rel="canonical" href="\/fr\/" \/>/);
    assert.match(rootHtml, /location\.replace\("\/fr\/"/);
    assert.equal(result.rootRedirectDestination, '/fr/');
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('Given the static root redirect HTML, When it is built, Then query string and hash preservation are encoded in the client fallback', () => {
  const html = buildStaticRootRedirectHtml('/fr/');

  assert.match(
    html,
    /location\.replace\("\/fr\/" \+ globalThis\.location\.search \+ globalThis\.location\.hash\)/,
  );
});
