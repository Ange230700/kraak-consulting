import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseRunCommand,
  runCommandWithAndroidEnv,
} from './setup-android-env.mjs';

test('parseRunCommand extrait la commande et les arguments', () => {
  assert.deepEqual(parseRunCommand('pnpm build:debug:android'), {
    args: ['build:debug:android'],
    command: 'pnpm',
  });
});

test('parseRunCommand respecte les guillemets pour les arguments', () => {
  assert.deepEqual(parseRunCommand('pnpm --filter "@kraak/client" test'), {
    args: ['--filter', '@kraak/client', 'test'],
    command: 'pnpm',
  });
});

test('parseRunCommand rejette une commande vide', () => {
  assert.throws(
    () => parseRunCommand('   '),
    /--run requires a non-empty command string/u,
  );
});

test('parseRunCommand rejette les guillemets non fermés', () => {
  assert.throws(
    () => parseRunCommand('pnpm "build:debug:android'),
    /commande invalide/u,
  );
});

test('runCommandWithAndroidEnv exécute sans shell avec variables Android', () => {
  const calls = [];

  runCommandWithAndroidEnv('pnpm build:debug:android', {
    environmentSource: { PATH: '/usr/bin', NODE_ENV: 'test' },
    exit: () => {
      throw new Error('exit should not be called');
    },
    runProcess: (command, args, env) => {
      calls.push({ args, command, env });
      return { status: 0 };
    },
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].command, 'pnpm');
  assert.deepEqual(calls[0].args, ['build:debug:android']);
  assert.equal(typeof calls[0].env.JAVA_HOME, 'string');
  assert.equal(typeof calls[0].env.ANDROID_HOME, 'string');
  assert.equal(calls[0].env.ANDROID_SDK_ROOT, calls[0].env.ANDROID_HOME);
});

test('runCommandWithAndroidEnv demande une sortie non zéro en cas d échec commande', () => {
  let exitCode = null;

  runCommandWithAndroidEnv('pnpm build:debug:android', {
    environmentSource: { PATH: '/usr/bin' },
    exit: (code) => {
      exitCode = code;
    },
    runProcess: () => ({ status: 2 }),
  });

  assert.equal(exitCode, 2);
});
