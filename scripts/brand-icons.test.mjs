import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..');

const appConfigs = [
  {
    label: 'web',
    indexFile: path.join(
      repoRoot,
      'apps',
      'client',
      'projects',
      'web',
      'src',
      'index.html',
    ),
    publicDir: path.join(
      repoRoot,
      'apps',
      'client',
      'projects',
      'web',
      'public',
    ),
  },
  {
    label: 'mobile',
    indexFile: path.join(
      repoRoot,
      'apps',
      'client',
      'projects',
      'mobile',
      'src',
      'index.html',
    ),
    publicDir: path.join(
      repoRoot,
      'apps',
      'client',
      'projects',
      'mobile',
      'public',
    ),
  },
];

const requiredLinks = [
  'href="favicon.ico"',
  'rel="apple-touch-icon"',
  'href="apple-touch-icon.png"',
  'rel="manifest"',
  'href="site.webmanifest"',
];

const requiredAssets = [
  'favicon.ico',
  'apple-touch-icon.png',
  'icon-192x192.png',
  'icon-512x512.png',
  'site.webmanifest',
];

function assertMatch(content, fragment) {
  assert.match(
    content,
    new RegExp(fragment.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)),
  );
}

for (const appConfig of appConfigs) {
  const indexHtml = readFileSync(appConfig.indexFile, 'utf8');

  for (const expectedLink of requiredLinks) {
    assertMatch(indexHtml, expectedLink);
  }

  for (const assetName of requiredAssets) {
    const assetPath = path.join(appConfig.publicDir, assetName);
    assert.equal(
      existsSync(assetPath),
      true,
      `Expected ${appConfig.label} asset to exist: ${assetName}`,
    );
  }
}

console.log('Brand icon assertions passed for web and mobile.');
