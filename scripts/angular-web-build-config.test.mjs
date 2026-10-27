import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const angularWorkspaceUrl = new URL(
  '../apps/client/angular.json',
  import.meta.url,
);
const applicationSchemaUrl = new URL(
  '../apps/client/node_modules/@angular/build/src/builders/application/schema.json',
  import.meta.url,
);
const devServerSchemaUrl = new URL(
  '../apps/client/node_modules/@angular/build/src/builders/dev-server/schema.json',
  import.meta.url,
);

const angularWorkspaceContent = readFileSync(angularWorkspaceUrl, 'utf8');
const angularWorkspace = JSON.parse(angularWorkspaceContent);
const applicationSchema = JSON.parse(
  readFileSync(applicationSchemaUrl, 'utf8'),
);
const devServerSchema = JSON.parse(readFileSync(devServerSchemaUrl, 'utf8'));

const webBuildTarget = angularWorkspace.projects?.web?.architect?.build ?? {};
const webServeTarget = angularWorkspace.projects?.web?.architect?.serve ?? {};
const webBuildOptions = webBuildTarget.options ?? {};
const webBuildConfigurations = webBuildTarget.configurations ?? {};
const webServeOptions = webServeTarget.options ?? {};
const webServeConfigurations = webServeTarget.configurations ?? {};

const applicationOptionNames = new Set(
  Object.keys(applicationSchema.properties),
);
const devServerOptionNames = new Set(Object.keys(devServerSchema.properties));

function assertSupportedOptions(options, supportedOptions, targetName) {
  const unsupportedOptions = Object.keys(options).filter(
    (optionName) => !supportedOptions.has(optionName),
  );

  assert.deepEqual(
    unsupportedOptions,
    [],
    `${targetName} contient des propriétés Angular non supportées: ${unsupportedOptions.join(
      ', ',
    )}`,
  );
}

test('Given le fichier angular.json, When la configuration est lue, Then le JSON est valide', () => {
  assert.doesNotThrow(() => JSON.parse(angularWorkspaceContent));
});

test('Given la cible build web Angular, When ses options sont vérifiées, Then aucune propriété non supportée n est déclarée', () => {
  assertSupportedOptions(
    webBuildOptions,
    applicationOptionNames,
    'web.architect.build.options',
  );
  assert.equal(webBuildOptions.security, undefined);
});

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

test('Given la configuration production du build web, When ses options sont vérifiées, Then elle reste compatible avec le builder Angular', () => {
  assertSupportedOptions(
    webBuildConfigurations.production ?? {},
    applicationOptionNames,
    'web.architect.build.configurations.production',
  );
  assert.equal(
    webBuildConfigurations.production?.optimization?.styles?.inlineCritical,
    false,
  );
});

test('Given les serveurs web local et staging, When leurs options sont vérifiées, Then allowedHosts reste une option du dev-server', () => {
  assertSupportedOptions(
    webServeOptions,
    devServerOptionNames,
    'web.architect.serve.options',
  );
  assert.deepEqual(webServeOptions.allowedHosts, []);

  for (const configurationName of ['local', 'staging']) {
    const configuration = webServeConfigurations[configurationName];

    assertSupportedOptions(
      configuration,
      devServerOptionNames,
      `web.architect.serve.configurations.${configurationName}`,
    );
    assert.equal(configuration.buildTarget, `web:build:${configurationName}`);
  }
});
