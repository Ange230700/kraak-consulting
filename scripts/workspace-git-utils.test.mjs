import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getChangedFiles,
  getGitOutput,
  refExists,
  resolveBaseRef,
  resolveGitExecutable,
} from './workspace-git-utils.mjs';

function gitResult(status, stdout = '') {
  return { status, stdout, stderr: '' };
}

test('Given GIT_EXECUTABLE is configured, When resolving git, Then that executable is preferred', () => {
  const resolved = resolveGitExecutable({
    environment: { GIT_EXECUTABLE: '/custom/git' },
    fileExists: (candidate) => candidate === '/custom/git',
    platform: 'linux',
  });

  assert.equal(resolved, '/custom/git');
});

test('Given no git candidate exists, When resolving git, Then a contextual error is raised', () => {
  assert.throws(
    () =>
      resolveGitExecutable({
        environment: {},
        errorPrefix: '[test]',
        fileExists: () => false,
        platform: 'linux',
      }),
    /\[test\] Exécutable git introuvable/u,
  );
});

test('Given git command succeeds, When reading git output, Then whitespace is trimmed', () => {
  const output = getGitOutput(['status', '--short'], {
    gitRunner: () => gitResult(0, '  clean\n'),
  });

  assert.equal(output, 'clean');
});

test('Given git command fails, When reading git output, Then an empty string is returned', () => {
  const output = getGitOutput(['status', '--short'], {
    gitRunner: () => gitResult(1, 'unused'),
  });

  assert.equal(output, '');
});

test('Given a git ref resolves, When checking its existence, Then true is returned', () => {
  const exists = refExists('origin/staging', {
    gitRunner: (args) =>
      args.includes('origin/staging^{commit}') ? gitResult(0) : gitResult(1),
  });

  assert.equal(exists, true);
});

test('Given an upstream ref exists, When resolving the base ref, Then upstream is selected', () => {
  const selected = resolveBaseRef({
    gitRunner: (args) => {
      if (args.includes('@{upstream}')) {
        return gitResult(0, 'origin/staging\n');
      }

      return args.includes('origin/staging^{commit}')
        ? gitResult(0)
        : gitResult(1);
    },
  });

  assert.equal(selected, 'origin/staging');
});

test('Given upstream is unavailable, When resolving the base ref, Then the first existing fallback is selected', () => {
  const selected = resolveBaseRef({
    gitRunner: (args) => {
      if (args.includes('@{upstream}')) {
        return gitResult(1);
      }

      return args.includes('staging^{commit}') ? gitResult(0) : gitResult(1);
    },
  });

  assert.equal(selected, 'staging');
});

test('Given diff output contains blanks, When changed files are read, Then only normalized paths are returned', () => {
  const files = getChangedFiles('origin/staging', {
    gitRunner: (args) =>
      args.includes('origin/staging...HEAD')
        ? gitResult(
            0,
            ' apps/api/src/app.service.ts\r\n\nscripts/audit-docs.sh\n ',
          )
        : gitResult(1),
  });

  assert.deepEqual(files, [
    'apps/api/src/app.service.ts',
    'scripts/audit-docs.sh',
  ]);
});

test('Given git diff fails, When changed files are read, Then an empty list is returned and the caller warning is emitted', () => {
  let warning = '';

  const files = getChangedFiles('origin/staging', {
    gitRunner: () => gitResult(1),
    warningMessage: '[test] Fallback',
    writeWarning: (message) => {
      warning = message;
    },
  });

  assert.deepEqual(files, []);
  assert.equal(warning, '[test] Fallback');
});
