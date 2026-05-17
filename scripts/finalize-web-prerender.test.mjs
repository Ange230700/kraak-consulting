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

import { finalizeWebPrerender } from './finalize-web-prerender.mjs';

test('Given a prerendered /404 route, When finalizing the web build, Then root 404.html is generated for static hosting', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'kraak-web-prerender-'));
  const browserDistFolder = join(tempRoot, 'browser');
  const notFoundRouteFolder = join(browserDistFolder, '404');
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
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});
