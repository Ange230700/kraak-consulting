import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('Given the required E2E gate, When CI runs, Then it executes browser tests against a local server', () => {
  const workflow = readFileSync(
    new URL('../.github/workflows/ci.yml', import.meta.url),
    'utf8',
  );
  const job = workflow.split('\n  e2e:\n')[1]?.split('\n  workspace:\n')[0];
  assert.ok(job, 'Le job E2E requis doit exister.');
  assert.match(job, /playwright install --with-deps/);
  assert.match(job, /run: pnpm test:e2e:all/);
  assert.match(job, /KRAAK_E2E_START_WEB_SERVER: 'true'/);
  assert.match(job, /KRAAK_E2E_WEB_SERVER_COMMAND:/);
  assert.doesNotMatch(
    job,
    /continue-on-error|Tests E2E check reported successfully/,
  );
});
