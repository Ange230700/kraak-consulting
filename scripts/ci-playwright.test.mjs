import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const workflow = readFileSync(
  new URL('.github/workflows/ci.yml', root),
  'utf8',
);
const sonarWorkflow = readFileSync(
  new URL('.github/workflows/sonarcloud.yml', root),
  'utf8',
);
const clientPackage = JSON.parse(
  readFileSync(new URL('apps/client/package.json', root), 'utf8'),
);

test('Given la CI E2E, When les navigateurs sont préparés, Then une image Playwright alignée évite tout téléchargement', () => {
  const version = clientPackage.devDependencies['@playwright/test'];
  assert.match(version, /^\d+\.\d+\.\d+$/);
  const lockfile = readFileSync(new URL('pnpm-lock.yaml', root), 'utf8');
  assert.ok(
    lockfile.includes(
      `'@playwright/test':\n        specifier: ${version}\n        version: ${version}`,
    ),
  );
  assert.ok(
    workflow.includes(`mcr.microsoft.com/playwright:v${version}-noble`),
  );
  const e2eWorkflow = workflow.slice(
    workflow.indexOf('  e2e-browsers:'),
    workflow.indexOf('  e2e:'),
  );
  assert.doesNotMatch(e2eWorkflow, /playwright install/);
  assert.match(workflow, /PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1'/);
  assert.match(workflow, /exec tsc --noEmit/);
});

test('Given les tests PDF workspace, When les jobs CI et Sonar exécutent ces tests, Then Chromium est installé avant leur lancement', () => {
  for (const job of [
    workflow.slice(
      workflow.indexOf('  quality-gate:'),
      workflow.indexOf('  lint:'),
    ),
    workflow.slice(
      workflow.indexOf('  workspace:'),
      workflow.indexOf('  docker:'),
    ),
    sonarWorkflow,
  ]) {
    const installation = job.indexOf(
      'pnpm exec playwright install --with-deps chromium',
    );
    const execution = job.search(/run: pnpm (?:check|test:workspace)/);
    assert.ok(installation >= 0);
    assert.ok(execution > installation);
  }
});

test('Given le conteneur Playwright exécuté en root, When Firefox démarre, Then HOME appartient à l’utilisateur courant', () => {
  assert.match(
    workflow,
    /PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1'\n\s+HOME: \/root/,
  );
});

test('Given les cinq profils E2E, When le check requis est publié, Then il dépend des vrais résultats et conserve les preuves', () => {
  for (const project of [
    'chromium',
    'firefox',
    'webkit',
    'chrome-android',
    'safari-iphone',
  ]) {
    assert.ok(workflow.includes(`project: ${project}`));
  }
  assert.match(workflow, /needs: e2e-browsers/);
  assert.match(workflow, /E2E_RESULT: \$\{\{ needs\.e2e-browsers\.result \}\}/);
  assert.match(workflow, /test "\$E2E_RESULT" = success/);
  assert.match(workflow, /--global-timeout=1200000/);
  assert.match(workflow, /apps\/client\/test-results\//);
  assert.doesNotMatch(workflow, /Tests E2E check reported successfully/);
});

test('Given des parcours fonctionnels français, When un navigateur démarre, Then sa locale et les animations sont déterministes sur desktop et mobile', () => {
  for (const config of [
    'playwright.config.ts',
    'playwright.mobile.config.ts',
  ]) {
    const source = readFileSync(new URL(`apps/client/${config}`, root), 'utf8');
    assert.match(source, /locale: 'fr-CI'/);
    assert.match(source, /contextOptions: \{ reducedMotion: 'reduce' \}/);
  }
});

test('Given une page SSR, When Angular démarre, Then les interactions effectuées avant hydratation sont rejouées', () => {
  const source = readFileSync(
    new URL('apps/client/projects/web/src/app/app.config.ts', root),
    'utf8',
  );
  assert.match(source, /provideClientHydration\(withEventReplay\(\)\)/);
});

test('Given une quality gate Sonar en échec, When la CI publie son diagnostic, Then les anomalies bloquantes sont identifiées sans données sensibles', () => {
  const diagnostic = sonarWorkflow.split(
    '- name: Identifier les anomalies Sonar bloquantes',
  )[1];
  assert.ok(diagnostic);
  assert.match(
    diagnostic,
    /if: \$\{\{ failure\(\) && steps\.scan\.outcome == 'failure' \}\}/,
  );
  assert.match(
    diagnostic,
    /SONAR_PR: \$\{\{ github.event.pull_request.number \}\}/,
  );
  assert.match(diagnostic, /types=BUG,VULNERABILITY/);
  assert.match(diagnostic, /resolved=false/);
  assert.match(diagnostic, /\.paging\.total <= 500/);
  assert.match(diagnostic, /\{key,type,severity,rule,component,line\}/);
  assert.doesNotMatch(
    diagnostic,
    /\{[^}]*\b(?:message|flows|textRange)\b[^}]*\}/,
  );
});
