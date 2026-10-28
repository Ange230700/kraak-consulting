import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
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

test('Given les services staging retirés, When le diagnostic est inspecté, Then seuls les services production sont vérifiés', () => {
  const diagnostic = read('scripts/repo-awareness.sh');
  assert.doesNotMatch(
    diagnostic,
    /branches\/staging\/protection|kraak-web-staging\.onrender\.com|kraak-api-staging\.onrender\.com/,
  );
  assert.match(diagnostic, /kraak-web-prod\.onrender\.com/);
  assert.match(diagnostic, /kraak-api-prod\.onrender\.com/);
});

test('Given la suppression du projet Supabase staging, When les redirections locales sont lues, Then seules les URL locales et production sont configurées', () => {
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

test('Given le modèle de release par tag, When les workflows actifs sont inspectés, Then seul un tag SemVer accessible depuis main peut promouvoir en production', () => {
  const workflow = read('.github/workflows/release-prod.yml');
  const validateTag = workflow.slice(
    workflow.indexOf('name: Résoudre la référence cible'),
    workflow.indexOf('# ──────────────────────────────────────────────\n  # Build'),
  );
  const semverValidation = validateTag.indexOf(
    '^v[0-9]+\\.[0-9]+\\.[0-9]+(-[0-9A-Za-z.-]+)?$',
  );
  const mainAncestryValidation = validateTag.indexOf(
    'git merge-base --is-ancestor "$sha" origin/main',
  );

  assert.match(workflow, /push:\s+tags:\s+- 'v\*'/);
  assert.match(workflow, /workflow_dispatch:\s+inputs:\s+tag:/);
  assert.ok(semverValidation >= 0);
  assert.ok(mainAncestryValidation > semverValidation);
  assert.equal(
    existsSync(
      new URL('../.github/workflows/publish-release.yml', import.meta.url),
    ),
    false,
  );
  assert.match(
    read('docs/operations/RELEASE_PROD.md'),
    /Créer un nouveau tag SemVer sur le commit validé/,
  );
});

test('Given le retrait staging documenté, When le registre et le pilotage sont lus, Then l’état final et les limites de facturation restent distincts', () => {
  const transition = read('docs/operations/PRODUCTION_ONLY_TRANSITION.md');
  const requiredEvidence = [
    /## État final vérifié/,
    /archive\/staging-2026-10-27/,
    /répondent HTTP 200/,
    /facture finale et l'arrêt des frais récurrents ne sont\s+pas encore attestés/,
    /Une correction documentaire ne doit pas la fermer automatiquement/,
  ];

  for (const evidence of requiredEvidence) {
    assert.match(transition, evidence);
  }
  assert.match(
    read('docs/planning/GITHUB_PROJECT.md'),
    /`Status: In Progress`/,
  );
});
