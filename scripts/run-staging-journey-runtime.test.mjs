import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { createStagingJourneyOptions } from './run-staging-journey.mjs';

test('Given des URL de parcours invalides, When Newman est configuré, Then protocole et identifiants sont refusés', () => {
  for (const baseUrl of [
    'invalide',
    'ftp://exemple.test',
    'https://user@exemple.test',
    'https://:pass@exemple.test',
  ]) {
    assert.throws(
      () =>
        createStagingJourneyOptions({
          KRAAK_JOURNEY_BASE_URL: baseUrl,
          KRAAK_JOURNEY_EMAIL: 'test@exemple.test',
          KRAAK_JOURNEY_PASSWORD: 'fixture',
        }),
      /URL HTTP/,
    );
  }
});

test('Given les résultats Newman, When le parcours CLI se termine, Then erreur de lancement et régressions font échouer le job', () => {
  const url = new URL('run-staging-journey.mjs', import.meta.url).href;
  for (const [callback, expected, message] of [
    ['callback(null,{run:{failures:[]}})', 0, ''],
    ['callback(new Error("refus"))', 1, 'interrompue'],
    ['callback(null,{run:{failures:[{}]}})', 1, 'Régression'],
  ]) {
    const code = `import newman from 'newman';import {fileURLToPath} from 'node:url';newman.run=(_options,callback)=>{${callback}};process.env.KRAAK_JOURNEY_BASE_URL='https://exemple.test';process.env.KRAAK_JOURNEY_EMAIL='test@exemple.test';process.env.KRAAK_JOURNEY_PASSWORD='fixture';process.argv[1]=fileURLToPath(${JSON.stringify(url)});await import(${JSON.stringify(url)});`;
    const result = spawnSync(
      process.execPath,
      ['--input-type=module', '-e', code],
      { encoding: 'utf8' },
    );
    assert.equal(result.status, expected, result.stderr);
    if (message) assert.ok(result.stderr.includes(message));
  }
  const missing = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `import {fileURLToPath} from 'node:url';delete process.env.KRAAK_JOURNEY_BASE_URL;process.argv[1]=fileURLToPath(${JSON.stringify(url)});await import(${JSON.stringify(url)});`,
    ],
    { encoding: 'utf8' },
  );
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /Configuration nightly manquante/);
  assert.equal(
    spawnSync(process.execPath, [
      '--input-type=module',
      '-e',
      `await import(${JSON.stringify(url)});`,
    ]).status,
    0,
  );
});
