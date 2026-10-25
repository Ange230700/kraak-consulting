import assert from 'node:assert/strict';
import test from 'node:test';
import { EventEmitter } from 'node:events';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runWorkspaceWorkflow } from './workspace-runner.mjs';

test('Given un workflow inconnu, When le runner démarre, Then il indique les workflows disponibles', async () => {
  const { runWorkspaceWorkflow } = await import('./workspace-runner.mjs');
  const errors = [];
  const exits = [];
  await runWorkspaceWorkflow({
    process: {
      argv: ['node', 'runner', 'absent'],
      exit: (code) => exits.push(code),
    },
    console: { error: (message) => errors.push(message) },
  });
  assert.deepEqual(exits, [1]);
  assert.match(errors[0], /Available workflows: test/);
});

function setup({
  platform = 'linux',
  env = {},
  outcomes = [[0]],
  phases,
} = {}) {
  const runtime = new EventEmitter();
  const output = [];
  const errors = [];
  const exits = [];
  const children = [];
  const spawns = [];
  Object.assign(runtime, {
    argv: ['node', 'runner', 'test'],
    platform,
    env,
    cwd: () => 'workspace',
    stdout: { write: (line) => output.push(line) },
    stderr: { write: (line) => errors.push(line) },
    exit: (code) => exits.push(code),
  });
  const command = { name: 'essai', args: ['test'] };
  const options = {
    process: runtime,
    console: { log() {} },
    workflows: {
      test: {
        description: 'Vérification',
        phases: phases ?? [
          { name: 'unit', commands: [command], parallel: false },
        ],
      },
    },
    spawn: (...args) => {
      spawns.push(args);
      const child = new EventEmitter();
      child.stdout = new EventEmitter();
      child.stderr = new EventEmitter();
      child.killed = false;
      child.signals = [];
      child.kill = (signal) => {
        child.signals.push(signal);
        child.killed = true;
      };
      children.push(child);
      const outcome = outcomes.shift();
      queueMicrotask(() => {
        child.stdout.emit('data', Buffer.from('première\r'));
        child.stdout.emit('data', Buffer.from('\nseconde\nfin'));
        child.stdout.emit('end');
        child.stderr.emit('end');
        child.stderr.emit('data', Buffer.from('erreur\n'));
        child.stderr.emit('end');
        if (outcome?.[0] === 'error') {
          child.emit('error', new Error('échec de lancement'));
        } else if (outcome) {
          child.emit('close', ...outcome);
        }
      });
      return child;
    },
  };
  return { options, runtime, output, errors, exits, children, spawns };
}

test('Given un processus Linux, When la commande finit, Then les flux sont préfixés et le shell est évité', async () => {
  const context = setup();
  await runWorkspaceWorkflow(context.options);
  assert.equal(context.spawns[0][0], 'pnpm');
  assert.deepEqual(context.output, [
    '[essai] première\n',
    '[essai] seconde\n',
    '[essai] fin\n',
  ]);
  assert.deepEqual(context.errors, ['[essai] erreur\n']);
  assert.deepEqual(context.exits, []);
});

test('Given des arguments Windows, When la commande démarre, Then les espaces guillemets et antislashs sont protégés', async () => {
  const args = ['', 'simple', 'a b', 'a\tb', 'a"b', 'a\\"b', 'a\\ b\\'];
  const context = setup({
    platform: 'win32',
    env: { ComSpec: 'custom.cmd' },
    phases: [{ name: 'windows', commands: [{ name: 'win', args }] }],
  });
  await runWorkspaceWorkflow(context.options);
  const [command, commandArgs, options] = context.spawns[0];
  assert.equal(command, 'custom.cmd');
  assert.deepEqual(commandArgs.slice(0, 3), ['/d', '/s', '/c']);
  assert.equal(
    commandArgs[3],
    'pnpm.cmd "" simple "a b" "a\tb" "a\\"b" "a\\\\\\"b" "a\\ b\\\\"',
  );
  assert.equal(options.windowsVerbatimArguments, true);
  const fallback = setup({ platform: 'win32' });
  await runWorkspaceWorkflow(fallback.options);
  assert.equal(fallback.spawns[0][0], 'cmd.exe');
});

