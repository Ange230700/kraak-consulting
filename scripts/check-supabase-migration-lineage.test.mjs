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

test('Given migration list JSON, When parsing it, Then migration rows are returned', () => {
  const rows = [{ local: '20250718000000', remote: '20250718000000' }];

  assert.deepEqual(
    parseMigrationList(
      JSON.stringify({
        type: 'success',
        message: 'Migrations listed',
        data: { migrations: rows },
      }),
    ),
    rows,
  );
});

test('Given invalid migration list JSON, When parsing it, Then a clear error is thrown', () => {
  assert.throws(
    () => parseMigrationList('not json'),
    /Unable to parse Supabase migration list/,
  );
});
