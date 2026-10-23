#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

export function parseMigrationList(output) {
  let result;

  try {
    result = JSON.parse(output);
  } catch {
    throw new Error('Unable to parse Supabase migration list JSON.');
  }

  const migrations = result?.data?.migrations ?? result?.migrations;

  if (
    !Array.isArray(migrations) ||
    migrations.some(
      (migration) =>
        typeof migration?.local !== 'string' ||
        typeof migration?.remote !== 'string',
    )
  ) {
    throw new Error('Supabase migration list JSON has no valid migration rows.');
  }

  return migrations;
}

export function findRemoteOnlyMigrations(migrations) {
  return migrations
    .filter((migration) => migration.remote !== '' && migration.local === '')
    .map((migration) => migration.remote);
}

function main() {
  const result = spawnSync(
    'supabase',
    ['migration', 'list', '--linked', '--output-format', 'json'],
    { encoding: 'utf8', shell: false },
  );

  if (result.error) {
    throw new Error(`Impossible de lancer Supabase CLI : ${result.error.message}`);
  }

  if (result.status !== 0) {
    const details = (result.stderr || result.stdout || '').trim();
    throw new Error(
      `La liste des migrations Supabase a échoué (code ${result.status ?? 'inconnu'}).${details ? `\n${details}` : ''}`,
    );
  }

  const remoteOnlyMigrations = findRemoteOnlyMigrations(
    parseMigrationList(result.stdout),
  );

  if (remoteOnlyMigrations.length > 0) {
    console.error(
      '[migration-lineage] Historique distant divergent : ces versions présentes sur le projet lié sont absentes de supabase/migrations/:',
    );
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

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
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
