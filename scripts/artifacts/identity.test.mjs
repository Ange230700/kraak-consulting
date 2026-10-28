import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { atomicWrite, fileHash, stableJson, sha256 } from './identity.mjs';

test('Given des configurations de même contenu When leurs empreintes sont calculées Then l’ordre des clés ne change pas l’identité', () => {
  assert.equal(
    stableJson({ b: [1, null, { z: true }], a: 'é' }),
    stableJson({ a: 'é', b: [1, null, { z: true }] }),
  );
  assert.notEqual(sha256('A'), sha256('B'));
});

test('Given une destination existante When un fichier est publié Then les octets et l’empreinte sont cohérents', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'kraak-atomic-'));
  try {
    const file = path.join(root, 'sub', 'output.txt');
    await atomicWrite(file, 'Ancien');
    await atomicWrite(file, 'Nouveau');
    assert.equal(await readFile(file, 'utf8'), 'Nouveau');
    assert.equal(await fileHash(file), sha256('Nouveau'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
