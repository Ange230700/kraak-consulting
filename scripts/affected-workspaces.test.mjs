import assert from 'node:assert/strict';
import test from 'node:test';

import {
  collectAffectedWorkspaceNames,
  getCommandPlan,
  main,
  runCommand,
  runCli,
} from './affected-workspaces.mjs';
import { spawnSync } from 'node:child_process';
import { mock } from 'node:test';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(
  new URL('./affected-workspaces.mjs', import.meta.url),
);

test('Given des fichiers racine et sans workspace, When les commandes sont collectées, Then les préfixes et absences sont respectés', () => {
  assert.equal(collectAffectedWorkspaceNames(['scripts/tool.mjs']).length, 7);
  assert.deepEqual(collectAffectedWorkspaceNames(['docs/readme.md']), []);
  assert.deepEqual(
    getCommandPlan('build', ['missing', 'tokens', 'api-client']),
    [],
  );
});

test('Given les plateformes Windows et Linux, When une commande réussit ou échoue, Then le shell et le code sont transmis', () => {
  const info = mock.method(console, 'info', () => {});
  try {
    for (const platform of ['win32', 'linux']) {
      for (const status of [0, 3, null]) {
        const exits = [];
        const runtime = { platform, exit: (code) => exits.push(code) };
        runCommand(['pnpm', 'lint'], 'lint', {
          runtime,
          run: (command, args, options) => {
            assert.equal(command, 'pnpm');
            assert.deepEqual(args, ['lint']);
            assert.equal(options.shell, platform === 'win32');
            return { status };
          },
        });
        assert.deepEqual(exits, status === 0 ? [] : [status ?? 1]);
      }
    }
  } finally {
    info.mock.restore();
  }
});

test('Given différents changements et modes, When le contrôle démarre, Then le plan attendu est exécuté', () => {
  const info = mock.method(console, 'info', () => {});
  const error = mock.method(console, 'error', () => {});
  try {
    for (const mode of [undefined, 'unknown', 'lint', 'test', 'build']) {
      for (const files of [
        [],
        ['packages/tokens/src/token.ts'],
        ['apps/api/src/main.ts'],
      ]) {
        const exits = [];
        const commands = [];
        main({
          runtime: {
            argv: ['node', 'script', mode],
            platform: 'linux',
            exit: (code) => exits.push(code),
          },
          resolveBase: (options) => {
            assert.equal(options.errorPrefix, '[affected]');
            return 'base';
          },
          getFiles: (base, options) => {
            assert.equal(base, 'base');
            assert.match(options.warningMessage, /fallback/);
            return files;
          },
          run: (...args) => {
            commands.push(args);
            return { status: 0 };
          },
        });
        assert.deepEqual(exits, !mode || mode === 'unknown' ? [1] : []);
        assert.equal(
          commands.length,
          ['lint', 'test', 'build'].includes(mode) &&
            files.length > 0 &&
            !(mode === 'build' && files[0].startsWith('packages/tokens'))
            ? 1
            : 0,
        );
      }
    }
    assert.ok(
      info.mock.calls.some((call) =>
        call.arguments[0].includes('Aucun script'),
      ),
    );
    assert.ok(
      info.mock.calls.some((call) =>
        call.arguments[0].includes('Aucun workspace'),
      ),
    );
  } finally {
    info.mock.restore();
    error.mock.restore();
  }
});

test('Given la CLI avec ou sans mode, When elle est exécutée, Then les erreurs sont observables', () => {
  for (const args of [[], ['invalid'], ['lint']]) {
    const result = spawnSync(process.execPath, [scriptPath, ...args], {
      encoding: 'utf8',
      env: {
        ...process.env,
        GIT_EXECUTABLE: process.execPath,
        NODE_OPTIONS: '',
      },
    });
    assert.equal(result.status, args[0] === 'lint' ? 0 : 1);
  }
});

test('Given Git configuré sans permission, When la CLI démarre, Then son exception est journalisée', () => {
  const result = spawnSync(process.execPath, [scriptPath, 'lint'], {
    encoding: 'utf8',
    env: { ...process.env, GIT_EXECUTABLE: process.cwd() },
  });
  assert.equal(result.status, 0);
  assert.match(result.stderr, /Impossible de détecter/);
});

test('Given une exception inattendue, When la CLI la capture, Then elle journalise le contexte et sort en erreur', () => {
  const error = mock.method(console, 'error', () => {});
  const exits = [];
  try {
    runCli({
      runtime: {
        argv: ['node', 'script', 'lint'],
        exit: (code) => exits.push(code),
      },
      resolveBase: () => {
        throw new Error('Git indisponible');
      },
    });
    assert.deepEqual(exits, [1]);
    assert.match(error.mock.calls[0].arguments[0], /Erreur inattendue/);
    runCommand(['echo', 'version'], 'version');
  } finally {
    error.mock.restore();
  }
});

test('Given aucun argument de script, When le module est importé, Then aucun contrôle ne démarre', () => {
  const moduleUrl = new URL('./affected-workspaces.mjs', import.meta.url).href;
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

test('Given le processus par défaut et une erreur Git, When la CLI échoue, Then le processus reçoit le code un', () => {
  const error = mock.method(console, 'error', () => {});
  const exit = mock.method(process, 'exit', () => {});
  const previous = process.argv[2];
  process.argv[2] = 'lint';
  try {
    runCli({
      resolveBase: () => {
        throw new Error('référence inaccessible');
      },
    });
    assert.deepEqual(exit.mock.calls[0].arguments, [1]);
    assert.match(error.mock.calls[0].arguments[0], /Erreur inattendue/);
  } finally {
    process.argv[2] = previous;
    exit.mock.restore();
    error.mock.restore();
  }
});

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
