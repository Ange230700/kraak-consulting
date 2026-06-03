import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = path.resolve(import.meta.dirname, '..');
const supabaseConfigPath = path.join(repoRoot, 'supabase', 'config.toml');
const authBootstrapMigrationPath = path.join(
  repoRoot,
  'supabase',
  'migrations',
  '20260414000000_auth_setup.sql',
);
const initialSchemaPath = path.join(
  repoRoot,
  'supabase',
  'migrations',
  '20250718000000_initial_schema.sql',
);
const confirmationTemplatePath = path.join(
  repoRoot,
  'supabase',
  'templates',
  'auth',
  'confirmation.html',
);
const recoveryTemplatePath = path.join(
  repoRoot,
  'supabase',
  'templates',
  'auth',
  'recovery.html',
);

function readTextFile(filePath) {
  return readFileSync(filePath, 'utf8');
}

test("Given l'auth Supabase versionnée, When on lit la config locale, Then le provider email et les redirections MVP sont configurés", () => {
  const config = readTextFile(supabaseConfigPath);
  const confirmationTemplate = readTextFile(confirmationTemplatePath);
  const recoveryTemplate = readTextFile(recoveryTemplatePath);

  assert.match(config, /^project_id = "kraak-group"$/m);
  assert.match(config, /^\[auth\]$/m);
  assert.match(config, /^site_url = "http:\/\/localhost:4200"$/m);
  assert.match(config, /http:\/\/localhost:4200\/auth\/callback/);
  assert.match(config, /http:\/\/localhost:4200\/auth\/reset/);
  assert.match(config, /http:\/\/localhost:4300\/auth\/callback/);
  assert.match(config, /http:\/\/localhost:4300\/auth\/reset/);
  assert.match(config, /kraak:\/\/auth\/callback/);
  assert.match(config, /kraak:\/\/auth\/reset/);
  assert.match(config, /^\[auth\.email\]$/m);
  assert.match(config, /^enable_signup = true$/m);
  assert.match(config, /^enable_confirmations = true$/m);
  assert.match(config, /^\[auth\.email\.template\.confirmation\]$/m);
  assert.match(
    config,
    /content_path = "\.\/supabase\/templates\/auth\/confirmation\.html"/,
  );
  assert.match(config, /^\[auth\.email\.template\.recovery\]$/m);
  assert.match(
    config,
    /content_path = "\.\/supabase\/templates\/auth\/recovery\.html"/,
  );
  assert.match(confirmationTemplate, /\{\{ \.ConfirmationURL \}\}/);
  assert.match(recoveryTemplate, /\{\{ \.ConfirmationURL \}\}/);
});

test('Given le bootstrap auth du MVP, When on lit la migration dédiée, Then chaque nouvel utilisateur Auth provisionne app_user', () => {
  const migration = readTextFile(authBootstrapMigrationPath);

  assert.match(
    migration,
    /CREATE OR REPLACE FUNCTION public\.handle_auth_user_created\(\)/,
  );
  assert.match(migration, /RETURNS trigger/);
  assert.match(migration, /INSERT INTO public\.app_user/);
  assert.match(migration, /new\.raw_user_meta_data/);
  assert.match(
    migration,
    /CREATE TRIGGER on_auth_user_created[\s\S]+AFTER INSERT ON auth\.users/i,
  );
});

test('Given le schéma initial, When on vérifie la sécurité de base, Then les tables auth-liées gardent RLS et leurs politiques principales', () => {
  const schema = readTextFile(initialSchemaPath);

  for (const tableName of [
    'app_user',
    'participant',
    'session',
    'resource',
    'announcement',
    'enrollment',
    'notification',
    'support_request',
  ]) {
    assert.match(
      schema,
      new RegExp(String.raw`ALTER TABLE ${tableName}\s+ENABLE ROW LEVEL SECURITY;`),
    );
  }

  for (const policyName of [
    'app_user_select_own',
    'participant_select_own',
    'session_select_enrolled',
    'resource_select_enrolled',
    'announcement_select_published',
    'enrollment_select_own',
    'notification_select_own',
    'support_request_select_own',
  ]) {
    assert.match(schema, new RegExp(String.raw`CREATE POLICY ${policyName}\b`));
  }
});
