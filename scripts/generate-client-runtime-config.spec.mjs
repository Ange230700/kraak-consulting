// scripts\generate-client-runtime-config.spec.mjs

/* global console */

import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  loadClientRuntimeConfig,
  serializeRuntimeConfig,
} from './generate-client-runtime-config.mjs';

function runTest(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

runTest(
  'le runtime client peut lire les variables locales depuis apps/client/.env quand le fichier existe',
  () => {
    const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'kraak-client-runtime-config-'));

    try {
      const envFilePath = path.join(tempRoot, '.env');
      writeFileSync(
        envFilePath,
        [
          'CLIENT_API_BASE_URL=http://localhost:3000',
          'SUPABASE_URL=http://127.0.0.1:54321',
          'SUPABASE_PUBLISHABLE_KEY=local-publishable-key',
          '',
        ].join('\n'),
      );

      const runtimeConfig = loadClientRuntimeConfig('local', {
        clientRootPath: tempRoot,
        processEnv: {},
      });

      assert.deepEqual(runtimeConfig, {
        apiBaseUrl: 'http://localhost:3000',
        supabaseUrl: 'http://127.0.0.1:54321',
        supabasePublishableKey: 'local-publishable-key',
      });
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  },
);

runTest(
  'le runtime client peut lire les variables staging depuis process.env quand aucun fichier .env n est disponible',
  () => {
    const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'kraak-client-runtime-config-'));

    try {
      const runtimeConfig = loadClientRuntimeConfig('staging', {
        clientRootPath: tempRoot,
        processEnv: {
          CLIENT_API_BASE_URL: 'https://kraak-api.onrender.com/',
          SUPABASE_URL: 'https://qgttdsnupelohowwkkwb.supabase.co',
          SUPABASE_PUBLISHABLE_KEY:
            'sb_publishable_5CKjUPh9rFkuUlwHyLIYpQ_c_plqe57',
        },
      });

      assert.deepEqual(runtimeConfig, {
        apiBaseUrl: 'https://kraak-api.onrender.com/',
        supabaseUrl: 'https://qgttdsnupelohowwkkwb.supabase.co',
        supabasePublishableKey: 'sb_publishable_5CKjUPh9rFkuUlwHyLIYpQ_c_plqe57',
      });
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  },
);

runTest(
  'le runtime client renvoie une configuration vide en production quand aucune variable publique n est fournie',
  () => {
    const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'kraak-client-runtime-config-'));

    try {
      const runtimeConfig = loadClientRuntimeConfig('production', {
        clientRootPath: tempRoot,
        processEnv: {},
      });

      assert.deepEqual(runtimeConfig, {});
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  },
);

runTest(
  'le runtime client priorise les variables du fichier .env sur celles de process.env',
  () => {
    const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'kraak-client-runtime-config-'));

    try {
      const envFilePath = path.join(tempRoot, '.env.staging');
      writeFileSync(
        envFilePath,
        [
          'CLIENT_API_BASE_URL=https://from-file.example',
          'SUPABASE_URL=https://from-file.supabase.co',
          'SUPABASE_PUBLISHABLE_KEY=from-file-key',
          '',
        ].join('\n'),
      );

      const runtimeConfig = loadClientRuntimeConfig('staging', {
        clientRootPath: tempRoot,
        processEnv: {
          CLIENT_API_BASE_URL: 'https://from-process.example',
          SUPABASE_URL: 'https://from-process.supabase.co',
          SUPABASE_PUBLISHABLE_KEY: 'from-process-key',
        },
      });

      assert.deepEqual(runtimeConfig, {
        apiBaseUrl: 'https://from-file.example',
        supabaseUrl: 'https://from-file.supabase.co',
        supabasePublishableKey: 'from-file-key',
      });
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  },
);

runTest(
  'le runtime client supporte la syntaxe export, les guillemets et les sauts de ligne echappes depuis le fichier env',
  () => {
    const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'kraak-client-runtime-config-'));

    try {
      const envFilePath = path.join(tempRoot, '.env');
      writeFileSync(
        envFilePath,
        [
          'export CLIENT_API_BASE_URL="https://quoted.example"',
          "export SUPABASE_URL='https://quoted.supabase.co'",
          String.raw`SUPABASE_PUBLISHABLE_KEY="line-1\nline-2"`,
          '',
        ].join('\n'),
      );

      const runtimeConfig = loadClientRuntimeConfig('local', {
        clientRootPath: tempRoot,
        processEnv: {},
      });

      assert.deepEqual(runtimeConfig, {
        apiBaseUrl: 'https://quoted.example',
        supabaseUrl: 'https://quoted.supabase.co',
        supabasePublishableKey: 'line-1\nline-2',
      });
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  },
);

runTest(
  'la serialisation du runtime produit un script executable qui fige la configuration',
  () => {
    const serialized = serializeRuntimeConfig({
      apiBaseUrl: 'https://api.example',
      supabaseUrl: 'https://supabase.example',
      supabasePublishableKey: 'public-key',
    });

    assert.equal(
      serialized,
      [
        'globalThis.__KRAAK_RUNTIME_CONFIG__ = Object.freeze(',
        '{',
        '  "apiBaseUrl": "https://api.example",',
        '  "supabaseUrl": "https://supabase.example",',
        '  "supabasePublishableKey": "public-key"',
        '}',
        ');',
        '',
      ].join('\n'),
    );
  },
);
