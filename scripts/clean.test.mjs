import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { cleanWorkspace } from './clean.mjs';

test('Given des sorties générées, When le nettoyage est simulé puis exécuté, Then seuls les artefacts du workspace sont retirés', async () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'kraak-clean-'));
  try {
    mkdirSync(path.join(directory, 'coverage'));
    writeFileSync(path.join(directory, 'source.ts'), 'export {};');
    assert.equal(await cleanWorkspace('apps/api', directory, true), 0);
    assert.ok(existsSync(path.join(directory, 'coverage')));
    assert.equal(await cleanWorkspace('apps/api', directory, false), 0);
    assert.equal(existsSync(path.join(directory, 'coverage')), false);
    assert.ok(existsSync(path.join(directory, 'source.ts')));
    assert.equal(await cleanWorkspace('inconnu', directory, false), 1);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('Given la CLI clean, When le dossier courant est racine ou imbriqué, Then le bon workspace est sélectionné sans effacer de source', () => {
  const script = fileURLToPath(new URL('clean.mjs', import.meta.url));
  for (const [relative, expected] of [
    ['..', 0],
    ['../apps/api', 0],
    ['.', 1],
  ]) {
    const result = spawnSync(process.execPath, [script, '--dry-run'], {
      cwd: fileURLToPath(new URL(relative, import.meta.url)),
      encoding: 'utf8',
    });
    assert.equal(result.status, expected, result.stderr);
    assert.match(result.stdout || result.stderr, /clean/);
  }
});