for (const [label, outcome, expected] of [
  ['code explicite', [7], 7],
  ['signal sans code', [null, 'SIGTERM'], 1],
  ['fermeture sans code ni signal', [null, null], undefined],
  ['erreur de lancement', ['error'], 1],
]) {
  test(`Given ${label}, When la phase séquentielle finit, Then le résultat est propagé`, async () => {
    const context = setup({ outcomes: [outcome] });
    await runWorkspaceWorkflow(context.options);
    assert.deepEqual(context.exits, expected === undefined ? [] : [expected]);
  });
}

for (const failure of [false, true]) {
  test(`Given une phase parallèle ${failure ? 'en échec' : 'réussie'}, When elle finit, Then le premier échec est conservé`, async () => {
    const commands = [
      { name: 'a', args: [] },
      { name: 'b', args: [] },
    ];
    const context = setup({
      outcomes: [[0], [failure ? 4 : 0]],
      phases: [{ name: 'parallel', commands, parallel: true }],
    });
    await runWorkspaceWorkflow(context.options);
    assert.equal(context.spawns.length, 2);
    assert.deepEqual(context.exits, failure ? [4] : []);
  });
}

test('Given des enfants actifs et déjà arrêtés, When les signaux arrivent, Then seuls les actifs sont arrêtés et la phase suivante est annulée', async () => {
  const commands = [
    { name: 'a', args: [] },
    { name: 'b', args: [] },
  ];
  const context = setup({
    outcomes: [],
    phases: [
      { name: 'parallel', commands, parallel: true },
      { name: 'next', commands: [] },
    ],
  });
  const pending = runWorkspaceWorkflow(context.options);
  context.children[0].killed = true;
  context.runtime.emit('SIGINT');
  context.children[0].killed = false;
  context.runtime.emit('SIGTERM');
  assert.deepEqual(context.children[0].signals, ['SIGTERM']);
  assert.deepEqual(context.children[1].signals, ['SIGINT']);
  context.children.forEach((child) => child.emit('close', 0));
  await pending;
  assert.deepEqual(context.exits, [1]);
});

test('Given la CLI sans workflow, When Node exécute le runner, Then la sortie est en erreur', () => {
  const result = spawnSync(
    process.execPath,
    [fileURLToPath(new URL('./workspace-runner.mjs', import.meta.url))],
    { encoding: 'utf8' },
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown workflow/);
});

test('Given la CLI et des commandes réussies, When toutes les phases finissent, Then le runner termine normalement', () => {
  const preload = `
    import childProcess from 'node:child_process';
    import { EventEmitter } from 'node:events';
    import { syncBuiltinESMExports } from 'node:module';
    childProcess.spawn = () => {
      const child = new EventEmitter();
      child.stdout = new EventEmitter();
      child.stderr = new EventEmitter();
      queueMicrotask(() => child.emit('close', 0));
      return child;
    };
    syncBuiltinESMExports();
  `;
  const result = spawnSync(
    process.execPath,
    [
      '--import',
      `data:text/javascript,${encodeURIComponent(preload)}`,
      fileURLToPath(new URL('./workspace-runner.mjs', import.meta.url)),
      'test',
    ],
    { encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Starting end-to-end phase/);
});

test('Given aucun chemin de script, When le module est importé, Then la CLI ne démarre pas', () => {
  const moduleUrl = new URL('./workspace-runner.mjs', import.meta.url).href;
  const result = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '--eval',
      `delete process.argv[1]; await import(${JSON.stringify(moduleUrl)});`,
    ],
    { encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '');
});
