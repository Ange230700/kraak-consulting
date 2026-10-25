import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

function invoke(script, setup, args = [], direct = true) {
  const url = new URL(script, import.meta.url).href;
  const code = `import fs from 'node:fs';import cp from 'node:child_process';import os from 'node:os';import {syncBuiltinESMExports} from 'node:module';import {fileURLToPath} from 'node:url';${setup};syncBuiltinESMExports();process.argv=${direct ? `['node',fileURLToPath(${JSON.stringify(url)}),...${JSON.stringify(args)}]` : "['node']"};await import(${JSON.stringify(url)});`;
  return spawnSync(process.execPath, ['--input-type=module', '-e', code], {
    encoding: 'utf8',
  });
}

test('Given les plateformes Capacitor, When les OS et résultats de commande varient, Then la CLI crée ou réutilise sans masquer les erreurs', async () => {
  const {
    ensureCapacitorPlatform,
    getCapacitorPlatformDirectory,
    parseCapacitorPlatform,
  } = await import('./ensure-capacitor-platform.mjs');
  assert.throws(() => parseCapacitorPlatform(['']), /manquante/);
  assert.ok(getCapacitorPlatformDirectory('android').endsWith('android'));
  assert.throws(
    () =>
      ensureCapacitorPlatform('ios', {
        clientRootPath: 'absent',
        runCommand: () => ({ status: 1 }),
      }),
    /Impossible/,
  );
  for (const platform of ['win32', 'linux']) {
    const result = invoke(
      'ensure-capacitor-platform.mjs',
      `Object.defineProperty(process,'platform',{value:'${platform}'});fs.existsSync=()=>false;cp.spawnSync=(command)=>{if(command!=='${platform === 'win32' ? 'npx.cmd' : 'npx'}')throw new Error(command);return {status:0}}`,
      ['android'],
    );
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /créée/);
  }
  const present = invoke(
    'ensure-capacitor-platform.mjs',
    'fs.existsSync=()=>true',
    ['android'],
  );
  assert.equal(present.status, 0, present.stderr);
  assert.match(present.stdout, /déjà présente/);
  for (const setup of [
    'fs.existsSync=()=>false;cp.spawnSync=()=>{throw "erreur inattendue"}',
    '',
  ]) {
    const result = invoke(
      'ensure-capacitor-platform.mjs',
      setup,
      setup ? ['ios'] : [],
    );
    assert.equal(result.status, 1);
    assert.match(result.stderr, setup ? /erreur inattendue/ : /manquante/);
  }
  assert.equal(
    invoke('ensure-capacitor-platform.mjs', '', [], false).status,
    0,
  );
});

test('Given le prerender, When la page 404 manque ou la CLI démarre, Then la finalisation reste explicite et échappe la destination', async () => {
  const { finalizeWebPrerender, buildStaticRootRedirectHtml } =
    await import('./finalize-web-prerender.mjs');
  assert.throws(
    () => finalizeWebPrerender({ browserDistFolder: 'dossier-absent' }),
    /introuvable/,
  );
  assert.match(
    buildStaticRootRedirectHtml('/<page>?x="a"&b=1'),
    /&lt;page&gt;\?x=&quot;a&quot;&amp;b=1/,
  );
  const result = invoke(
    'finalize-web-prerender.mjs',
    'fs.existsSync=()=>true;fs.mkdirSync=()=>{};fs.copyFileSync=()=>{};fs.writeFileSync=()=>{}',
  );
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /404 statique/);
  assert.equal(invoke('finalize-web-prerender.mjs', '', [], false).status, 0);
});

test('Given la CLI Android, When les shells, OS et exécutables varient, Then les variables et codes de sortie sont conservés', () => {
  for (const platform of ['win32', 'linux']) {
    for (const configured of [true, false]) {
      const setup = `os.platform=()=> '${platform}';${configured ? "process.env.JAVA_HOME='/custom/java';process.env.ANDROID_HOME='/custom/android';process.env.ComSpec='cmd.exe';" : 'delete process.env.JAVA_HOME;delete process.env.ANDROID_HOME;delete process.env.ComSpec;'}cp.spawnSync=()=>({status:0});`;
      for (const args of [
        [],
        ['--shell'],
        ['--run', 'pnpm build'],
        ['--run', 'tool.exe build'],
      ]) {
        const result = invoke('setup-android-env.mjs', setup, args);
        assert.equal(result.status, 0, result.stderr);
        assert.match(
          result.stderr,
          args.includes('--run') ? /Running/ : /Environment variables set/,
        );
        if (!args.includes('--run')) assert.match(result.stdout, /JAVA_HOME/);
      }
    }
  }
  for (const [implementation, expected] of [
    ['return {status:null}', 1],
    ['return {status:3}', 3],
    ['return {error:new Error("processus refusé")}', 1],
    ['throw {status:2}', 2],
    ['throw null', 1],
  ]) {
    const result = invoke(
      'setup-android-env.mjs',
      `cp.spawnSync=()=>{${implementation}}`,
      ['--run', 'pnpm test'],
    );
    assert.equal(result.status, expected, result.stderr);
  }
  assert.equal(invoke('setup-android-env.mjs', '', [], false).status, 0);
});

test('Given une commande Android échappée, When le parseur reçoit espaces ou guillemets imbriqués, Then les tokens et erreurs sont exacts', async () => {
  const { parseRunCommand, runCommandWithAndroidEnv } =
    await import('./setup-android-env.mjs');
  assert.deepEqual(
    parseRunCommand(String.raw`tool 'texte "double"' "texte 'simple'" a\ b  `),
    { command: 'tool', args: ['texte double', 'texte simple', 'a b'] },
  );
  assert.deepEqual(parseRunCommand('tool   argument  fin'), {
    command: 'tool',
    args: ['argument', 'fin'],
  });
  for (const value of [undefined, "''", 'tool\\', "tool 'incomplet"])
    assert.throws(() => parseRunCommand(value), /non-empty|invalide/);
  assert.throws(
    () =>
      runCommandWithAndroidEnv('tool', {
        runProcess: () => ({ error: new Error('échec') }),
      }),
    /échec/,
  );
  let status;
  runCommandWithAndroidEnv('tool', {
    exit: (code) => {
      status = code;
    },
    runProcess: () => ({ status: null }),
  });
  assert.equal(status, 1);
});
