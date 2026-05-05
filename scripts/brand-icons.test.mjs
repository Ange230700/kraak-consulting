import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

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
  'href="favicon-32x32.png"',
  'href="favicon-16x16.png"',
  'rel="apple-touch-icon"',
  'sizes="180x180"',
  'href="apple-touch-icon.png"',
  'rel="manifest"',
  'href="site.webmanifest"',
];

const requiredAssets = [
  'favicon.ico',
  'favicon-32x32.png',
  'favicon-16x16.png',
  'apple-touch-icon.png',
  'icon-192x192.png',
  'icon-512x512.png',
  'site.webmanifest',
];

const requiredManifestIconSizes = ['192x192', '512x512'];

function assertMatch(content, fragment) {
  assert.match(
    content,
    new RegExp(fragment.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)),
  );
}

test('brand icons are configured for web and mobile', () => {
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

      assert.ok(
        statSync(assetPath).size > 0,
        `Expected ${appConfig.label} asset to be non-empty: ${assetName}`,
      );
    }

    const manifestPath = path.join(appConfig.publicDir, 'site.webmanifest');
    const manifestContent = readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);

    assert.equal(
      manifest.name,
      'KRAAK',
      `Expected ${appConfig.label} manifest name to be KRAAK`,
    );
    assert.equal(
      manifest.short_name,
      'KRAAK',
      `Expected ${appConfig.label} manifest short_name to be KRAAK`,
    );
    assert.equal(
      manifest.lang,
      'fr',
      `Expected ${appConfig.label} manifest lang to be fr`,
    );
    assert.equal(
      manifest.theme_color,
      '#122b4a',
      `Expected ${appConfig.label} manifest theme_color to match brand color`,
    );
    assert.equal(
      manifest.background_color,
      '#122b4a',
      `Expected ${appConfig.label} manifest background_color to match brand color`,
    );

    const manifestIconSizes = new Set(
      (manifest.icons ?? []).map((icon) => icon.sizes),
    );

    for (const expectedSize of requiredManifestIconSizes) {
      assert.equal(
        manifestIconSizes.has(expectedSize),
        true,
        `Expected ${appConfig.label} manifest to include icon size: ${expectedSize}`,
      );
    }
  }
});
