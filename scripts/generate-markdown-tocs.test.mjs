import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const repoRoot = process.cwd();
const scriptPath = path.join(repoRoot, 'scripts', 'generate-markdown-tocs.mjs');

function writeMarkdown(root, file, content) {
  const target = path.join(root, file);

  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(
    target,
    content.trimStart().replace(/\n/g, '\n') + '\n',
    'utf8',
  );
}

function runGit(root, args) {
  const result = spawnSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    timeout: 30_000,
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
}

function runScript(root, args) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: root,
    encoding: 'utf8',
    timeout: 30_000,
  });
}

function createFixtureRepository() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'kraak-markdown-tocs-'));

  runGit(root, ['init']);
  writeMarkdown(
    root,
    '.gitignore',
    `
ignored.md
`,
  );
  writeMarkdown(
    root,
    'docs/tracked.md',
    `
# Guide

## Même section

Texte.

## [TASK][DOCS] Section balisée

Texte.

## Même section

Texte.
`,
  );
  writeMarkdown(
    root,
    'docs/untracked.md',
    `
---
status: active
---

# Notice

## Usage
`,
  );
  writeMarkdown(
    root,
    'ignored.md',
    `
# Ignoré

## Section ignorée
`,
  );
  runGit(root, ['add', '.gitignore', 'docs/tracked.md']);
  runGit(root, ['commit', '-m', 'test: fixture']);

  return root;
}

test('Given tracked and non-ignored Markdown files, When ToCs are written, Then ignored files are left untouched', () => {
  const root = createFixtureRepository();

  try {
    const writeResult = runScript(root, ['--write']);

    assert.equal(
      writeResult.status,
      0,
      writeResult.stderr || writeResult.stdout,
    );

    const tracked = readFileSync(path.join(root, 'docs/tracked.md'), 'utf8');
    const untracked = readFileSync(
      path.join(root, 'docs/untracked.md'),
      'utf8',
    );
    const ignored = readFileSync(path.join(root, 'ignored.md'), 'utf8');

    assert.match(tracked, /## Table des matières/);
    assert.match(tracked, /- \[Guide\]\(#guide\)/);
    assert.match(tracked, /  - \[Même section\]\(#meme-section\)/);
    assert.match(
      tracked,
      /  - \[\[TASK\]\[DOCS\] Section balisée\]\(#taskdocs-section-balisee\)/,
    );
    assert.match(tracked, /  - \[Même section\]\(#meme-section-1\)/);
    assert.match(untracked, /## Table des matières/);
    assert.doesNotMatch(ignored, /## Table des matières/);

    const checkResult = runScript(root, ['--check']);

    assert.equal(
      checkResult.status,
      0,
      checkResult.stderr || checkResult.stdout,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('Given a stale Markdown ToC, When check mode runs, Then it fails without rewriting the file', () => {
  const root = createFixtureRepository();

  try {
    const writeResult = runScript(root, ['--write']);

    assert.equal(
      writeResult.status,
      0,
      writeResult.stderr || writeResult.stdout,
    );

    writeMarkdown(
      root,
      'docs/tracked.md',
      `
# Guide

## Nouvelle section
`,
    );

    const checkResult = runScript(root, ['--check']);
    const tracked = readFileSync(path.join(root, 'docs/tracked.md'), 'utf8');

    assert.equal(checkResult.status, 1);
    assert.match(
      checkResult.stderr,
      /docs\/tracked\.md is missing or has a stale table of contents/,
    );
    assert.doesNotMatch(tracked, /## Table des matières/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
