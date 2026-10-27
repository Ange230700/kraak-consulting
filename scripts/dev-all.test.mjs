import assert from 'node:assert/strict';
import test from 'node:test';

import { createDevRunner, resolveSpawnCommand } from './dev-all.mjs';
import { EventEmitter } from 'node:events';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const lockLine = String.raw`EPERM: operation not permitted, rename 'C:\repo\.angular\cache\20\mobile\vite\deps_temp_123'`;
const service = {
  name: 'test',
  color: '',
  preferredPort: 4200,
  cwd: 'workspace',
  command: ['pnpm.cmd', 'test'],
  portArg: true,
};

function setup(overrides = {}) {
  const process = new EventEmitter();
  const output = [];
  const errors = [];
  const exits = [];
  const timers = [];
  const children = [];
  const spawns = [];
  const probes = [];
  const removed = [];
  const failures = new Set();
  Object.assign(process, {
    argv: ['node', 'test'],
    env: {},
    platform: 'linux',
    cwd: () => path.resolve('workspace'),
    stdout: { write: (line) => output.push(line) },
    stderr: { write: (line) => errors.push(line) },
    exit: (code) => exits.push(code),
  });
  const dependencies = {
    process,
    net: {
      createServer() {
        const server = new EventEmitter();
        server.close = (callback) => callback();
        server.listen = (options) => {
          probes.push(options);
          queueMicrotask(() =>
            server.emit(failures.has(options.port) ? 'error' : 'listening'),
          );
        };
        return server;
      },
    },
    spawn(...args) {
      spawns.push(args);
      const child = new EventEmitter();
      child.stdout = new EventEmitter();
      child.stderr = new EventEmitter();
      child.killed = false;
      child.signals = [];
      child.kill = (signal) => child.signals.push(signal);
      children.push(child);
      return child;
    },
    readdir: async () => [
      { name: '20', isDirectory: () => true },
      { name: 'file', isDirectory: () => false },
    ],
    rm: async (...args) => removed.push(args),
    console: { error: (error) => errors.push(error) },
    setTimeout: (callback, delay) => timers.push({ callback, delay }),
    ...overrides,
  };
  const runner = createDevRunner(dependencies);
  return {
    runner,
    process,
    output,
    errors,
    exits,
    timers,
    children,
    spawns,
    probes,
    removed,
    failures,
  };
}

const settle = () => new Promise((resolve) => setImmediate(resolve));

test('Given des ports configurés invalides ou valides, When ils sont analysés, Then seules les valeurs TCP valides sont retenues', () => {
  const context = setup();
  assert.equal(context.runner.parsePortFromEnv('PORT', 10), 10);
  for (const [raw, expected] of [
    [' ', 10],
    ['abc', 10],
    ['0', 10],
    ['-1', 10],
    ['65536', 10],
    [' 4300 ', 4300],
    ['65535', 65535],
  ]) {
    context.process.env.PORT = raw;
    assert.equal(context.runner.parsePortFromEnv('PORT', 10), expected);
  }
});

test('Given des erreurs de cache Windows et Linux, When le diagnostic est effectué, Then seuls les verrous Vite admissibles sont reconnus', () => {
  const { runner } = setup();
  for (const value of [
    undefined,
    1,
    'x'.repeat(16385),
    'EPERM',
    'EPERM: operation not permitted, rename /other/vite/deps_temp_a',
    'EPERM: operation not permitted, rename /.angular/cache/version/other',
  ]) {
    assert.equal(runner.isViteCacheLockLine(value), false);
  }
  assert.equal(runner.isViteCacheLockLine(lockLine), true);
  assert.equal(
    runner.isViteCacheLockLine(lockLine.replaceAll('\\', '/')),
    true,
  );
});

test('Given des chemins internes externes et voisins, When la suppression est préparée, Then la frontière du workspace est respectée', async () => {
  for (const implementation of [path.win32, path.posix]) {
    const root = implementation.resolve('workspace');
    const context = setup({ path: implementation });
    context.process.cwd = () => root;
    assert.equal(context.runner.isPathInsideWorkspace(root), true);
    assert.equal(
      context.runner.isPathInsideWorkspace(implementation.join(root, 'child')),
      true,
    );
    assert.equal(context.runner.isPathInsideWorkspace(`${root}-other`), false);
  }
  const context = setup();
  await context.runner.clearAngularViteCache();
  await context.runner.clearAngularViteCache('mobile');
  assert.equal(context.removed.length, 1);
  assert.equal(context.removed[0][1].maxRetries, 3);
  await assert.rejects(
    context.runner.clearAngularViteCache(path.resolve('outside')),
    /hors workspace/,
  );
  const unsafe = setup({
    path: {
      ...path,
      resolve: (...parts) =>
        parts.includes('apps')
          ? path.resolve('outside')
          : path.resolve(...parts),
    },
  });
  await assert.rejects(
    unsafe.runner.clearAngularViteCache('mobile'),
    /hors workspace/,
  );
});

