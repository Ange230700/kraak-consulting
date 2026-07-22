import assert from 'node:assert/strict';
import test from 'node:test';

import {
  checkTarget,
  createObservabilityTargets,
  normalizePublicUrl,
} from './check-observability.mjs';

test('Given une URL publique valide, When on la normalise, Then le slash terminal est retire', () => {
  assert.equal(
    normalizePublicUrl(
      'https://kraak-web-prod.onrender.com/',
      'KRAAK_OBSERVABILITY_WEB_URL',
    ),
    'https://kraak-web-prod.onrender.com',
  );
});

test('Given les URLs web et API, When on construit les checks, Then la home web et /health sont surveilles', () => {
  assert.deepEqual(
    createObservabilityTargets({
      webUrl: 'https://kraak-web-prod.onrender.com/',
      apiUrl: 'https://kraak-api-staging.onrender.com/',
      environment: 'production',
    }),
    [
      {
        name: 'web-home',
        url: 'https://kraak-web-prod.onrender.com/',
        expectedStatus: 200,
        expectedContentType: 'text/html',
      },
      {
        name: 'api-health',
        url: 'https://kraak-api-staging.onrender.com/health',
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
      url: 'https://kraak-api-staging.onrender.com/health',
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
          url: 'https://kraak-api-staging.onrender.com/health',
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
          url: 'https://kraak-web-prod.onrender.com/',
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
