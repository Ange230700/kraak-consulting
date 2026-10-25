import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const clientRoot = path.join(repoRoot, 'apps', 'client');
const supportedPlatforms = new Set(['android', 'ios']);

function getNpxCommand() {
  return process.platform === 'win32' ? 'npx.cmd' : 'npx';
}

export function parseCapacitorPlatform(argv) {
  const platform = argv[0];

  if (typeof platform !== 'string' || platform.length === 0) {
    throw new Error(
      'Plateforme Capacitor manquante. Usage: fournir `android` ou `ios`.',
    );
  }

  if (!supportedPlatforms.has(platform)) {
    throw new Error(
      'Plateforme Capacitor invalide. Valeurs attendues: android, ios.',
    );
  }

  return platform;
}

export function getCapacitorPlatformDirectory(
  platform,
  { clientRootPath = clientRoot } = {},
) {
  return path.join(clientRootPath, platform);
}

export function ensureCapacitorPlatform(
  platform,
  {
    clientRootPath = clientRoot,
    runCommand = (command, args, options) => spawnSync(command, args, options),
  } = {},
) {
  const resolvedPlatform = parseCapacitorPlatform([platform]);
  const platformDirectory = getCapacitorPlatformDirectory(resolvedPlatform, {
    clientRootPath,
  });

  if (existsSync(platformDirectory)) {
    return {
      created: false,
      platform: resolvedPlatform,
      platformDirectory,
    };
  }

  const commandResult = runCommand(
    getNpxCommand(),
    ['cap', 'add', resolvedPlatform],
    {
      cwd: clientRootPath,
      stdio: 'inherit',
    },
  );

  if (commandResult.status !== 0) {
    throw new Error(`Impossible d'ajouter la plateforme ${resolvedPlatform}.`);
  }

  return {
    created: true,
    platform: resolvedPlatform,
    platformDirectory,
  };
}

export function ensureCapacitorPlatformFromCli(argv = process.argv.slice(2)) {
  const platform = parseCapacitorPlatform(argv);
  const result = ensureCapacitorPlatform(platform);

  console.log(
    result.created
      ? `[capacitor-platform] ${platform}: plateforme créée`
      : `[capacitor-platform] ${platform}: plateforme déjà présente`,
  );

  return result;
}

if (path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  try {
    ensureCapacitorPlatformFromCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
