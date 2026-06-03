// scripts\generate-client-runtime-config.spec.mjs

import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  loadClientRuntimeConfig,
  serializeRuntimeConfig,
} from './generate-client-runtime-config.mjs';

test(
  'le runtime client expose aussi les URLs publiques de marque et contact quand elles sont définies',
  () => {
    const tempRoot = mkdtempSync(
      path.join(os.tmpdir(), 'kraak-client-runtime-config-'),
    );

    try {
      const envFilePath = path.join(tempRoot, '.env');
      writeFileSync(
        envFilePath,
        [
          'CLIENT_API_BASE_URL=http://localhost:3000',
          'SUPABASE_URL=http://127.0.0.1:54321',
          'SUPABASE_PUBLISHABLE_KEY=local-publishable-key',
          'KRAAK_PUBLIC_ASSET_BASE_URL=https://cdn.kraak.example/assets',
          'KRAAK_CONTACT_PHONE_E164=+225000000001',
          'KRAAK_CONTACT_PHONE_DISPLAY=+225 00 00 00 00 01',
          'KRAAK_CONTACT_EMAIL=contact@kraak.example',
          'KRAAK_WHATSAPP_CONTACT_HREF=https://wa.me/225000000001',
          'KRAAK_FACEBOOK_URL=https://www.facebook.com/kraak.example',
          'KRAAK_INSTAGRAM_URL=https://www.instagram.com/kraak.example',
          'KRAAK_TIKTOK_URL=https://www.tiktok.com/@kraak.example',
          '',
        ].join('\n'),
      );

      const runtimeConfig = loadClientRuntimeConfig('local', {
        clientRootPath: tempRoot,
        processEnv: {},
      });

      assert.deepEqual(runtimeConfig, {
        apiBaseUrl: 'http://localhost:3000',
        publicAssetBaseUrl: 'https://cdn.kraak.example/assets',
        contactPhoneE164: '+225000000001',
        contactPhoneDisplay: '+225 00 00 00 00 01',
        contactEmail: 'contact@kraak.example',
        whatsappContactHref: 'https://wa.me/225000000001',
        facebookUrl: 'https://www.facebook.com/kraak.example',
        instagramUrl: 'https://www.instagram.com/kraak.example',
        tiktokUrl: 'https://www.tiktok.com/@kraak.example',
        supabaseUrl: 'http://127.0.0.1:54321',
        supabasePublishableKey: 'local-publishable-key',
        enableParticipantArea: true,
      });
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  },
);

test(
  'le runtime client peut lire les variables locales depuis apps/client/.env quand le fichier existe',
  () => {
    const tempRoot = mkdtempSync(
      path.join(os.tmpdir(), 'kraak-client-runtime-config-'),
    );

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
        enableParticipantArea: true,
      });
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  },
);

test(
  'le runtime client peut lire les variables staging depuis process.env quand aucun fichier .env n est disponible',
  () => {
    const tempRoot = mkdtempSync(
      path.join(os.tmpdir(), 'kraak-client-runtime-config-'),
    );

    try {
      const runtimeConfig = loadClientRuntimeConfig('staging', {
        clientRootPath: tempRoot,
        processEnv: {
          CLIENT_API_BASE_URL: 'https://kraak-api-staging.onrender.com/',
          SUPABASE_URL: 'https://qgttdsnupelohowwkkwb.supabase.co',
          SUPABASE_PUBLISHABLE_KEY:
            'sb_publishable_5CKjUPh9rFkuUlwHyLIYpQ_c_plqe57',
        },
      });

      assert.deepEqual(runtimeConfig, {
        apiBaseUrl: 'https://kraak-api-staging.onrender.com/',
        supabaseUrl: 'https://qgttdsnupelohowwkkwb.supabase.co',
        supabasePublishableKey:
          'sb_publishable_5CKjUPh9rFkuUlwHyLIYpQ_c_plqe57',
        enableParticipantArea: true,
      });
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  },
);

test(
  'le runtime client renvoie uniquement le flag participant en production quand aucune variable publique n est fournie',
  () => {
    const tempRoot = mkdtempSync(
      path.join(os.tmpdir(), 'kraak-client-runtime-config-'),
    );

    try {
      const runtimeConfig = loadClientRuntimeConfig('production', {
        clientRootPath: tempRoot,
        processEnv: {},
      });

      assert.deepEqual(runtimeConfig, { enableParticipantArea: true });
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  },
);

test(
  'le runtime client lit les variables production depuis .env.prod quand le fichier existe',
  () => {
    const tempRoot = mkdtempSync(
      path.join(os.tmpdir(), 'kraak-client-runtime-config-'),
    );

    try {
      const envFilePath = path.join(tempRoot, '.env.prod');
      writeFileSync(
        envFilePath,
        [
          'CLIENT_API_BASE_URL=https://api.kraak.example',
          'SUPABASE_URL=https://kraak.supabase.co',
          'SUPABASE_PUBLISHABLE_KEY=production-publishable-key',
          '',
        ].join('\n'),
      );

      const runtimeConfig = loadClientRuntimeConfig('production', {
        clientRootPath: tempRoot,
        processEnv: {},
      });

      assert.deepEqual(runtimeConfig, {
        apiBaseUrl: 'https://api.kraak.example',
        supabaseUrl: 'https://kraak.supabase.co',
        supabasePublishableKey: 'production-publishable-key',
        enableParticipantArea: true,
      });
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  },
);

test(
  'le runtime client priorise les variables du fichier .env sur celles de process.env',
  () => {
    const tempRoot = mkdtempSync(
      path.join(os.tmpdir(), 'kraak-client-runtime-config-'),
    );

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
        enableParticipantArea: true,
      });
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  },
);

test(
  'le runtime client supporte la syntaxe export, les guillemets et les sauts de ligne échappés depuis le fichier env',
  () => {
    const tempRoot = mkdtempSync(
      path.join(os.tmpdir(), 'kraak-client-runtime-config-'),
    );

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
        enableParticipantArea: true,
      });
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  },
);

