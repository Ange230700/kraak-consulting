import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const rootDirectory = resolve(import.meta.dirname, '..');
const packageJson = JSON.parse(
  readFileSync(resolve(rootDirectory, 'package.json'), 'utf8'),
);
const collectionPath =
  'apps/api/test/collections/api-user-journey.collection.json';

test('Given the API journey scripts run, When resolving Newman Then they use the versioned collection and pinned package', () => {
  assert.equal(typeof packageJson.devDependencies.newman, 'string');
  assert.match(packageJson.devDependencies.newman, /^\d+\.\d+\.\d+$/);
  assert.ok(existsSync(resolve(rootDirectory, collectionPath)));

  for (const scriptName of ['test:api:journey', 'test:api:journey:strict']) {
    assert.ok(
      packageJson.scripts[scriptName].includes(
        `pnpm exec newman run ${collectionPath}`,
      ),
      `${scriptName} must use the pinned Newman package and versioned collection`,
    );
  }
});

test('Given la régression nocturne, When ses cibles sont inspectées, Then les mêmes contrôles locaux que les PR remplacent les mutations staging', () => {
  assert.equal(
    packageJson.scripts['test:api:journey:strict:staging'],
    undefined,
  );
  const workflow = readFileSync(
    resolve(rootDirectory, '.github/workflows/ci.yml'),
    'utf8',
  );
  assert.match(workflow, /schedule:\s+- cron: '0 2 \* \* \*'/);
  assert.match(workflow, /run: pnpm check/);
  assert.doesNotMatch(
    workflow,
    /KRAAK_JOURNEY_(EMAIL|PASSWORD)|kraak-api-prod/,
  );
});
