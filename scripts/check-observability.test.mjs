import assert from 'node:assert/strict';
import test from 'node:test';

import {
  checkTarget,
  createObservabilityTargets,
  normalizePublicUrl,
  runObservabilityChecks,
} from './check-observability.mjs';

test('Given deux cibles indépendantes, When la page web attend sa réponse, Then la santé API est déjà interrogée et les résultats gardent leur ordre', async () => {
  const started = [];
  let releaseWeb;
  const webResponse = new Promise((resolve) => {
    releaseWeb = resolve;
  });
  const pending = runObservabilityChecks(
    { webUrl: 'https://web.test', apiUrl: 'https://api.test' },
    {
      fetchImpl: (url) => {
        started.push(url);
        return url.endsWith('/health')
          ? Promise.resolve(
              Response.json({ status: 'ok', service: 'kraak-api' }),
            )
          : webResponse;
      },
    },
  );
  const startedBeforeRelease = [...started];
  releaseWeb(
    new Response('<html lang="fr"></html>', {
      headers: { 'content-type': 'text/html' },
    }),
  );
  const results = await pending;

  assert.deepEqual(startedBeforeRelease, [
    'https://web.test/',
    'https://api.test/health',
  ]);
  assert.deepEqual(
    results.map(({ name }) => name),
    ['web-home', 'api-health'],
  );
});

test('Given une URL publique valide, When on la normalise, Then le slash terminal est retire', () => {
  assert.equal(
    normalizePublicUrl(
      'https://web.example.test/',
      'KRAAK_OBSERVABILITY_WEB_URL',
    ),
    'https://web.example.test',
  );
});

test('Given les URLs web et API, When on construit les checks, Then la home web et /health sont surveilles', () => {
  assert.deepEqual(
    createObservabilityTargets({
      webUrl: 'https://web.example.test/',
      apiUrl: 'https://api.example.test/',
      environment: 'production',
    }),
    [
      {
        name: 'web-home',
        url: 'https://web.example.test/',
        expectedStatus: 200,
        expectedContentType: 'text/html',
      },
      {
        name: 'api-health',
        url: 'https://api.example.test/health',
        expectedStatus: 200,
        expectedContentType: 'application/json',
        expectedEnvironment: 'production',
      },
    ],
  );
});

test('Given un endpoint API sain, When le check passe, Then le payload de supervision est retourne', async () => {
  const result = await checkTarget(
    {
      name: 'api-health',
      url: 'https://api.example.test/health',
      expectedStatus: 200,
      expectedContentType: 'application/json',
      expectedEnvironment: 'production',
    },
    {
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            status: 'ok',
            service: 'kraak-api',
            environment: 'production',
            timestamp: '2026-04-30T09:45:00.000Z',
            version: 'pilot-2026-04-30',
            uptimeSeconds: 321,
          }),
          {
            status: 200,
            headers: {
              'content-type': 'application/json; charset=utf-8',
            },
          },
        ),
    },
  );

  assert.equal(result.ok, true);
  assert.equal(result.payload.service, 'kraak-api');
});

test('Given un endpoint API staging identifié en production, When le check passe, Then une erreur explicite est levee', async () => {
  await assert.rejects(
    () =>
      checkTarget(
        {
          name: 'api-health',
          url: 'https://api.example.test/health',
          expectedStatus: 200,
          expectedContentType: 'application/json',
          expectedEnvironment: 'staging',
        },
        {
          fetchImpl: async () =>
            new Response(
              JSON.stringify({
                status: 'ok',
                service: 'kraak-api',
                environment: 'production',
              }),
              {
                status: 200,
                headers: {
                  'content-type': 'application/json; charset=utf-8',
                },
              },
            ),
        },
      ),
    /environnement/,
  );
});

test('Given un endpoint web qui repond en JSON, When le check s execute, Then une erreur explicite est levee', async () => {
  await assert.rejects(
    () =>
      checkTarget(
        {
          name: 'web-home',
          url: 'https://web.example.test/',
          expectedStatus: 200,
          expectedContentType: 'text/html',
        },
        {
          fetchImpl: async () =>
            new Response('{}', {
              status: 200,
              headers: {
                'content-type': 'application/json',
              },
            }),
        },
      ),
    /content-type/,
  );
});
