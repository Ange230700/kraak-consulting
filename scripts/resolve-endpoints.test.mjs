import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveEndpoint, resolveEndpoints } from './resolve-endpoints.mjs';

test('Given les profils local et production, When chaque profil est résolu, Then leurs endpoints restent indépendants', () => {
  assert.deepEqual(resolveEndpoints('local'), {
    web: 'http://localhost:4200',
    api: 'http://localhost:3000',
  });
  assert.deepEqual(resolveEndpoints('production'), {
    web: 'https://kraak-web-prod.onrender.com',
    api: 'https://kraak-api-prod.onrender.com',
  });
  assert.equal(
    resolveEndpoint('production', 'api'),
    resolveEndpoints('production').api,
  );
});

test('Given staging retiré, When ses endpoints sont résolus, Then le profil est refusé', () => {
  assert.throws(() => resolveEndpoints('staging'), /local, production/);
  assert.throws(() => resolveEndpoints('toString'), /local, production/);
  assert.throws(() => resolveEndpoint('production', 'constructor'), /web, api/);
});
