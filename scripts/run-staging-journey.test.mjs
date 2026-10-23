import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { once } from 'node:events';
import newman from 'newman';

import { createStagingJourneyOptions } from './run-staging-journey.mjs';

const environment = {
  KRAAK_JOURNEY_BASE_URL: 'https://staging.example.test',
  KRAAK_JOURNEY_EMAIL: 'journey@example.test',
  KRAAK_JOURNEY_PASSWORD: 'test-only-password',
};

test('Given une session authentifiée, When les requêtes privées sont préparées, Then elles utilisent le jeton obtenu plutôt qu’un marqueur expurgé', () => {
  const collection = JSON.parse(
    readFileSync(
      new URL(
        '../apps/api/test/collections/api-user-journey.collection.json',
        import.meta.url,
      ),
      'utf8',
    ),
  );
  const headers = collection.item.flatMap((item) =>
    (item.request.header ?? []).filter(
      (header) => header.key === 'Authorization',
    ),
  );
  assert.equal(headers.length, 8);
  for (const header of headers) {
    assert.equal(header.value, 'Bearer {{accessToken}}');
  }
});

test('Given un compte staging confirmé, When Newman est configuré, Then le mode strict utilise ce compte sans inscription aléatoire', () => {
  const options = createStagingJourneyOptions(environment);
  const variables = Object.fromEntries(
    options.envVar.map(({ key, value }) => [key, value]),
  );

  assert.equal(variables.strictAuth, 'true');
  assert.equal(variables.useExistingConfirmedUser, 'true');
  assert.equal(
    variables.confirmedJourneyEmail,
    environment.KRAAK_JOURNEY_EMAIL,
  );
  assert.equal(
    variables.confirmedJourneyPassword,
    environment.KRAAK_JOURNEY_PASSWORD,
  );
  assert.equal(variables.baseUrl, environment.KRAAK_JOURNEY_BASE_URL);
  assert.deepEqual(options.reporters, ['cli', 'junit']);
  assert.equal(options.timeoutRequest, 60_000);
  assert.equal(options.timeout, 180_000);
});

test('Given une configuration incomplète, When le nightly démarre, Then il échoue avant toute requête et ne divulgue pas les valeurs', () => {
  for (const key of Object.keys(environment)) {
    assert.throws(
      () => createStagingJourneyOptions({ ...environment, [key]: ' ' }),
      (error) => {
        assert.ok(error instanceof Error);
        assert.ok(error.message.includes(key));
        assert.ok(!error.message.includes(environment.KRAAK_JOURNEY_PASSWORD));
        return true;
      },
    );
  }
});

test('Given une URL invalide, When le nightly démarre, Then la configuration est refusée explicitement', () => {
  for (const value of [
    'not-a-url',
    'file:///tmp/api',
    'https://user:password@example.test',
  ]) {
    assert.throws(() =>
      createStagingJourneyOptions({
        ...environment,
        KRAAK_JOURNEY_BASE_URL: value,
      }),
    );
  }
});

test('Given un compte confirmé et le vrai script de collection, When Newman se connecte, Then les identifiants sont transmis et un refus reste bloquant', async (context) => {
  let responseStatus = 200;
  const requests = [];
  const server = createServer(async (request, response) => {
    let body = '';
    for await (const chunk of request) body += chunk;
    requests.push({ path: request.url, body: JSON.parse(body) });
    response.writeHead(responseStatus, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ session: { accessToken: 'test-token' } }));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  context.after(
    () =>
      new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      ),
  );
  const address = server.address();
  assert.ok(address && typeof address === 'object');

  for (const status of [200, 401]) {
    responseStatus = status;
    const options = createStagingJourneyOptions({
      ...environment,
      KRAAK_JOURNEY_BASE_URL: `http://127.0.0.1:${address.port}`,
    });
    const collection = JSON.parse(readFileSync(options.collection, 'utf8'));
    collection.item = collection.item.filter((item) =>
      ['Sign Up', 'Sign In'].includes(item.name),
    );
    const summary = await new Promise((resolve, reject) => {
      newman.run({ ...options, collection, reporters: [] }, (error, result) =>
        error ? reject(error) : resolve(result),
      );
    });
    assert.equal(summary.run.failures.length, status === 200 ? 0 : 1);
  }
  assert.equal(requests.length, 2);
  for (const request of requests) {
    assert.equal(request.path, '/auth/sign-in');
    assert.deepEqual(request.body, {
      email: environment.KRAAK_JOURNEY_EMAIL,
      password: environment.KRAAK_JOURNEY_PASSWORD,
    });
  }
});