test(
  'le runtime client expose enableParticipantArea quand CLIENT_FEATURE_PARTICIPANT_AREA vaut "true"',
  () => {
    const tempRoot = mkdtempSync(
      path.join(os.tmpdir(), 'kraak-client-runtime-config-'),
    );

    try {
      const envFilePath = path.join(tempRoot, '.env.staging');
      writeFileSync(
        envFilePath,
        [
          'CLIENT_API_BASE_URL=https://api.staging.example',
          'SUPABASE_URL=https://staging.supabase.co',
          'SUPABASE_PUBLISHABLE_KEY=staging-key',
          'CLIENT_FEATURE_PARTICIPANT_AREA=true',
          '',
        ].join('\n'),
      );

      const runtimeConfig = loadClientRuntimeConfig('staging', {
        clientRootPath: tempRoot,
        processEnv: {},
      });

      assert.equal(runtimeConfig.enableParticipantArea, true);
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  },
);

test(
  'le runtime client expose enableParticipantArea=true par défaut quand la variable est absente',
  () => {
    const tempRoot = mkdtempSync(
      path.join(os.tmpdir(), 'kraak-client-runtime-config-'),
    );

    try {
      const envFilePath = path.join(tempRoot, '.env.prod');
      writeFileSync(
        envFilePath,
        [
          'CLIENT_API_BASE_URL=https://api.prod.example',
          'SUPABASE_URL=https://prod.supabase.co',
          'SUPABASE_PUBLISHABLE_KEY=prod-key',
          '',
        ].join('\n'),
      );

      const runtimeConfig = loadClientRuntimeConfig('production', {
        clientRootPath: tempRoot,
        processEnv: {},
      });

      assert.equal(runtimeConfig.enableParticipantArea, true);
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  },
);

test(
  'le runtime client expose enableParticipantArea=false quand la variable vaut une valeur autre que "true"',
  () => {
    const tempRoot = mkdtempSync(
      path.join(os.tmpdir(), 'kraak-client-runtime-config-'),
    );

    try {
      const runtimeConfig = loadClientRuntimeConfig('production', {
        clientRootPath: tempRoot,
        processEnv: {
          CLIENT_FEATURE_PARTICIPANT_AREA: 'false',
        },
      });

      assert.equal(runtimeConfig.enableParticipantArea, false);
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  },
);

test(
  'la serialisation du runtime produit un script executable qui fige la configuration',
  () => {
    const serialized = serializeRuntimeConfig({
      apiBaseUrl: 'https://api.example',
      supabaseUrl: 'https://supabase.example',
      supabasePublishableKey: 'public-key',
      enableParticipantArea: false,
    });

    assert.equal(
      serialized,
      [
        'globalThis.__KRAAK_RUNTIME_CONFIG__ = Object.freeze(',
        '{',
        '  "apiBaseUrl": "https://api.example",',
        '  "supabaseUrl": "https://supabase.example",',
        '  "supabasePublishableKey": "public-key",',
        '  "enableParticipantArea": false',
        '}',
        ');',
        '',
      ].join('\n'),
    );
  },
);
