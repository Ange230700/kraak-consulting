import assert from 'node:assert/strict';
import test from 'node:test';

import {
  findRemoteOnlyMigrations,
  parseMigrationList,
} from './check-supabase-migration-lineage.mjs';

test('Given a remote-only migration, When checking lineage, Then its version is reported', () => {
  const migrations = [
    { local: '20250718000000', remote: '20250718000000' },
    { local: '', remote: '20260503162559' },
  ];

  assert.deepEqual(findRemoteOnlyMigrations(migrations), ['20260503162559']);
});

test('Given pending local migrations, When checking lineage, Then no drift is reported', () => {
  const migrations = [
    { local: '20250718000000', remote: '20250718000000' },
    { local: '20260828233000', remote: '' },
  ];

  assert.deepEqual(findRemoteOnlyMigrations(migrations), []);
});

test('Given the Supabase migration table, When parsing it, Then migration rows are returned', () => {
  const migrations = parseMigrationList(`     Local      |     Remote     | Time (UTC)
----------------+----------------+---------------------
\` \`              | \`20230103054303\` | \`2023-01-03 05:43:03\`
\`20230222032233\` | \` \`              | \`2023-02-22 03:22:33\`
\`20230301000000\` | \`20230301000000\` | \`2023-03-01 00:00:00\``);

  assert.deepEqual(migrations, [
    { local: '', remote: '20230103054303' },
    { local: '20230222032233', remote: '' },
    { local: '20230301000000', remote: '20230301000000' },
  ]);
  assert.deepEqual(findRemoteOnlyMigrations(migrations), ['20230103054303']);
});

test('Given a Supabase response without a migration table, When parsing it, Then a clear error is thrown', () => {
  assert.throws(
    () => parseMigrationList('not a migration table'),
    /La liste Supabase ne contient pas un tableau de migrations valide/,
  );
});
