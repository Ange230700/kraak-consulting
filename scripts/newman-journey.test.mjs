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

  for (const scriptName of [
    'test:api:journey',
    'test:api:journey:strict',
    'test:api:journey:strict:staging',
  ]) {
    assert.ok(
      packageJson.scripts[scriptName].includes(
        `pnpm exec newman run ${collectionPath}`,
      ),
      `${scriptName} must use the pinned Newman package and versioned collection`,
    );
  }
});

test('Given a strict staging run, When checking its script Then strict auth targets the staging API', () => {
  const stagingScript = packageJson.scripts['test:api:journey:strict:staging'];

  assert.ok(stagingScript.includes('--env-var strictAuth=true'));
  assert.ok(
    stagingScript.includes(
      '--env-var baseUrl=https://kraak-api-staging.onrender.com',
    ),
  );
});
