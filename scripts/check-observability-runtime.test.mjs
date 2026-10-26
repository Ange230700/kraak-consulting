import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:http';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  checkTarget,
  createObservabilityTargets,
  formatSummary,
  normalizePublicUrl,
  runObservabilityChecks,
} from './check-observability.mjs';

test('Given des champs distants contenant des retours à la ligne, When le résumé est formaté, Then aucune ligne de journal ne peut être injectée', () => {
  const summary = formatSummary([
    {
      name: 'api-health',
      status: 200,
      url: 'https://api.test/\r\nFAUSSE_LIGNE',
      payload: { environment: 'test\nAUTRE_LIGNE', version: 'v1\rVERSION' },
    },
  ]);
  assert.equal(summary.split(/\r?\n/).length, 1);
  assert.ok(summary.includes('https://api.test/  FAUSSE_LIGNE'));
  assert.ok(summary.includes('env=test AUTRE_LIGNE'));
  assert.ok(summary.includes('version=v1 VERSION'));
});

test('Given une erreur de santé contenant une nouvelle ligne, When la CLI échoue, Then le diagnostic reste sur une seule ligne', async (t) => {
  const server = createServer((request, response) => {
    if (request.url === '/health') {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(
        JSON.stringify({
          status: 'ok',
          service: 'kraak-api',
          environment: 'test\nFAUSSE_LIGNE',
        }),
      );
    } else {
      response.writeHead(200, { 'content-type': 'text/html' });
      response.end('<html lang="fr"></html>');
    }
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });
  const address = `http://127.0.0.1:${server.address().port}`;
  const script = fileURLToPath(
    new URL('check-observability.mjs', import.meta.url),
  );
  const child = spawn(process.execPath, [script], {
    env: {
      ...process.env,
      KRAAK_OBSERVABILITY_WEB_URL: address,
      KRAAK_OBSERVABILITY_API_URL: address,
      KRAAK_OBSERVABILITY_ENVIRONMENT: 'test',
    },
  });
  let stderr = '';
  child.stderr.on('data', (chunk) => {
    stderr += chunk;
  });
  assert.equal((await once(child, 'close'))[0], 1);
  assert.equal(stderr.trimEnd().split(/\r?\n/).length, 1);
  assert.ok(stderr.includes('test FAUSSE_LIGNE'));
});

test('Given des URL manquantes, When les cibles sont préparées, Then la configuration invalide est refusée', () => {
  for (const value of [undefined, '', '   '])
    assert.throws(() => normalizePublicUrl(value, 'TEST'), /TEST.*requise/);
  assert.equal(normalizePublicUrl('///', 'TEST'), '');
  assert.equal(
    normalizePublicUrl('https://exemple.test', 'TEST'),
    'https://exemple.test',
  );
  assert.throws(
    () =>
      createObservabilityTargets({ webUrl: 'https://web.test', apiUrl: '' }),
    /API_URL/,
  );
  assert.equal(
    formatSummary([
      { name: 'api-health', status: 200, url: 'https://api.test' },
    ]),
    '- api-health: 200 | https://api.test',
  );
});

test('Given une réponse de santé incorrecte, When les checks sont exécutés, Then type, statut et contrat sont vérifiés indépendamment', async () => {
  const target = {
    name: 'api-health',
    url: 'https://api.test/health',
    expectedStatus: 200,
    expectedContentType: 'application/json',
  };
  for (const payload of [
    { status: 'error' },
    { status: 'ok', service: 'autre' },
  ]) {
    await assert.rejects(
      checkTarget(target, { fetchImpl: async () => Response.json(payload) }),
      /payload invalide/,
    );
  }
  await assert.rejects(
    checkTarget(
      { ...target, expectedEnvironment: 'staging' },
      {
        fetchImpl: async () =>
          Response.json({ status: 'ok', service: 'kraak-api' }),
      },
    ),
    /inconnu.*staging/,
  );
  await assert.rejects(
    checkTarget(target, { fetchImpl: async () => new Response(null) }),
    /content-type "inconnu"/,
  );
  await assert.rejects(
    checkTarget(target, {
      fetchImpl: async () => Response.json({}, { status: 503 }),
    }),
    /statut HTTP 503/,
  );
  await assert.rejects(
    checkTarget(target, {
      fetchImpl: async () => ({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
      }),
    }),
    /statut HTTP 201/,
  );
  await assert.rejects(
    checkTarget(target, {
      fetchImpl: async () => {
        throw new Error('réseau indisponible');
      },
    }),
    /réseau indisponible/,
  );
});

test('Given un serveur HTTP local, When la CLI et le client natif sont exécutés, Then les résultats et erreurs sont observables', async (t) => {
  const server = createServer((request, response) => {
    if (request.url === '/health') {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(
        JSON.stringify({
          status: 'ok',
          service: 'kraak-api',
          environment: 'test',
          version: 'fixture',
        }),
      );
    } else {
      response.writeHead(200, { 'content-type': 'text/html' });
      response.end('<html lang="fr"></html>');
    }
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });
  const address = `http://127.0.0.1:${server.address().port}`;
  const results = await runObservabilityChecks({
    webUrl: address,
    apiUrl: address,
    environment: 'test',
  });
  assert.equal(results.length, 2);
  assert.match(formatSummary(results), /env=test \| version=fixture/);
  const script = fileURLToPath(
    new URL('check-observability.mjs', import.meta.url),
  );
  const child = spawn(process.execPath, [script], {
    env: {
      ...process.env,
      KRAAK_OBSERVABILITY_WEB_URL: address,
      KRAAK_OBSERVABILITY_API_URL: address,
      KRAAK_OBSERVABILITY_ENVIRONMENT: 'test',
    },
  });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => {
    stdout += chunk;
  });
  child.stderr.on('data', (chunk) => {
    stderr += chunk;
  });
  assert.equal((await once(child, 'close'))[0], 0, stderr);
  assert.match(stdout, /succès/);
  assert.match(stdout, /web-home: 200/);
  assert.match(stdout, /env=test/);
  const missing = spawnSync(process.execPath, [script], {
    env: {
      ...process.env,
      KRAAK_OBSERVABILITY_WEB_URL: '',
      KRAAK_OBSERVABILITY_API_URL: '',
    },
    encoding: 'utf8',
  });
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /WEB_URL.*requise/);
  const imported = spawnSync(process.execPath, [
    '--input-type=module',
    '-e',
    `await import(${JSON.stringify(new URL('check-observability.mjs', import.meta.url).href)});`,
  ]);
  assert.equal(imported.status, 0);
});
