#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { accessSync, constants, statSync } from 'node:fs';
import { isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';

const invalidMigrationTableMessage =
  'La liste Supabase ne contient pas un tableau de migrations valide.';

export function resolveSupabaseExecutable(environment = process.env) {
  const executable = environment.SUPABASE_EXECUTABLE;
  if (!executable || !isAbsolute(executable)) {
    throw new Error(
      'SUPABASE_EXECUTABLE doit désigner un chemin absolu fiable vers Supabase CLI.',
    );
  }

  if (!statSync(executable, { throwIfNoEntry: false })?.isFile()) {
    throw new Error('Le fichier exécutable Supabase est introuvable.');
  }
  accessSync(executable, constants.X_OK);
  return executable;
}

function splitTableColumns(line) {
  const separator = line.includes('|') ? '|' : '│';
  const columns = line.split(separator).map((column) => column.trim());

  if (columns.length > 3 && columns[0] === '') {
    columns.shift();
  }
  if (columns.length > 3 && columns.at(-1) === '') {
    columns.pop();
  }

  return columns;
}

function cleanTableCell(value) {
  return value.replaceAll('`', '').trim();
}

export function parseMigrationList(output) {
  const lines = output.split(/\r?\n/);
  const headerIndex = lines.findIndex((line) => {
    const columns = splitTableColumns(line).map((column) =>
      column.toLowerCase(),
    );

    return (
      columns.length === 3 &&
      columns[0] === 'local' &&
      columns[1] === 'remote' &&
      columns[2] === 'time (utc)'
    );
  });

  if (headerIndex === -1) {
    throw new Error(invalidMigrationTableMessage);
  }

  const migrations = [];
  for (const line of lines.slice(headerIndex + 1)) {
    if (!line.trim() || /^[\s+|\-─┼├┤┌┐└┘┬┴]+$/.test(line)) {
      continue;
    }

    const columns = splitTableColumns(line);
    const local = cleanTableCell(columns[0]);
    const remote = cleanTableCell(columns[1] ?? '');

    if (columns.length !== 3 || (!local && !remote)) {
      throw new Error(invalidMigrationTableMessage);
    }

    migrations.push({ local, remote });
  }

  return migrations;
}

export function findRemoteOnlyMigrations(migrations) {
  return migrations
    .filter((migration) => migration.remote !== '' && migration.local === '')
    .map((migration) => migration.remote);
}

export function checkMigrationLineage({
  environment = process.env,
  runCommand = spawnSync,
} = {}) {
  const executable = resolveSupabaseExecutable(environment);
  const dbUrl = environment.SUPABASE_DB_URL;
  const targetArgs = dbUrl ? ['--db-url', dbUrl] : ['--linked'];
  const result = runCommand(executable, ['migration', 'list', ...targetArgs], {
    encoding: 'utf8',
    shell: false,
  });

  if (result.error) {
    throw new Error(
      'Impossible de lancer Supabase CLI. Vérifiez le binaire et ses permissions.',
    );
  }

  if (result.status !== 0) {
    const status = result.status ?? 'inconnu';
    throw new Error(
      `La liste des migrations Supabase a échoué (code ${status}). Vérifiez la connexion et les droits de lecture de l’historique.`,
    );
  }

  const remoteOnlyMigrations = findRemoteOnlyMigrations(
    parseMigrationList(result.stdout),
  );

  if (remoteOnlyMigrations.length > 0) {
    console.error(
      '[migration-lineage] Historique distant divergent : migrations distantes absentes du dépôt.',
    );
    console.error('Versions :');
    for (const version of remoteOnlyMigrations) {
      console.error(`  - ${version}`);
    }
    return 1;
  }

  console.log(
    '[migration-lineage] Toutes les migrations distantes sont présentes dans supabase/migrations/.',
  );
  return 0;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    process.exitCode = checkMigrationLineage();
  } catch (error) {
    console.error(
      '[migration-lineage] Échec du contrôle :',
      error instanceof Error ? error.message : String(error),
    );
    process.exitCode = 1;
  }
}