test('Given un cache absent ou inaccessible, When le nettoyage est tenté, Then seule son absence est tolérée', async () => {
  for (const error of [
    null,
    'failure',
    {},
    { code: 'EACCES' },
    { code: 'ENOENT' },
  ]) {
    const context = setup({
      readdir: async () => {
        throw error;
      },
    });
    if (error?.code === 'ENOENT') {
      await context.runner.clearAngularViteCache('mobile');
    } else {
      await assert.rejects(
        context.runner.clearAngularViteCache('mobile'),
        (actual) => actual === error,
      );
    }
  }
});

test('Given des fragments de flux, When ils se terminent, Then chaque ligne non vide est publiée une seule fois', () => {
  const context = setup();
  const stream = new EventEmitter();
  const lines = [];
  context.runner.forwardStream(stream, 'app', '', (line) => lines.push(line));
  stream.emit('data', Buffer.from('a\r'));
  stream.emit('data', Buffer.from('\n\nb'));
  stream.emit('end');
  assert.deepEqual(lines, ['a', 'b']);
  assert.equal(context.output.length, 2);
  const empty = new EventEmitter();
  context.runner.forwardStream(empty, 'empty', '');
  empty.emit('data', Buffer.from('line\n'));
  empty.emit('end');
  const tail = new EventEmitter();
  context.runner.forwardStream(tail, 'tail', '');
  tail.emit('data', Buffer.from('tail'));
  tail.emit('end');
});

test('Given un port occupé, When le service cherche un port libre, Then le port suivant est retenu', async () => {
  const context = setup();
  context.failures.add(4200);
  await context.runner.startService(service);
  assert.deepEqual(context.spawns[0][1], ['test', '--port', '4201']);
  assert.equal(context.spawns[0][2].shell, false);
  assert.match(context.output[0], /préféré 4200/);
  const api = setup();
  api.failures.add(4200);
  await api.runner.startService({
    ...service,
    portArg: false,
    allowPortFallback: false,
  });
  assert.equal(api.spawns.length, 0);
  assert.match(api.output[0], /démarrage ignoré/);
});

test('Given le dernier port TCP occupé, When aucun port ne reste disponible, Then la recherche échoue explicitement', async () => {
  const context = setup();
  context.failures.add(65535);
  await assert.rejects(
    context.runner.findAvailablePort(65535),
    /Aucun port TCP disponible/,
  );
  assert.deepEqual(
    context.probes.map(({ port }) => port),
    [65535],
  );
});

test('Given deux services configurés sur le même port, When ils démarrent, Then les réservations évitent une collision avant leur écoute', async () => {
  const context = setup();
  await context.runner.startService(service);
  await context.runner.startService(service);
  assert.deepEqual(
    context.spawns.map(([, args]) => args.at(-1)),
    ['4200', '4201'],
  );
  await context.runner.startService({
    ...service,
    allowPortFallback: false,
    portArg: false,
  });
  assert.equal(context.spawns.length, 2);
  context.children[0].emit('exit', 0);
  await context.runner.startService(service);
  assert.equal(context.spawns[2][1].at(-1), '4200');
});

test('Given un service sans argument port, When il démarre, Then son environnement reçoit PORT', async () => {
  const context = setup();
  await context.runner.startService({
    ...service,
    portArg: false,
    allowPortFallback: false,
  });
  assert.equal(context.spawns[0][2].env.PORT, '4200');
  const child = context.children[0];
  child.stderr.emit('data', Buffer.from('message normal\nEADDRINUSE\n'));
  child.emit('exit', 1);
  assert.match(context.output.at(-1), /API existante/);
  assert.equal(context.timers.length, 0);
});

test('Given le mode simulation, When les ports sont libres ou occupés, Then aucune commande ne démarre', async () => {
  for (const [portArg, allowPortFallback, busy] of [
    [true, true, false],
    [true, true, true],
    [false, false, false],
  ]) {
    const runtimeContext = setup();
    const runtime = runtimeContext.process;
    runtime.argv.push('--dry-run');
    const context = setup({ process: runtime });
    if (busy) context.failures.add(4200);
    await context.runner.startService({
      ...service,
      portArg,
      allowPortFallback,
    });
    assert.equal(context.spawns.length, 0);
    assert.match(runtimeContext.output[0], /simulation sur port/);
    assert.equal(runtimeContext.output[0].includes('préféré'), busy);
  }
});

test('Given une course sur un port, When le service annonce son occupation, Then il redémarre sur le port suivant', async () => {
  const context = setup();
  await context.runner.startService(service);
  const child = context.children[0];
  child.stdout.emit('data', Buffer.from('prêt\n'));
  child.stdout.emit('end');
  child.stderr.emit(
    'data',
    Buffer.from('normal\nPort 4200 is already in use\n'),
  );
  child.emit('exit', 1);
  await settle();
  assert.deepEqual(child.signals, ['SIGTERM']);
  assert.equal(context.spawns.length, 2);
  assert.deepEqual(context.spawns[1][1], ['test', '--port', '4201']);
});

