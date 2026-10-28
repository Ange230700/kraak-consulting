import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const endpointConfigPath = path.join(
  scriptDirectory,
  '..',
  'apps',
  'client',
  'projects',
  'shared',
  'production-endpoints.json',
);
const endpointConfig = JSON.parse(readFileSync(endpointConfigPath, 'utf8'));

export function resolveEndpoints(environment) {
  if (!Object.hasOwn(endpointConfig, environment)) {
    throw new Error(
      `Environnement "${environment}" invalide. Valeurs attendues: local, production.`,
    );
  }

  return endpointConfig[environment];
}

export function resolveEndpoint(environment, surface) {
  const endpoints = resolveEndpoints(environment);

  if (!Object.hasOwn(endpoints, surface)) {
    throw new Error(
      `Surface "${surface}" invalide. Valeurs attendues: web, api.`,
    );
  }

  return endpoints[surface];
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const [environment, surface] = process.argv.slice(2);
  process.stdout.write(`${resolveEndpoint(environment, surface)}\n`);
}
