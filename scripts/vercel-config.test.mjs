import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const vercelConfig = JSON.parse(
  readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'),
);

const expectedStaticOutputDirectory = 'apps/client/dist/web/browser';

test('Given le build web prerender, When Vercel publie le site, Then le dossier browser est servi', () => {
  assert.equal(vercelConfig.outputDirectory, expectedStaticOutputDirectory);
});
