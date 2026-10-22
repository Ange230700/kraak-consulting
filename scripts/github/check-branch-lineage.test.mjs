import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

import { getGitHookChildEnvironment } from '../git-hook-environment.mjs';

const repoRoot = process.cwd();
const scriptPath = path.join(
  repoRoot,
  'scripts',
  'github',
  'check-branch-lineage.mjs',
);
const gitExecutionEnvironment = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')),
);

function runGit(cwd, args) {
  const result = spawnSync('git', args, {
    cwd,
    env: gitExecutionEnvironment,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim();
}

function commitFile(repositoryPath, name, contents, message) {
  writeFileSync(path.join(repositoryPath, name), contents);
  runGit(repositoryPath, ['add', name]);
  runGit(repositoryPath, [
    '-c',
    'user.name=KRAAK Test',
    '-c',
    'user.email=test@example.com',
    'commit',
    '-m',
    message,
  ]);
}

function createRepository() {
  const repositoryPath = mkdtempSync(
    path.join(os.tmpdir(), 'kraak-branch-lineage-'),
  );
  runGit(repositoryPath, ['init', '-b', 'main']);
  commitFile(repositoryPath, 'README.md', 'base\n', 'base');
  runGit(repositoryPath, ['switch', '-c', 'staging']);
  commitFile(repositoryPath, 'staging.txt', 'staging\n', 'staging change');

  return repositoryPath;
}

function withRepository(run) {
  const repositoryPath = createRepository();

  try {
    run(repositoryPath);
  } finally {
    rmSync(repositoryPath, { recursive: true, force: true });
  }
}

function runLineageCheck(repositoryPath, ...args) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: repositoryPath,
    env: gitExecutionEnvironment,
    encoding: 'utf8',
  });
}

test('Given main is an ancestor of staging, When release lineage is required, Then the check passes', () => {
  withRepository((repositoryPath) => {
    const result = runLineageCheck(
      repositoryPath,
      '--require-main-ancestor',
      'staging',
      'main',
    );

    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /main est un ancêtre de staging/);
  });
});

test('Given Git hook repository variables, When child environment is prepared, Then only repository context is removed', () => {
  const sourceEnvironment = {
    GIT_DIR: 'C:\\repo\\.git',
    GIT_WORK_TREE: 'C:\\repo',
    GIT_INDEX_FILE: 'C:\\repo\\.git\\index',
    GIT_CONFIG_COUNT: '1',
    PATH: 'C:\\tools',
  };

  const result = getGitHookChildEnvironment(sourceEnvironment);

  assert.deepEqual(result, {
    GIT_CONFIG_COUNT: '1',
    PATH: 'C:\\tools',
  });
  assert.equal(sourceEnvironment.GIT_DIR, 'C:\\repo\\.git');
});

test('Given main and staging have diverged, When release lineage is required, Then promotion is blocked with both commit counts', () => {
  withRepository((repositoryPath) => {
    runGit(repositoryPath, ['switch', 'main']);
    commitFile(repositoryPath, 'main.txt', 'main\n', 'main change');

    const result = runLineageCheck(
      repositoryPath,
      '--require-main-ancestor',
      'staging',
      'main',
    );

    assert.equal(result.status, 1);
    assert.match(result.stdout, /staging en avance de 1 commit\(s\)/);
    assert.match(result.stdout, /main en avance de 1 commit\(s\)/);
    assert.match(result.stdout, /promotion automatique n’est pas sûre/i);
  });
});

test('Given a pull request targets main, When the release workflow runs, Then it requires staging lineage validation', () => {
  const workflow = readFileSync(
    path.join(repoRoot, '.github', 'workflows', 'release-lineage.yml'),
    'utf8',
  );
  const protectionScript = readFileSync(
    path.join(repoRoot, 'scripts', 'github', 'update-branch-protection.mjs'),
    'utf8',
  );

  assert.match(workflow, /pull_request:\s+branches: \[main\]/);
  assert.match(workflow, /HEAD_BRANCH.*staging/);
  assert.match(
    workflow,
    /--require-main-ancestor origin\/staging origin\/main/,
  );
  assert.match(protectionScript, /'Branch Lineage'/);
});
