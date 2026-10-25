import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const workspaceConfigPath = path.join(
  scriptDirectory,
  '..',
  'apps',
  'client',
  'angular.json',
);

function readWorkspaceConfig() {
  return JSON.parse(readFileSync(workspaceConfigPath, 'utf8'));
}

test('le dev server mobile exclut @kraak/api-client du prebundle Vite', () => {
  const workspaceConfig = readWorkspaceConfig();
  const prebundleConfig =
    workspaceConfig.projects.mobile.architect.serve.options?.prebundle;

  assert.deepEqual(prebundleConfig, {
    exclude: ['@kraak/api-client'],
  });
});
