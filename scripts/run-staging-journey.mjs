import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import newman from 'newman';

function requireEnvironmentValue(environment, key) {
  const value = environment[key];
  if (!value?.trim()) {
    throw new Error(`Configuration nightly manquante : ${key}.`);
  }
  return value;
}

export function createStagingJourneyOptions(environment) {
  const baseUrl = requireEnvironmentValue(
    environment,
    'KRAAK_JOURNEY_BASE_URL',
  ).trim();
  const email = requireEnvironmentValue(
    environment,
    'KRAAK_JOURNEY_EMAIL',
  ).trim();
  const password = requireEnvironmentValue(
    environment,
    'KRAAK_JOURNEY_PASSWORD',
  );
  if (!URL.canParse(baseUrl)) {
    throw new Error('KRAAK_JOURNEY_BASE_URL doit être une URL HTTP(S) valide.');
  }
  const url = new URL(baseUrl);
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password
  ) {
    throw new Error(
      'KRAAK_JOURNEY_BASE_URL doit être une URL HTTP(S) sans identifiants.',
    );
  }

  return {
    collection: fileURLToPath(
      new URL(
        '../apps/api/test/collections/api-user-journey.collection.json',
        import.meta.url,
      ),
    ),
    envVar: [
      { key: 'baseUrl', value: baseUrl },
      { key: 'strictAuth', value: 'true' },
      { key: 'useExistingConfirmedUser', value: 'true' },
      { key: 'confirmedJourneyEmail', value: email },
      { key: 'confirmedJourneyPassword', value: password },
    ],
    reporters: ['cli', 'junit'],
    reporter: {
      junit: { export: 'test-results/postman/api-user-journey.junit.xml' },
    },
    timeout: 180_000,
    timeoutRequest: 60_000,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    const options = createStagingJourneyOptions(process.env);
    newman.run(options, (error, summary) => {
      if (error) {
        console.error('Exécution Newman staging interrompue.', error.name);
        process.exitCode = 1;
      } else if (summary.run.failures.length > 0) {
        console.error(
          `Régression staging : ${summary.run.failures.length} échec(s).`,
        );
        process.exitCode = 1;
      }
    });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
