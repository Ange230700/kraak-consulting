import assert from 'node:assert/strict';
import childProcess, { spawnSync } from 'node:child_process';
import { syncBuiltinESMExports } from 'node:module';
import test from 'node:test';

import { runQualityGate } from './quality-gate.mjs';

test('Given pnpm absent ou disponible, When le runner natif démarre, Then le processus reçoit le bon exécutable et échoue fermé', (t) => {
  const descriptor = Object.getOwnPropertyDescriptor(process, 'platform');
  const pnpm = process.env.npm_execpath;
  t.after(() => {
    t.mock.restoreAll();
    syncBuiltinESMExports();
    Object.defineProperty(process, 'platform', descriptor);
    if (pnpm === undefined) delete process.env.npm_execpath;
    else process.env.npm_execpath = pnpm;
  });
  for (const platform of ['win32', 'linux']) {
    Object.defineProperty(process, 'platform', {
      ...descriptor,
      value: platform,
    });
    for (const cli of [undefined, 'pnpm.cjs']) {
      if (cli === undefined) delete process.env.npm_execpath;
      else process.env.npm_execpath = cli;
      for (const result of [
        { status: 0 },
        { status: null, error: new Error('introuvable') },
      ]) {
        const calls = [];
        const mock = t.mock.method(childProcess, 'spawnSync', (...args) => {
          calls.push(args);
          return result;
        });
        syncBuiltinESMExports();
        assert.equal(runQualityGate(), result.status === 0 ? 0 : 1);
        assert.equal(calls[0][0], cli ? process.execPath : 'pnpm');
        assert.equal(calls[0][2].shell, !cli && platform === 'win32');
        mock.mock.restore();
        syncBuiltinESMExports();
      }
    }
  }
});

test('Given un import sans argument CLI, When le module quality est chargé, Then aucun contrôle ne démarre', () => {
  const url = new URL('quality-gate.mjs', import.meta.url).href;
  const result = spawnSync(
    process.execPath,
    ['--input-type=module', '-e', `await import(${JSON.stringify(url)});`],
    { encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '');
});
