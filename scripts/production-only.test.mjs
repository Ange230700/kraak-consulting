import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';

const read = (file) =>
  readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('Given la branche permanente main, When Changesets lit sa configuration, Then main est la branche de base', () => {
  const config = JSON.parse(read('.changeset/config.json'));
  assert.equal(config.baseBranch, 'main');
});

test('Given une production unique, When le Blueprint Render est lu, Then seuls les services main de production sont déclarés', () => {
  const config = read('render.yaml');
  assert.deepEqual(
    [...config.matchAll(/^ {4}name: (.+)$/gm)].map((match) => match[1]),
    ['kraak-web-prod', 'kraak-api-prod'],
  );
  assert.doesNotMatch(config, /staging/i);
  assert.equal([...config.matchAll(/^ {4}branch: main$/gm)].length, 2);
  assert.equal([...config.matchAll(/^ {4}autoDeploy: false$/gm)].length, 2);
});

test('Given la configuration cible sans staging, When le diagnostic est inspecté, Then seuls les services production sont vérifiés', () => {
  const diagnostic = read('scripts/repo-awareness.sh');
  assert.doesNotMatch(
    diagnostic,
    /branches\/staging\/protection|kraak-web-staging\.onrender\.com|kraak-api-staging\.onrender\.com/,
  );
  assert.match(diagnostic, /kraak-web-prod\.onrender\.com/);
  assert.match(diagnostic, /kraak-api-prod\.onrender\.com/);
});

test('Given la configuration cible Supabase, When les redirections sont lues, Then seules les URL locales et production sont configurées', () => {
  const config = read('supabase/config.toml');
  assert.doesNotMatch(config, /kraak-web-staging\.onrender\.com/);
  assert.match(config, /kraak-web-prod\.onrender\.com/);
  assert.match(config, /http:\/\/localhost:4200\/auth\/callback/);
});

test('Given des PR et une régression nocturne, When les workflows actifs sont inspectés, Then aucun accès staging ni test mutant en production n’est requis', () => {
  const directory = new URL('../.github/workflows/', import.meta.url);
  for (const name of readdirSync(directory)) {
    const workflow = read(`.github/workflows/${name}`);
    assert.doesNotMatch(workflow, /staging|STAGING/, name);
  }
  const ci = read('.github/workflows/ci.yml');
  assert.match(ci, /pull_request:\s+branches: \[main\]/);
  assert.match(ci, /schedule:\s+- cron: '0 2 \* \* \*'/);
  assert.match(ci, /name: Quality gate/);
  assert.match(ci, /name: Tests E2E/);
  assert.match(
    read('.github/workflows/supabase-schema-tests.yml'),
    /postgres:17/,
  );
});

test('Given une branche courte, When le contrôle de lignée valide une PR, Then la base est main sans imposer de branche staging', () => {
  const workflow = read('.github/workflows/release-lineage.yml');
  assert.match(workflow, /pull_request:\s+branches: \[main\]/);
  assert.doesNotMatch(workflow, /staging/);
  assert.match(workflow, /--require-main-ancestor HEAD origin\/main/);
});

test('Given une release production, When les migrations et la version sont mises à jour, Then la lignée est vérifiée et les autres secrets Render sont préservés', () => {
  const workflow = read('.github/workflows/release-prod.yml');
  const lineage = workflow.indexOf(
    'name: Vérifier la lignée avant toute écriture production',
  );
  assert.ok(lineage > 0);
  assert.ok(lineage < workflow.indexOf('name: Appliquer les migrations'));
  assert.match(workflow, /secrets\.SUPABASE_DB_URL_PRODUCTION_READONLY/);
  assert.match(workflow, /env-vars\/\$key/);
  assert.doesNotMatch(workflow, /env-vars"\s*\\/);
});

test('Given le retrait staging bloqué, When le registre est lu, Then les ressources préexistantes et les barrières sont explicites', () => {
  const transition = read('docs/operations/PRODUCTION_ONLY_TRANSITION.md');
  const requiredEvidence = [
    /retrait opérationnel des ressources staging préexistantes reste bloqué/i,
    /551704b4073647d7c63363c9fd9eaf4c24c1a975/,
    /srv-d8aj943eo5us739nobeg/,
    /qgttdsnupelohowwkkwb/,
    /HTTP\s+404/,
    /aucune économie réalisée n'est confirmée/i,
  ];

  for (const evidence of requiredEvidence) {
    assert.match(transition, evidence);
  }
});
