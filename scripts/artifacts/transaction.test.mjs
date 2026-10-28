import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  mkdtemp,
  mkdir,
  readFile,
  writeFile,
  readdir,
  rename,
  rm,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { directoryTransaction, renameDirectory } from './transaction.mjs';

test('Given un verrou Windows When le renommage est retenté Then les tentatives sont bornées et les erreurs permanentes remontent', async () => {
  let calls = 0;
  await renameDirectory('a', 'b', {
    platform: 'win32',
    pause: async () => {},
    move: async () => {
      if (calls++ < 2)
        throw Object.assign(new Error('verrou'), { code: 'EPERM' });
    },
  });
  assert.equal(calls, 3);
  for (const [platform, code, count] of [
    ['win32', 'EBUSY', 5],
    ['win32', 'ENOENT', 1],
    ['linux', 'EPERM', 1],
  ]) {
    calls = 0;
    await assert.rejects(
      renameDirectory('a', 'b', {
        platform,
        pause: async () => {},
        move: async () => {
          calls++;
          throw Object.assign(new Error('échec'), { code });
        },
      }),
      /échec/,
    );
    assert.equal(calls, count);
  }
});

test('Given une erreur de publication When la transaction restaure son backup Then l’ancien contenu et les preuves sont préservés', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'kraak-rollback-'));
  try {
    const output = path.join(root, 'output');
    await mkdir(output);
    await writeFile(path.join(output, 'valid.txt'), 'valide');
    let calls = 0;
    await assert.rejects(
      directoryTransaction(
        output,
        async (stage) => writeFile(path.join(stage, 'valid.txt'), 'nouveau'),
        {
          move: async (from, to) => {
            if (++calls === 2) throw new Error('publication refusée');
            await rename(from, to);
          },
          preserveFailure: true,
        },
      ),
      /refusée/,
    );
    assert.equal(
      await readFile(path.join(output, 'valid.txt'), 'utf8'),
      'valide',
    );
    assert.ok(
      (await readdir(root)).some((name) => name.startsWith('output.failed-')),
    );
    await assert.rejects(
      directoryTransaction(path.join(root, 'absent'), async () => {}, {
        move: async () => {
          throw new Error('échec');
        },
      }),
      /échec/,
    );
    await assert.rejects(
      directoryTransaction(output, async () => {}, {
        inspect: async () => {
          throw Object.assign(new Error('interdit'), { code: 'EACCES' });
        },
      }),
      /interdit/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
