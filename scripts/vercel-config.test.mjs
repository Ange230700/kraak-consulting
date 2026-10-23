import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const vercelConfig = JSON.parse(
  readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'),
);

const expectedStaticOutputDirectory = 'apps/client/dist/web/browser';
const expectedStagingOnlyIgnoreCommand =
  'case "$VERCEL_GIT_COMMIT_REF" in staging) exit 1 ;; *) exit 0 ;; esac';
const productionEnvironment = readFileSync(
  new URL(
    '../apps/client/projects/web/src/environments/environment.production.ts',
    import.meta.url,
  ),
  'utf8',
);
const stagingEnvironment = readFileSync(
  new URL(
    '../apps/client/projects/web/src/environments/environment.staging.ts',
    import.meta.url,
  ),
  'utf8',
);

function readApiBaseUrl(environmentSource) {
  return environmentSource.match(/apiBaseUrl:\s*'([^']+)'/)?.[1];
}

test('Given le build web prerender, When Vercel publie le site, Then le dossier browser est servi', () => {
  assert.equal(vercelConfig.outputDirectory, expectedStaticOutputDirectory);
});

test('Given une branche Git, When Vercel décide de construire, Then seuls les pushes staging déclenchent un build automatique', () => {
  assert.equal(vercelConfig.ignoreCommand, expectedStagingOnlyIgnoreCommand);
});

test('Given la configuration web production, When Vercel applique la CSP, Then seule l’API production est autorisée', () => {
  const headers = vercelConfig.headers.find(({ source }) => source === '/(.*)');
  const contentSecurityPolicy = headers?.headers.find(
    ({ key }) => key === 'Content-Security-Policy',
  )?.value;

  assert.ok(
    contentSecurityPolicy?.includes(readApiBaseUrl(productionEnvironment)),
  );
  assert.ok(contentSecurityPolicy);
  assert.ok(
    !contentSecurityPolicy.includes(readApiBaseUrl(stagingEnvironment)),
  );
});
