import assert from 'node:assert/strict';
import childProcess, { spawnSync } from 'node:child_process';
import { syncBuiltinESMExports } from 'node:module';
import test from 'node:test';
import { runPrePush } from './husky-pre-push.mjs';

test('Given les contrôles pre-push, When ils passent, Then le nom de branche précède la qualité complète', () => {
  const calls = [];
  assert.equal(
    runPrePush((...args) => {
      calls.push(args);
      return 0;
    }),
    0,
  );
  assert.deepEqual(
    calls.map(([command, args]) => [command, args]),
    [
      ['pnpm', ['exec', 'validate-branch-name']],
      ['pnpm', ['check']],
    ],
  );
});

test('Given une erreur de processus ou un code nul, When le runner natif est utilisé, Then le push est bloqué avec un diagnostic', (t) => {
  t.after(() => {
    t.mock.restoreAll();
    syncBuiltinESMExports();
  });
  for (const result of [
    { status: 0 },
    { status: 3 },
    { status: null, error: new Error('introuvable') },
  ]) {
    const mock = t.mock.method(childProcess, 'spawnSync', () => result);
    syncBuiltinESMExports();
    assert.equal(runPrePush(), result.status ?? 1);
    mock.mock.restore();
    syncBuiltinESMExports();
  }
});

test('Given le dispatch CLI pre-push, When un processus réussit ou lève une exception, Then le code de sortie reste explicite', () => {
  const url = new URL('husky-pre-push.mjs', import.meta.url).href;
  for (const [implementation, expected] of [
    ['return {status:0}', 0],
    ['throw new Error("refus")', 1],
  ]) {
    const code = `import cp from 'node:child_process'; import {syncBuiltinESMExports} from 'node:module'; import {fileURLToPath} from 'node:url'; cp.spawnSync=()=>{${implementation}};syncBuiltinESMExports();process.argv[1]=fileURLToPath(${JSON.stringify(url)});await import(${JSON.stringify(url)});`;
    const result = spawnSync(
      process.execPath,
      ['--input-type=module', '-e', code],
      { encoding: 'utf8' },
    );
    assert.equal(result.status, expected, result.stderr);
    if (expected === 1) assert.match(result.stderr, /Erreur inattendue/);
  }
  const result = spawnSync(process.execPath, [
    '--input-type=module',
    '-e',
    `await import(${JSON.stringify(url)});`,
  ]);
  assert.equal(result.status, 0);
});

test('Given un contrôle pre-push en erreur, When le hook s’exécute, Then aucun contrôle suivant ne masque son code', () => {
  let calls = 0;
  assert.equal(
    runPrePush(() => {
      calls += 1;
      return 2;
    }),
    2,
  );
  assert.equal(calls, 1);
});
