// scripts\verify-capacitor-android-plugins.test.mjs

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const clientDirectory = path.join(scriptDirectory, '..', 'apps', 'client');
const capacitorConfigPath = path.join(clientDirectory, 'capacitor.config.ts');
const googleServicesJsonPath = path.join(
  clientDirectory,
  'android',
  'app',
  'google-services.json',
);

function readCapacitorConfigSource() {
  return readFileSync(capacitorConfigPath, 'utf8');
}

test(
  "tant que google-services.json est absent, capacitor.config.ts restreint les plugins natifs Android via includePlugins pour éviter le crash FCM au démarrage",
  () => {
    if (existsSync(googleServicesJsonPath)) {
      // Une fois Firebase provisionné, le plugin push-notifications peut être
      // réactivé : on n'impose plus le whitelist vide.
      return;
    }

    const capacitorConfigSource = readCapacitorConfigSource();

    assert.match(
      capacitorConfigSource,
      /android\s*:\s*\{[^}]*includePlugins\s*:\s*\[\s*\]/u,
      "capacitor.config.ts doit définir android.includePlugins: [] tant que Firebase (google-services.json) n'est pas configuré, sinon @capacitor/push-notifications fait planter l'APK au démarrage.",
    );
  },
);
