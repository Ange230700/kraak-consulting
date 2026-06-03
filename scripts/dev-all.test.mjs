import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveSpawnCommand } from './dev-all.mjs';

test('Given un script .cmd sous Windows, When on prepare la commande, Then cmd.exe enveloppe le lancement', () => {
  const resolved = resolveSpawnCommand('pnpm.cmd', ['--version'], 'win32');

  assert.equal(resolved.command, process.env.ComSpec ?? 'cmd.exe');
  assert.deepEqual(resolved.args, ['/d', '/s', '/c', 'pnpm.cmd', '--version']);
});

test('Given une commande non .cmd hors Windows, When on prepare la commande, Then elle est conservée telle quelle', () => {
  const resolved = resolveSpawnCommand('pnpm', ['--version'], 'linux');

  assert.equal(resolved.command, 'pnpm');
  assert.deepEqual(resolved.args, ['--version']);
});
