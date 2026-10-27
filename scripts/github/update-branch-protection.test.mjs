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

test('Given main est la seule branche permanente, When sa protection est configurée, Then seules les PR conformes peuvent la modifier', () => {
  const result = spawnSync(process.execPath, [scriptPath, '--dry-run'], {
    cwd: repoRoot,
    env: { ...process.env, GH_BIN: process.execPath },
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.doesNotMatch(result.stdout, /=== staging ===/);
  const mainOutput = result.stdout
    .split('\n=== main ===\n')[1]
    .split('\n(dry-run, not applied)')[0];
  const protection = JSON.parse(mainOutput);

  assert.equal(protection.enforce_admins, true);
  assert.equal(protection.required_status_checks.strict, true);
  assert.deepEqual(protection.required_pull_request_reviews, {
    dismiss_stale_reviews: true,
    require_code_owner_reviews: true,
    required_approving_review_count: 0,
    require_last_push_approval: false,
  });
  assert.equal(protection.required_conversation_resolution, true);
  assert.equal(protection.allow_force_pushes, false);
  assert.equal(protection.allow_deletions, false);
  assert.deepEqual(
    protection.required_status_checks.checks.map((check) => check.context),
    [
      'Quality gate',
      'SonarCloud Analysis',
      'SonarCloud Code Analysis',
      'Branch Lineage',
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
    ],
  );
  assert.equal(protection.required_status_checks.contexts, undefined);
  for (const check of protection.required_status_checks.checks) {
    assert.equal(
      check.app_id,
      check.context === 'SonarCloud Code Analysis' ? 12526 : 15368,
    );
  }
});
