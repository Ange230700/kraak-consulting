import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';

const repoRoot = process.cwd();
const scriptPath = path.join(
  repoRoot,
  'scripts',
  'github',
  'update-branch-protection.mjs',
);

test('Given staging auto-deploys from protected merges, When protection is configured, Then only compliant pull requests can update it', () => {
  const result = spawnSync(
    process.execPath,
    [scriptPath, '--dry-run', '--staging-only'],
    {
      cwd: repoRoot,
      env: { ...process.env, GH_BIN: process.execPath },
      encoding: 'utf8',
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.doesNotMatch(result.stdout, /=== main ===/);
  const stagingOutput = result.stdout
    .split('\n=== staging ===\n')[1]
    .split('\n(dry-run, not applied)')[0];
  const protection = JSON.parse(stagingOutput);

  assert.equal(protection.enforce_admins, true);
  assert.equal(protection.required_status_checks.strict, true);
  assert.deepEqual(protection.required_pull_request_reviews, {
    dismiss_stale_reviews: false,
    require_code_owner_reviews: false,
    required_approving_review_count: 0,
    require_last_push_approval: false,
  });
  assert.equal(protection.required_conversation_resolution, true);
  assert.equal(protection.allow_force_pushes, false);
  assert.equal(protection.allow_deletions, false);
  assert.deepEqual(protection.required_status_checks.contexts, [
    'SonarCloud Analysis',
    'SonarCloud Code Analysis',
    'Format & Lint',
    'Migration Lineage Tests',
    'Audit dépendances',
    'Build',
    'Tests unitaires',
    'Tests integration',
    'Tests E2E',
    'Workspace Checks',
    'Docker Build',
    'Android Debug APK',
  ]);
});
