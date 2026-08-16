// scripts\generate-client-runtime-config.mjs

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const clientRoot = path.join(repoRoot, 'apps', 'client');
const supportedEnvironments = new Set(['local', 'staging', 'production']);
const outputPaths = [
  path.join(
    clientRoot,
    'projects',
    'mobile',
    'public',
    'assets',
    'runtime-config.js',
  ),
  path.join(
    clientRoot,
    'projects',
    'web',
    'public',
    'assets',
    'runtime-config.js',
  ),
];

function stripWrappingQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function parseEnvFile(filePath) {
  const fileContent = readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const variables = {};

  for (const rawLine of fileContent.split(/\r?\n/u)) {
    const trimmedLine = rawLine.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const normalizedLine = trimmedLine.startsWith('export ')
      ? trimmedLine.slice('export '.length).trim()
      : trimmedLine;
    const separatorIndex = normalizedLine.indexOf('=');

    if (separatorIndex <= 0) {
      continue;
    }

    const key = normalizedLine.slice(0, separatorIndex).trim();
    const rawValue = normalizedLine.slice(separatorIndex + 1).trim();

    variables[key] = stripWrappingQuotes(rawValue)
      .replaceAll(String.raw`\n`, '\n')
      .replaceAll(String.raw`\r`, '\r');
  }

  return variables;
}

function loadEnvFiles(filePaths) {
  const variables = {};

  for (const filePath of filePaths) {
    if (existsSync(filePath)) {
      Object.assign(variables, parseEnvFile(filePath));
    }
  }

  return variables;
}

function parseEnvironmentName(argv) {
  const envFlagIndex = argv.indexOf('--env');
  const environmentName =
    envFlagIndex === -1 ? 'local' : (argv[envFlagIndex + 1] ?? 'local');

  if (!supportedEnvironments.has(environmentName)) {
    throw new Error(
      `Environnement invalide "${environmentName}". Valeurs attendues: local, staging, production.`,
    );
  }

  return environmentName;
}

function resolveEnvFileNames(environmentName) {
  if (environmentName === 'local') {
    return ['.env', '.env.local'];
  }

  const envFileEnvironment =
    environmentName === 'production' ? 'prod' : environmentName;

  return ['.env', `.env.${envFileEnvironment}`];
}

function readRuntimeVariable(key, fileVariables, processEnv) {
  const fileValue = fileVariables[key]?.trim();

  if (fileValue) {
    return fileValue;
  }

  return processEnv[key]?.trim();
}

function readFirstRuntimeVariable(keys, fileVariables, processEnv) {
  for (const key of keys) {
    const value = readRuntimeVariable(key, fileVariables, processEnv);

    if (value) {
      return value;
    }
  }

  return undefined;
}

function addRuntimeVariable(runtimeConfig, key, value) {
  if (value) {
    runtimeConfig[key] = value;
  }
}

function buildRuntimeConfig(runtimeValues) {
  const runtimeConfig = {
    enableParticipantArea: runtimeValues.enableParticipantArea,
  };

  addRuntimeVariable(runtimeConfig, 'apiBaseUrl', runtimeValues.apiBaseUrl);
  addRuntimeVariable(
    runtimeConfig,
    'publicAssetBaseUrl',
    runtimeValues.publicAssetBaseUrl,
  );
  addRuntimeVariable(
    runtimeConfig,
    'contactPhoneE164',
    runtimeValues.contactPhoneE164,
  );
  addRuntimeVariable(
    runtimeConfig,
    'contactPhoneDisplay',
    runtimeValues.contactPhoneDisplay,
  );
  addRuntimeVariable(runtimeConfig, 'contactEmail', runtimeValues.contactEmail);
  addRuntimeVariable(
    runtimeConfig,
    'whatsappContactHref',
    runtimeValues.whatsappContactHref,
  );
  addRuntimeVariable(runtimeConfig, 'facebookUrl', runtimeValues.facebookUrl);
  addRuntimeVariable(runtimeConfig, 'instagramUrl', runtimeValues.instagramUrl);
  addRuntimeVariable(runtimeConfig, 'tiktokUrl', runtimeValues.tiktokUrl);
  addRuntimeVariable(runtimeConfig, 'siteUrl', runtimeValues.siteUrl);
  addRuntimeVariable(runtimeConfig, 'supabaseUrl', runtimeValues.supabaseUrl);
  addRuntimeVariable(
    runtimeConfig,
    'supabasePublishableKey',
    runtimeValues.supabasePublishableKey,
  );

  return runtimeConfig;
}

