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
const junitReportPath = 'test-results/postman/api-user-journey.junit.xml';
const stagingScript = packageJson.scripts['test:api:journey:strict:staging'];

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
  assert.ok(stagingScript.includes('--env-var strictAuth=true'));
  assert.ok(
    stagingScript.includes(
      '--env-var baseUrl=https://kraak-api-staging.onrender.com',
    ),
  );
});

test('Given a strict staging run, When assertions fail Then a JUnit report remains available as a workflow artifact', () => {
  const workflow = readFileSync(
    resolve(rootDirectory, '.github/workflows/nightly-regression.yml'),
    'utf8',
  );

  assert.match(stagingScript, /--reporters cli,json,junit\b/);
  assert.ok(
    stagingScript.includes(`--reporter-junit-export ${junitReportPath}`),
  );
  assert.match(
    workflow,
    /if: always\(\)\s+uses: actions\/upload-artifact@[a-f0-9]{40}/,
  );
  const artifactPaths = [...workflow.matchAll(/^\s+path: (.+)$/gm)].map(
    (match) => match[1],
  );
  assert.deepEqual(artifactPaths, [junitReportPath]);
  assert.ok(workflow.includes('pnpm test:api:journey:strict:staging'));
});
