import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { loadClientRuntimeConfig } from './generate-client-runtime-config.mjs';

test('Given des lignes env incomplètes, When le runtime est chargé, Then commentaires et clés invalides sont ignorés', (t) => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'kraak-runtime-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(
    path.join(root, '.env'),
    '# commentaire\ninvalide\n=valeur\nCLIENT_API_BASE_URL=  \nCLIENT_SITE_URL=https://exemple.test\n',
  );
  assert.deepEqual(
    loadClientRuntimeConfig('local', { clientRootPath: root, processEnv: {} }),
    { enableParticipantArea: true, siteUrl: 'https://exemple.test' },
  );
});

test('Given la CLI runtime, When les options et fichiers varient, Then les sorties sont écrites ou le défaut de configuration est signalé', () => {
  const url = new URL('generate-client-runtime-config.mjs', import.meta.url)
    .href;
  for (const [args, api] of [
    [[], ''],
    [['--env'], 'https://api.test'],
    [['--env', 'staging'], ''],
  ]) {
    const code = `import fs from 'node:fs';import {syncBuiltinESMExports} from 'node:module';import {fileURLToPath} from 'node:url';let count=0;fs.existsSync=()=>false;fs.mkdirSync=()=>{};fs.writeFileSync=()=>{count++};syncBuiltinESMExports();process.env.CLIENT_API_BASE_URL=${JSON.stringify(api)};process.argv=['node',fileURLToPath(${JSON.stringify(url)}),...${JSON.stringify(args)}];await import(${JSON.stringify(url)});if(count!==2)throw new Error('Deux sorties attendues');`;
    const result = spawnSync(
      process.execPath,
      ['--input-type=module', '-e', code],
      { encoding: 'utf8' },
    );
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, api ? /https:\/\/api.test/ : /fallback/);
  }
  for (const setup of ['', "fs.existsSync=()=>{throw 'erreur inattendue'}"]) {
    const code = `import fs from 'node:fs';import {syncBuiltinESMExports} from 'node:module';import {fileURLToPath} from 'node:url';${setup};syncBuiltinESMExports();process.argv=['node',fileURLToPath(${JSON.stringify(url)}),...${JSON.stringify(setup ? [] : ['--env', 'inconnu'])}];await import(${JSON.stringify(url)});`;
    const result = spawnSync(
      process.execPath,
      ['--input-type=module', '-e', code],
      { encoding: 'utf8' },
    );
    assert.equal(result.status, 1);
    assert.match(
      result.stderr,
      setup ? /erreur inattendue/ : /Environnement invalide/,
    );
  }
  assert.equal(
    spawnSync(process.execPath, [
      '--input-type=module',
      '-e',
      `await import(${JSON.stringify(url)});`,
    ]).status,
    0,
  );
});