export function loadClientRuntimeConfig(
  environmentName,
  { clientRootPath = clientRoot, processEnv = process.env } = {},
) {
  const envFileNames = resolveEnvFileNames(environmentName);
  const envPaths = envFileNames.map((envFileName) =>
    path.join(clientRootPath, envFileName),
  );
  const fileVariables = loadEnvFiles(envPaths);
  const apiBaseUrl = readRuntimeVariable(
    'CLIENT_API_BASE_URL',
    fileVariables,
    processEnv,
  );
  const publicAssetBaseUrl = readRuntimeVariable(
    'KRAAK_PUBLIC_ASSET_BASE_URL',
    fileVariables,
    processEnv,
  );
  const contactPhoneE164 = readRuntimeVariable(
    'KRAAK_CONTACT_PHONE_E164',
    fileVariables,
    processEnv,
  );
  const contactPhoneDisplay = readRuntimeVariable(
    'KRAAK_CONTACT_PHONE_DISPLAY',
    fileVariables,
    processEnv,
  );
  const contactEmail = readRuntimeVariable(
    'KRAAK_CONTACT_EMAIL',
    fileVariables,
    processEnv,
  );
  const whatsappContactHref = readRuntimeVariable(
    'KRAAK_WHATSAPP_CONTACT_HREF',
    fileVariables,
    processEnv,
  );
  const facebookUrl = readRuntimeVariable(
    'KRAAK_FACEBOOK_URL',
    fileVariables,
    processEnv,
  );
  const instagramUrl = readRuntimeVariable(
    'KRAAK_INSTAGRAM_URL',
    fileVariables,
    processEnv,
  );
  const tiktokUrl = readRuntimeVariable(
    'KRAAK_TIKTOK_URL',
    fileVariables,
    processEnv,
  );
  const siteUrl = readRuntimeVariable(
    'CLIENT_SITE_URL',
    fileVariables,
    processEnv,
  );

  const supabaseUrl = readFirstRuntimeVariable(
    ['CLIENT_SUPABASE_URL', 'SUPABASE_URL'],
    fileVariables,
    processEnv,
  );

  const supabasePublishableKey = readFirstRuntimeVariable(
    [
      'CLIENT_SUPABASE_PUBLISHABLE_KEY',
      'SUPABASE_PUBLISHABLE_KEY',
      'SUPABASE_ANON_KEY',
    ],
    fileVariables,
    processEnv,
  );

  const participantAreaRawValue = readRuntimeVariable(
    'CLIENT_FEATURE_PARTICIPANT_AREA',
    fileVariables,
    processEnv,
  );
  const enableParticipantArea =
    participantAreaRawValue === undefined
      ? true
      : participantAreaRawValue === 'true';

  return buildRuntimeConfig({
    apiBaseUrl,
    publicAssetBaseUrl,
    contactPhoneE164,
    contactPhoneDisplay,
    contactEmail,
    whatsappContactHref,
    facebookUrl,
    instagramUrl,
    tiktokUrl,
    siteUrl,
    supabaseUrl,
    supabasePublishableKey,
    enableParticipantArea,
  });
}

export function serializeRuntimeConfig(runtimeConfig) {
  return [
    'globalThis.__KRAAK_RUNTIME_CONFIG__ = Object.freeze(',
    `${JSON.stringify(runtimeConfig, null, 2)}`,
    ');',
    '',
  ].join('\n');
}

export function generateClientRuntimeConfig(argv = process.argv.slice(2)) {
  const environmentName = parseEnvironmentName(argv);
  const runtimeConfig = loadClientRuntimeConfig(environmentName);
  const fileContent = serializeRuntimeConfig(runtimeConfig);

  for (const outputPath of outputPaths) {
    mkdirSync(path.dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, fileContent, 'utf8');
  }

  console.log(
    `[client-runtime-config] ${environmentName}: ${
      runtimeConfig.apiBaseUrl ?? 'fallback vers environment.*.ts'
    }`,
  );

  return runtimeConfig;
}

if (path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  try {
    generateClientRuntimeConfig();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
