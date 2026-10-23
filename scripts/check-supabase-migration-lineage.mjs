#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

function splitTableColumns(line) {
  return line.split('│').map((column) => column.trim());
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
    throw new Error(
      'La liste Supabase ne contient pas un tableau de migrations valide.',
    );
  }

  const migrations = [];
  for (const line of lines.slice(headerIndex + 1)) {
    if (!line.trim() || /^[\s─┼]+$/.test(line)) {
      continue;
    }

    const columns = splitTableColumns(line);
    if (columns.length !== 3 || (!columns[0] && !columns[1])) {
      throw new Error(
        'La liste Supabase ne contient pas un tableau de migrations valide.',
      );
    }

    migrations.push({ local: columns[0], remote: columns[1] });
  }

  return migrations;
}

export function findRemoteOnlyMigrations(migrations) {
  return migrations
    .filter((migration) => migration.remote !== '' && migration.local === '')
    .map((migration) => migration.remote);
}

function main() {
  const dbUrl = process.env.SUPABASE_DB_URL;
  const targetArgs = dbUrl ? ['--db-url', dbUrl] : ['--linked'];
  const result = spawnSync(
    'supabase',
    ['migration', 'list', ...targetArgs],
    { encoding: 'utf8', shell: false },
  );

  if (result.error) {
    throw new Error(
      `Impossible de lancer Supabase CLI : ${result.error.message}`,
    );
  }

  if (result.status !== 0) {
    const rawDetails = (result.stderr || result.stdout || '').trim();
    const details = dbUrl
      ? rawDetails.replaceAll(dbUrl, '[URL de connexion masquée]')
      : rawDetails;
    const status = result.status ?? 'inconnu';
    const detailMessage = details ? `\n${details}` : '';
    throw new Error(
      `La liste des migrations Supabase a échoué (code ${status}).${detailMessage}`,
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
    process.exitCode = 1;
    return;
  }

  console.log(
    '[migration-lineage] Toutes les migrations distantes sont présentes dans supabase/migrations/.',
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    main();
  } catch (error) {
    console.error(
      '[migration-lineage] Échec du contrôle :',
      error instanceof Error ? error.message : String(error),
    );
    process.exitCode = 1;
  }
}
