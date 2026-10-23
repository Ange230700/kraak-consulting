import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const angularWorkspace = JSON.parse(
  readFileSync(new URL('../apps/client/angular.json', import.meta.url), 'utf8'),
);

const webBuildConfigurations =
  angularWorkspace.projects?.web?.architect?.build?.configurations ?? {};
const webBuildOptions =
  angularWorkspace.projects?.web?.architect?.build?.options ?? {};
const webServeOptions =
  angularWorkspace.projects?.web?.architect?.serve?.options ?? {};

test('Given the deployed web builds, When CSP forbids inline event handlers, Then staging and production keep critical CSS inlining disabled', () => {
  assert.equal(
    webBuildConfigurations.production?.optimization?.styles?.inlineCritical,
    false,
  );
  assert.equal(
    webBuildConfigurations.staging?.optimization?.styles?.inlineCritical,
    false,
  );
});

test('Given la configuration Angular 21, When le build web est validé, Then les hôtes autorisés sont configurés sur le serveur de développement', () => {
  assert.equal(webBuildOptions.security, undefined);
  assert.deepEqual(webServeOptions.allowedHosts, []);
});
