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
  runGit(repositoryPath, ['switch', '-c', 'feat/example']);
  commitFile(repositoryPath, 'feature.txt', 'feature\n', 'feature change');

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

test('Given main est un ancêtre de la branche courte, When la lignée est requise, Then le contrôle réussit', () => {
  withRepository((repositoryPath) => {
    const result = runLineageCheck(
      repositoryPath,
      '--require-main-ancestor',
      'feat/example',
      'main',
    );

    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /main est un ancêtre de la branche courte/);
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

test('Given main et la branche courte divergent, When la lignée est requise, Then un rebase est exigé avec les deux écarts', () => {
  withRepository((repositoryPath) => {
    runGit(repositoryPath, ['switch', 'main']);
    commitFile(repositoryPath, 'main.txt', 'main\n', 'main change');

    const result = runLineageCheck(
      repositoryPath,
      '--require-main-ancestor',
      'feat/example',
      'main',
    );

    assert.equal(result.status, 1);
    assert.match(result.stdout, /head en avance de 1 commit\(s\)/);
    assert.match(result.stdout, /main en avance de 1 commit\(s\)/);
    assert.match(result.stdout, /un rebase est requis/i);
  });
});

test('Given une PR vers main, When le workflow est lancé, Then la branche courte doit contenir main', () => {
  const workflow = readFileSync(
    path.join(repoRoot, '.github', 'workflows', 'release-lineage.yml'),
    'utf8',
  );
  const protectionScript = readFileSync(
    path.join(repoRoot, 'scripts', 'github', 'update-branch-protection.mjs'),
    'utf8',
  );

  assert.match(workflow, /pull_request:\s+branches: \[main\]/);
  assert.match(workflow, /ref: \$\{\{ github.event.pull_request.head.sha \}\}/);
  assert.match(workflow, /--require-main-ancestor HEAD origin\/main/);
  assert.match(protectionScript, /'Branch Lineage'/);
});
