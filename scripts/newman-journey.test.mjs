import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

import { createStagingJourneyOptions } from './run-staging-journey.mjs';

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

  for (const scriptName of ['test:api:journey', 'test:api:journey:strict']) {
    assert.ok(
      packageJson.scripts[scriptName].includes(
        `pnpm exec newman run ${collectionPath}`,
      ),
      `${scriptName} must use the pinned Newman package and versioned collection`,
    );
  }
});

test('Given a strict staging run, When checking its script Then strict auth targets the staging API', () => {
  assert.equal(stagingScript, 'node ./scripts/run-staging-journey.mjs');
  const workflow = readFileSync(
    resolve(rootDirectory, '.github/workflows/nightly-regression.yml'),
    'utf8',
  );
  assert.match(
    workflow,
    /KRAAK_JOURNEY_BASE_URL: https:\/\/kraak-api-staging\.onrender\.com/,
  );
  assert.match(
    workflow,
    /KRAAK_JOURNEY_EMAIL: \$\{\{ secrets\.KRAAK_JOURNEY_EMAIL \}\}/,
  );
  assert.match(
    workflow,
    /KRAAK_JOURNEY_PASSWORD: \$\{\{ secrets\.KRAAK_JOURNEY_PASSWORD \}\}/,
  );
});

test('Given a strict staging run, When assertions fail Then a JUnit report remains available as a workflow artifact', () => {
  const workflow = readFileSync(
    resolve(rootDirectory, '.github/workflows/nightly-regression.yml'),
    'utf8',
  );

  const options = createStagingJourneyOptions({
    KRAAK_JOURNEY_BASE_URL: 'https://staging.example.test',
    KRAAK_JOURNEY_EMAIL: 'journey@example.test',
    KRAAK_JOURNEY_PASSWORD: 'test-only-password',
  });
  assert.deepEqual(options.reporters, ['cli', 'junit']);
  assert.equal(options.reporter.junit.export, junitReportPath);
  assert.ok(workflow.includes(`hashFiles('${junitReportPath}') != ''`));
  assert.match(workflow, /uses: actions\/upload-artifact@[a-f0-9]{40}/);
  const artifactPaths = [...workflow.matchAll(/^\s+path: (.+)$/gm)].map(
    (match) => match[1],
  );
  assert.deepEqual(artifactPaths, [junitReportPath]);
  assert.ok(workflow.includes('pnpm test:api:journey:strict:staging'));
});
