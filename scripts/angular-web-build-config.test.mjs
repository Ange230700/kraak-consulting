import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const angularWorkspace = JSON.parse(
  readFileSync(new URL('../apps/client/angular.json', import.meta.url), 'utf8'),
);

const webBuildOptions =
  angularWorkspace.projects?.web?.architect?.build?.options ?? {};

test('Given the web production build, When CSP forbids inline event handlers, Then critical CSS inlining stays disabled', () => {
  assert.equal(webBuildOptions.optimization?.styles?.inlineCritical, false);
});
