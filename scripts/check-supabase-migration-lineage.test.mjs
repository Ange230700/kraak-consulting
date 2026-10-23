import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  checkMigrationLineage,
  findRemoteOnlyMigrations,
  parseMigrationList,
  resolveSupabaseExecutable,
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
  const migrations =
    parseMigrationList(`     Local      |     Remote     | Time (UTC)
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

test('Given a borderless table with empty local cells, When parsing it, Then remote-only versions are preserved', () => {
  assert.deepEqual(
    parseMigrationList(`Local | Remote | Time (UTC)
 | 20261023000000 | 2026-10-23 00:00:00`),
    [{ local: '', remote: '20261023000000' }],
  );
});

test('Given a Unicode bordered table, When parsing it, Then empty cells keep their columns', () => {
  assert.deepEqual(
    parseMigrationList(`│ Local │ Remote │ Time (UTC) │
├───────────────┼───────────────┼─────────────────────┤
│ │ 20261023000000 │ 2026-10-23 00:00:00 │`),
    [{ local: '', remote: '20261023000000' }],
  );
});

test('Given an explicit executable, When resolving it, Then its absolute path is used without PATH lookup', () => {
  assert.equal(
    resolveSupabaseExecutable({
      SUPABASE_EXECUTABLE: process.execPath,
      PATH: 'untrusted-directory',
    }),
    process.execPath,
  );
});

test('Given a missing or relative executable, When resolving it, Then PATH is never used as a fallback', () => {
  for (const executable of [undefined, '', 'supabase', './supabase']) {
    assert.throws(
      () =>
        resolveSupabaseExecutable({
          SUPABASE_EXECUTABLE: executable,
          PATH: process.env.PATH,
        }),
      /SUPABASE_EXECUTABLE.*chemin absolu/,
    );
  }
});

test('Given an unavailable executable, When resolving it, Then the check fails explicitly', () => {
  assert.throws(
    () =>
      resolveSupabaseExecutable({
        SUPABASE_EXECUTABLE: `${process.execPath}.missing`,
      }),
    /exécutable Supabase/,
  );
});

const alignedTable = `Local | Remote | Time (UTC)
20250718000000 | 20250718000000 | 2025-07-18 00:00:00
20260828233000 | | 2026-08-28 23:30:00`;

test('Given a database URL, When checking lineage, Then only the configured binary is executed without a shell', () => {
  const dbUrl = 'postgresql://reader:example@database.invalid/postgres';
  let invocation;
  const code = checkMigrationLineage({
    environment: {
      SUPABASE_EXECUTABLE: process.execPath,
      SUPABASE_DB_URL: dbUrl,
    },
    runCommand: (...args) => {
      invocation = args;
      return { status: 0, stdout: alignedTable };
    },
  });

  assert.equal(code, 0);
  assert.deepEqual(invocation, [
    process.execPath,
    ['migration', 'list', '--db-url', dbUrl],
    { encoding: 'utf8', shell: false },
  ]);
});

test('Given a linked project, When checking lineage, Then pending local migrations remain allowed', () => {
  assert.equal(
    checkMigrationLineage({
      environment: { SUPABASE_EXECUTABLE: process.execPath },
      runCommand: (_command, args) => {
        assert.deepEqual(args, ['migration', 'list', '--linked']);
        return { status: 0, stdout: alignedTable };
      },
    }),
    0,
  );
});

test('Given remote drift, When checking lineage, Then the version is reported and the check fails', (context) => {
  const errors = [];
  context.mock.method(console, 'error', (...args) =>
    errors.push(args.join(' ')),
  );

  assert.equal(
    checkMigrationLineage({
      environment: { SUPABASE_EXECUTABLE: process.execPath },
      runCommand: () => ({
        status: 0,
        stdout: `${alignedTable}\n | 20261023000000 | 2026-10-23 00:00:00`,
      }),
    }),
    1,
  );
  assert.match(errors.join('\n'), /20261023000000/);
});

test('Given CLI failure output containing credentials, When checking lineage, Then only the failure code is exposed', () => {
  assert.throws(
    () =>
      checkMigrationLineage({
        environment: { SUPABASE_EXECUTABLE: process.execPath },
        runCommand: () => ({
          status: 2,
          stderr: 'password=example-secret',
          stdout:
            'postgresql://reader:example-secret@database.invalid/postgres',
        }),
      }),
    (error) =>
      /code 2/.test(error.message) && !error.message.includes('example-secret'),
  );
});

test('Given a process startup error, When checking lineage, Then a clear error is raised without child details', () => {
  assert.throws(
    () =>
      checkMigrationLineage({
        environment: { SUPABASE_EXECUTABLE: process.execPath },
        runCommand: () => ({
          error: new Error('private child details'),
          status: null,
        }),
      }),
    (error) =>
      /Impossible de lancer Supabase CLI/.test(error.message) &&
      !error.message.includes('private child details'),
  );
});

test('Given no configured executable, When invoking the script, Then it exits nonzero instead of searching PATH', () => {
  const result = spawnSync(
    process.execPath,
    [
      fileURLToPath(
        new URL('./check-supabase-migration-lineage.mjs', import.meta.url),
      ),
    ],
    {
      encoding: 'utf8',
      shell: false,
      env: { ...process.env, SUPABASE_EXECUTABLE: '' },
    },
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, /SUPABASE_EXECUTABLE.*chemin absolu/);
  assert.equal(result.stdout, '');
});

test('Given PR validation, When configuring CI, Then lineage tests run without database credentials or an environment', () => {
  const workflow = readFileSync(
    new URL('../.github/workflows/ci.yml', import.meta.url),
    'utf8',
  );
  const job = workflow.split('  migration-lineage:')[1]?.split('\n  #')[0];
  assert.ok(job);
  assert.match(
    job,
    /node --test scripts\/check-supabase-migration-lineage.test.mjs/,
  );
  assert.doesNotMatch(job, /secrets\.|environment:|setup-cli/);
});

function readGuardWorkflow() {
  return readFileSync(
    new URL(
      '../.github/workflows/supabase-migrations-guard.yml',
      import.meta.url,
    ),
    'utf8',
  );
}

test('Given production deployment, When applying migrations, Then a read-only lineage check runs first in trusted push context', () => {
  const workflow = readGuardWorkflow();
  const checkIndex = workflow.indexOf(
    '      - name: Check production migration lineage',
  );
  assert.ok(checkIndex > 0);
  assert.ok(
    checkIndex <
      workflow.indexOf('      - name: Apply migrations to mapped database'),
  );
  const step = workflow.slice(checkIndex).split('\n      - name:')[0];
  assert.match(step, /if: github.ref == 'refs\/heads\/main'/);
  assert.match(step, /secrets.SUPABASE_DB_URL_PRODUCTION_READONLY/);
  assert.match(step, /SUPABASE_EXECUTABLE:/);
  assert.match(step, /exit 1/);
  assert.doesNotMatch(workflow, /pull_request_target:|pull_request:/);
});

test('Given une URL de base contenant des caractères shell, When les migrations sont appliquées, Then elle transite uniquement par variable d environnement', () => {
  const workflow = readGuardWorkflow();
  const applyIndex = workflow.indexOf(
    '      - name: Apply migrations to mapped database',
  );
  assert.ok(applyIndex > 0);
  const step = workflow.slice(applyIndex).split('\n      - name:')[0];
  const script = step.split('run: |')[1] ?? '';
  assert.doesNotMatch(script, /\$\{\{/);
  assert.match(
    step,
    /STAGING_DB_URL: \$\{\{ secrets.SUPABASE_DB_URL_STAGING \}\}/,
  );
  assert.match(script, /--db-url "\$\{DB_URL\}"/);
  assert.doesNotMatch(workflow, /db_url=/);
});

test('Given staging migration configuration, When applying migrations, Then the environment secret is validated and not exposed as a step output', () => {
  const workflow = readGuardWorkflow();
  const validationIndex = workflow.indexOf(
    '      - name: Validate environment-scoped secrets',
  );
  const applyIndex = workflow.indexOf(
    '      - name: Apply migrations to mapped database',
  );
  assert.ok(validationIndex > 0);
  assert.ok(applyIndex > validationIndex);
  const validation = workflow.slice(validationIndex, applyIndex);

  assert.match(workflow, /environment: \$\{\{ needs\.guard\.outputs\.target_environment \}\}/);
  assert.match(validation, /SUPABASE_DB_URL_STAGING/);
  assert.match(
    validation,
    /::error::Missing secret SUPABASE_DB_URL_STAGING in GitHub environment 'staging'/,
  );
  assert.match(
    validation,
    /::error::SUPABASE_DB_URL_PRODUCTION must not be set in GitHub environment 'staging'/,
  );
  assert.match(
    validation,
    /::error::Missing secret SUPABASE_DB_URL_PRODUCTION in GitHub environment 'production'/,
  );
  assert.match(
    validation,
    /::error::SUPABASE_DB_URL_STAGING must not be set in GitHub environment 'production'/,
  );
});
