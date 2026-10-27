import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

function invoke(script, setup, args = []) {
  const url = new URL(script, import.meta.url).href;
  const code = `import fs from 'node:fs';import cp from 'node:child_process';import {syncBuiltinESMExports} from 'node:module';${setup};syncBuiltinESMExports();process.argv=['node','script',...${JSON.stringify(args)}];await import(${JSON.stringify(url)});`;
  return spawnSync(process.execPath, ['--input-type=module', '-e', code], {
    encoding: 'utf8',
  });
}

test('Given les règles de protection, When gh est simulé sur chaque OS, Then seul le payload main est transmis sans requête réseau', () => {
  for (const [platform, extension] of [
    ['win32', '.exe'],
    ['win32', '.cmd'],
    ['win32', ''],
    ['linux', ''],
  ]) {
    const result = invoke(
      'update-branch-protection.mjs',
      `Object.defineProperty(process,'platform',{value:'${platform}'});process.env.GH_BIN='/missing';process.env.PATH='/fixture';fs.existsSync=(p)=>p.endsWith('gh${extension}');cp.spawnSync=(command,args,options)=>{console.log('REQUEST:'+options.input);return {status:0,stdout:'{}'}}`,
    );
    assert.equal(result.status, 0, result.stderr);
    const requests = result.stdout
      .split('\n')
      .filter((line) => line.startsWith('REQUEST:'))
      .map((line) => JSON.parse(line.slice(8)));
    assert.equal(requests.length, 1);
    assert.equal(requests[0].enforce_admins, true);
    assert.equal(
      requests[0].required_pull_request_reviews.require_code_owner_reviews,
      true,
    );
    assert.equal(requests[0].required_status_checks.strict, true);
    assert.equal(requests[0].required_linear_history, true);
  }
  const dry = invoke(
    'update-branch-protection.mjs',
    "process.env.GH_BIN=process.execPath;cp.spawnSync=()=>{throw new Error('Requête réseau interdite')}",
    ['--dry-run'],
  );
  assert.equal(dry.status, 0, dry.stderr);
  assert.match(dry.stdout, /=== main ===/);
  const obsolete = invoke(
    'update-branch-protection.mjs',
    'process.env.GH_BIN=process.execPath',
    ['--staging-only'],
  );
  assert.equal(obsolete.status, 1);
  assert.match(obsolete.stderr, /Seule l’option --dry-run/);
});

test('Given gh introuvable ou en échec, When les protections sont appliquées, Then le script échoue sans succès apparent', () => {
  for (const stderr of ['', 'erreur gh']) {
    const result = invoke(
      'update-branch-protection.mjs',
      `process.env.GH_BIN=process.execPath;cp.spawnSync=()=>({status:1,stderr:${JSON.stringify(stderr)}})`,
    );
    assert.equal(result.status, 1);
    assert.match(result.stderr, /exited with 1/);
    assert.doesNotMatch(result.stdout, /Done/);
  }
  const missing = invoke(
    'update-branch-protection.mjs',
    "delete process.env.GH_BIN;delete process.env.PATH;fs.existsSync=()=>false;cp.spawnSync=()=>{throw new Error('Requête réseau interdite')}",
  );
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /introuvable dans PATH/);
  const unresolved = invoke(
    'update-branch-protection.mjs',
    "delete process.env.GH_BIN;process.env.PATH='/absent';fs.existsSync=()=>false;cp.spawnSync=()=>{throw new Error('Requête réseau interdite')}",
  );
  assert.equal(unresolved.status, 1);
});

test('Given la lignée de release, When les options et références divergent, Then le mode informatif et les erreurs restent distincts', () => {
  const success = `cp.spawnSync=(_command,args)=>({status:args.includes('--is-ancestor')?1:0,stdout:args[0]==='rev-list'?'2 1':'fixture',stderr:''})`;
  const informative = invoke('check-branch-lineage.mjs', success);
  assert.equal(informative.status, 0, informative.stderr);
  assert.match(informative.stdout, /n’est pas un ancêtre/);
  const oneRef = invoke('check-branch-lineage.mjs', success, ['feat/example']);
  assert.equal(oneRef.status, 0, oneRef.stderr);
  for (const args of [['--unknown'], ['a', 'b', 'c']]) {
    const result = invoke('check-branch-lineage.mjs', success, args);
    assert.equal(result.status, 2);
    assert.match(
      result.stderr,
      args.length === 1 ? /Option inconnue/ : /Usage/,
    );
  }
  for (const output of [
    { stderr: 'stderr git', stdout: '' },
    { stderr: '', stdout: 'stdout git' },
    { stderr: '', stdout: '' },
  ]) {
    const result = invoke(
      'check-branch-lineage.mjs',
      `cp.spawnSync=()=>({status:2,...${JSON.stringify(output)}})`,
    );
    assert.equal(result.status, 2);
    assert.match(result.stderr, /Échec du contrôle/);
  }
  for (const stderr of ['', 'comparaison refusée']) {
    const result = invoke(
      'check-branch-lineage.mjs',
      `cp.spawnSync=(_command,args)=>({status:args.includes('--is-ancestor')?2:0,stdout:'2 1',stderr:${JSON.stringify(stderr)}})`,
    );
    assert.equal(result.status, 2);
    assert.match(
      result.stderr,
      stderr ? /comparaison refusée/ : /Impossible de comparer/,
    );
  }
  const raw = invoke(
    'check-branch-lineage.mjs',
    'cp.spawnSync=()=>{throw "erreur inattendue"}',
  );
  assert.equal(raw.status, 2);
  assert.match(raw.stderr, /erreur inattendue/);
});
