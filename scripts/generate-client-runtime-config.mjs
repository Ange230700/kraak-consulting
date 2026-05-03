// scripts\generate-client-runtime-config.mjs

/* global console */

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

function resolveEnvFileName(environmentName) {
  if (environmentName === 'local') {
    return '.env';
  }

  const envFileEnvironment =
    environmentName === 'production' ? 'prod' : environmentName;

  return `.env.${envFileEnvironment}`;
}

function readRuntimeVariable(key, fileVariables, processEnv) {
  const fileValue = fileVariables[key]?.trim();

  if (fileValue) {
    return fileValue;
  }

  return processEnv[key]?.trim();
}

export function loadClientRuntimeConfig(
  environmentName,
  { clientRootPath = clientRoot, processEnv = process.env } = {},
) {
  const envFileName = resolveEnvFileName(environmentName);
  const envPath = path.join(clientRootPath, envFileName);
  const fileVariables = existsSync(envPath) ? parseEnvFile(envPath) : {};
  const apiBaseUrl = readRuntimeVariable(
    'CLIENT_API_BASE_URL',
    fileVariables,
    processEnv,
  );
  const supabaseUrl = readRuntimeVariable(
    'SUPABASE_URL',
    fileVariables,
    processEnv,
  );
  const supabasePublishableKey = readRuntimeVariable(
    'SUPABASE_PUBLISHABLE_KEY',
    fileVariables,
    processEnv,
  );
  const enableParticipantArea =
    readRuntimeVariable(
      'CLIENT_FEATURE_PARTICIPANT_AREA',
      fileVariables,
      processEnv,
    ) === 'true';

  if (!apiBaseUrl && (!supabaseUrl || !supabasePublishableKey)) {
    return { enableParticipantArea };
  }

  return {
    ...(apiBaseUrl ? { apiBaseUrl } : {}),
    ...(supabaseUrl && supabasePublishableKey
      ? {
          supabaseUrl,
          supabasePublishableKey,
        }
      : {}),
    enableParticipantArea,
  };
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
