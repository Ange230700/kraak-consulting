import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const workflow = readFileSync(
  new URL('../.github/workflows/ci.yml', import.meta.url),
  'utf8',
);
const browserJob = workflow
  .split('\n  e2e-browsers:\n')[1]
  ?.split('\n  e2e:\n')[0];
const gate = workflow.split('\n  e2e:\n')[1]?.split('\n  workspace:\n')[0];

test('Given browser dependencies, When CI starts, Then the preinstalled image matches the installed Playwright version', () => {
  const require = createRequire(
    new URL('../apps/client/package.json', import.meta.url),
  );
  const { version } = require('@playwright/test/package.json');
  assert.ok(
    browserJob?.includes(
      `image: mcr.microsoft.com/playwright:v${version}-noble`,
    ),
  );
  assert.doesNotMatch(browserJob, /playwright install|continue-on-error/);
});

test('Given desktop and mobile coverage, When CI runs, Then every project runs independently with diagnostics', () => {
  for (const project of [
    'chromium',
    'firefox',
    'webkit',
    'chrome-android',
    'safari-iphone',
  ]) {
    assert.ok(browserJob.includes(`- project: ${project}\n`));
  }
  assert.match(browserJob, /fail-fast: false/);
  assert.match(
    browserJob,
    /playwright test --config=\$\{\{ matrix.config \}\} --project=\$\{\{ matrix.project \}\}/,
  );
  assert.match(browserJob, /--global-timeout=1200000/);
  assert.match(browserJob, /KRAAK_E2E_START_WEB_SERVER: 'true'/);
  assert.match(
    browserJob,
    /name: playwright-results-\$\{\{ matrix.project \}\}/,
  );
});

test('Given a failed cancelled or skipped browser job, When the required gate runs, Then it only accepts success', () => {
  assert.match(gate, /name: Tests E2E/);
  assert.match(gate, /needs: e2e-browsers/);
  assert.match(gate, /if: \$\{\{ always\(\) \}\}/);
  assert.match(gate, /E2E_RESULT: \$\{\{ needs.e2e-browsers.result \}\}/);
  assert.match(gate, /run: test "\$E2E_RESULT" = success/);
});
