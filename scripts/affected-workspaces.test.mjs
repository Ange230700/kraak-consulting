import assert from 'node:assert/strict';
import test from 'node:test';

import {
  collectAffectedWorkspaceNames,
  getCommandPlan,
} from './affected-workspaces.mjs';

test('Given root-sensitive files, When collecting affected workspaces, Then all workspaces are selected', () => {
  const affectedWorkspaceNames = collectAffectedWorkspaceNames([
    'package.json',
  ]);

  assert.deepEqual(affectedWorkspaceNames, [
    'api',
    'client-web',
    'client-mobile',
    'contracts',
    'domain',
    'api-client',
    'tokens',
  ]);
});

test('Given web-only files, When collecting affected workspaces, Then only the web target is selected', () => {
  const affectedWorkspaceNames = collectAffectedWorkspaceNames([
    'apps/client/projects/web/src/app/home.component.ts',
  ]);

  assert.deepEqual(affectedWorkspaceNames, ['client-web']);
});

test('Given mobile-only files, When collecting affected workspaces, Then only the mobile target is selected', () => {
  const affectedWorkspaceNames = collectAffectedWorkspaceNames([
    'apps/client/projects/mobile/src/app/home.component.ts',
  ]);

  assert.deepEqual(affectedWorkspaceNames, ['client-mobile']);
});

test('Given a root client file, When collecting affected workspaces, Then both client targets are selected', () => {
  const affectedWorkspaceNames = collectAffectedWorkspaceNames([
    'apps/client/angular.json',
  ]);

  assert.deepEqual(affectedWorkspaceNames, ['client-web', 'client-mobile']);
});

test('Given affected workspaces, When building the command plan, Then duplicate commands are removed', () => {
  const commandPlan = getCommandPlan('lint', ['client-web', 'client-mobile']);

  assert.deepEqual(commandPlan, [
    {
      workspaceName: 'client-web',
      command: ['pnpm', '--filter', '@kraak/client', 'lint'],
    },
  ]);
});