test('Given une nouvelle tentative impossible, When le processus finit, Then l’erreur entraîne un arrêt contrôlé', async () => {
  let calls = 0;
  const context = setup({
    spawn: () => {
      calls += 1;
      if (calls > 1) throw new Error('nouvelle tentative impossible');
      return child;
    },
  });
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.kill = () => {};
  await context.runner.startService(service);
  child.stderr.emit('data', Buffer.from('Port 4200 is already in use\n'));
  child.emit('exit', 1);
  await settle();
  assert.match(context.errors[0].message, /impossible/);
  assert.equal(context.timers.length, 2);
});

test('Given un verrou Vite, When le service échoue, Then le cache est nettoyé et le service est relancé', async () => {
  const context = setup();
  await context.runner.startService({
    ...service,
    portArg: false,
    angularCacheProject: 'mobile',
  });
  context.children[0].stderr.emit(
    'data',
    Buffer.from(`${lockLine}\n${lockLine}\n`),
  );
  context.children[0].emit('exit', 1);
  await settle();
  assert.equal(context.removed.length, 1);
  assert.equal(context.spawns.length, 2);
  const limit = setup();
  await limit.runner.startService({
    ...service,
    angularCacheProject: 'mobile',
    cacheRecoveryAttempts: 2,
    portArg: false,
  });
  limit.children[0].stderr.emit('data', Buffer.from(`${lockLine}\n`));
  limit.children[0].emit('exit', 2);
  assert.equal(limit.removed.length, 0);
  assert.equal(limit.timers.length, 2);
});

test('Given un nettoyage refusé, When une récupération Vite est nécessaire, Then l’erreur est journalisée', async () => {
  const context = setup({
    readdir: async () => {
      throw new Error('accès refusé');
    },
  });
  await context.runner.startService({
    ...service,
    portArg: false,
    angularCacheProject: 'mobile',
  });
  context.children[0].stderr.emit('data', Buffer.from(`${lockLine}\n`));
  context.children[0].emit('exit', 1);
  await settle();
  assert.match(context.errors[0].message, /refusé/);
  assert.equal(context.timers.length, 2);
});

test('Given des enfants actifs, When un arrêt est demandé plusieurs fois, Then les signaux et temporisations restent uniques', async () => {
  const context = setup();
  await context.runner.startService(service);
  await context.runner.startService(service);
  context.children[0].killed = true;
  context.runner.shutdown();
  context.runner.shutdown(3);
  assert.deepEqual(
    context.timers.map((timer) => timer.delay),
    [1500, 2000],
  );
  context.timers.forEach((timer) => timer.callback());
  assert.deepEqual(context.children[0].signals, ['SIGINT']);
  assert.deepEqual(context.children[1].signals, ['SIGINT', 'SIGTERM']);
  assert.deepEqual(context.exits, [0]);
  context.children[0].emit('exit', 1);
  assert.equal(context.errors.length, 0);
});

test('Given un code de sortie nul absent ou non nul, When le service finit, Then seul un échec arrête les autres services', async () => {
  for (const code of [0, null, 5]) {
    const context = setup();
    await context.runner.startService(service);
    context.children[0].emit('exit', code);
    assert.match(context.errors[0], new RegExp(`code ${code ?? 0}`));
    assert.equal(context.timers.length, code === 5 ? 2 : 0);
    context.timers.forEach((timer) => timer.callback());
    assert.deepEqual(context.exits, code === 5 ? [5] : []);
  }
});

test('Given les services par défaut, When le runner démarre et reçoit un signal, Then chaque service est suivi et arrêté', async () => {
  for (const signal of ['SIGINT', 'SIGTERM']) {
    const context = setup();
    await context.runner.main();
    assert.equal(context.spawns.length, 3);
    context.process.emit(signal);
    assert.ok(
      context.children.every((child) => child.signals.includes('SIGINT')),
    );
  }
  const failed = setup({
    spawn: () => {
      throw new Error('lancement refusé');
    },
  });
  await failed.runner.main();
  assert.match(failed.errors[0].message, /refusé/);
  assert.equal(failed.timers.length, 2);
});

test('Given les variantes Windows et Linux, When la commande est résolue, Then le wrapper approprié est choisi', () => {
  assert.deepEqual(resolveSpawnCommand('node.exe', [], 'win32'), {
    command: 'node.exe',
    args: [],
  });
  assert.equal(
    resolveSpawnCommand('build.BAT', [], 'win32', {}).command,
    'cmd.exe',
  );
  assert.equal(
    resolveSpawnCommand('pnpm.cmd', [], 'win32', { ComSpec: 'custom.exe' })
      .command,
    'custom.exe',
  );
  assert.ok(resolveSpawnCommand('node', []).command);
});

test('Given la CLI en simulation, When Node démarre, Then les services sont annoncés sans lancement réel', () => {
  const result = spawnSync(
    process.execPath,
    [fileURLToPath(new URL('./dev-all.mjs', import.meta.url)), '--dry-run'],
    { encoding: 'utf8' },
  );
  assert.equal(result.status, 0);
  assert.match(result.stdout, /\[web\].*simulation/);
  assert.match(result.stdout, /\[mobile\].*simulation/);
});

test('Given aucun chemin CLI, When le module est importé, Then il reste inactif', () => {
  const moduleUrl = new URL('./dev-all.mjs', import.meta.url).href;
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
