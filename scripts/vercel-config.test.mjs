import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const vercelConfig = JSON.parse(
  readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'),
);

const expectedStaticOutputDirectory = 'apps/client/dist/web/browser';
const expectedStagingOnlyIgnoreCommand =
  'case "$VERCEL_GIT_COMMIT_REF" in staging) exit 0 ;; *) exit 1 ;; esac';

test('Given le build web prerender, When Vercel publie le site, Then le dossier browser est servi', () => {
  assert.equal(vercelConfig.outputDirectory, expectedStaticOutputDirectory);
});

test('Given la branche staging, When Vercel reçoit un push, Then le build automatique reste autorisé uniquement sur staging', () => {
  assert.equal(vercelConfig.ignoreCommand, expectedStagingOnlyIgnoreCommand);
});
