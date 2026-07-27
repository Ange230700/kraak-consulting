import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
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
const scriptPath = path.join(repoRoot, 'scripts', 'audit-docs.sh');
const bashCommand = resolveBashCommand();

function resolveBashCommand() {
  if (process.env.KRAAK_BASH_PATH) {
    return process.env.KRAAK_BASH_PATH;
  }

  if (process.platform !== 'win32') {
    return 'bash';
  }

  const candidates = [
    'C:\\Program Files\\Git\\bin\\bash.exe',
    'C:\\Program Files\\Git\\usr\\bin\\bash.exe',
    'C:\\Program Files (x86)\\Git\\bin\\bash.exe',
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? 'bash';
}

function writeMarkdown(root, file, content) {
  const target = path.join(root, file);

  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(
    target,
    content.trimStart().replace(/\n/g, '\n') + '\n',
    'utf8',
  );
}

function createFixtureRepository() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'kraak-docs-audit-'));

  mkdirSync(path.join(root, 'docs'), { recursive: true });

  return root;
}

function runCommand(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: options.cwd ?? repoRoot,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 20,
    timeout: options.timeout ?? 60_000,
  });
}

function runScript(root, args = []) {
  return runCommand(bashCommand, [scriptPath, ...args], {
    cwd: root,
    timeout: 90_000,
  });
}

function readAnalysis(root, outputDirectory) {
  return JSON.parse(
    readFileSync(path.join(root, outputDirectory, 'analysis.json'), 'utf8'),
  );
}

test('Given the documentation audit script, When Bash checks syntax, Then the script is valid', () => {
  const result = runCommand(bashCommand, ['-n', scriptPath]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test('Given blocking documentation findings, When strict audit runs, Then only blocking categories fail the run', () => {
  const root = createFixtureRepository();
  const outputDirectory = '.reports/docs-audit';
  const mergeMarker = `${'<'.repeat(7)} HEAD`;

  try {
    writeMarkdown(
      root,
      'docs/active.md',
      `
# Missing metadata

[Broken anchor](#missing-anchor)

${mergeMarker}

\`\`\`mermaid
notADiagram
\`\`\`

Legacy Vercel reference.
`,
    );
    writeMarkdown(
      root,
      'docs/decisions/ARC-01-first.md',
      `
---
status: active
owner: platform
last_reviewed: 2026-07-23
source_of_truth: true
---

# ARC-01 - First
`,
    );
    writeMarkdown(
      root,
      'docs/decisions/ARC-01-duplicate.md',
      `
---
status: active
owner: platform
last_reviewed: 2026-07-23
source_of_truth: true
---

# ARC-01 - Duplicate
`,
    );

    const result = runScript(root, [
      '--output',
      outputDirectory,
      '--fail-on-findings',
    ]);
    const analysis = readAnalysis(root, outputDirectory);

    assert.equal(result.status, 3, result.stderr || result.stdout);
    assert.equal(analysis.counts.blocking, 6);
    assert.equal(analysis.categories['missing-required-metadata'], 1);
    assert.equal(analysis.categories['broken-local-anchor'], 1);
    assert.equal(analysis.categories['merge-conflict-marker'], 1);
    assert.equal(analysis.categories['invalid-mermaid'], 1);
    assert.equal(analysis.categories['retired-provider-reference'], 1);
    assert.equal(analysis.categories['duplicate-adr-number'], 1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('Given warning-only documentation findings, When strict audit runs, Then warnings do not fail initially', () => {
  const root = createFixtureRepository();
  const outputDirectory = '.reports/docs-audit';

  try {
    writeMarkdown(
      root,
      'docs/first.md',
      `
---
status: active
owner: platform
last_reviewed: 2026-07-23
source_of_truth: true
---

# Shared

Identical prose.
`,
    );
    writeMarkdown(
      root,
      'docs/second.md',
      `
---
status: active
owner: platform
last_reviewed: 2026-07-23
source_of_truth: true
---

# Shared

Identical prose.
`,
    );

    const result = runScript(root, [
      '--output',
      outputDirectory,
      '--fail-on-findings',
    ]);
    const analysis = readAnalysis(root, outputDirectory);

    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.equal(analysis.counts.blocking, 0);
    assert.equal(analysis.categories['duplicate-content'], 1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('Given a source-file line anchor, When strict audit runs, Then the existing source path is accepted', () => {
  const root = createFixtureRepository();
  const outputDirectory = '.reports/docs-audit';

  try {
    writeMarkdown(
      root,
      'docs/README.md',
      `
---
status: active
owner: platform
last_reviewed: 2026-07-23
source_of_truth: true
---

# Fixture

[Source line](../src/example.ts#L1)
`,
    );
    writeMarkdown(
      root,
      'src/example.ts',
      `
export const fixture = true;
`,
    );

    const result = runScript(root, [
      '--output',
      outputDirectory,
      '--fail-on-findings',
    ]);
    const analysis = readAnalysis(root, outputDirectory);

    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.equal(analysis.counts.blocking, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('Given duplicate Markdown headings, When strict audit runs, Then suffixed local anchors are accepted', () => {
  const root = createFixtureRepository();
  const outputDirectory = '.reports/docs-audit';

  try {
    writeMarkdown(
      root,
      'docs/README.md',
      `
---
status: active
owner: platform
last_reviewed: 2026-07-23
source_of_truth: true
---

# Fixture

[Second section](#section-1)

## Section

First.

## Section

Second.
`,
    );

    const result = runScript(root, [
      '--output',
      outputDirectory,
      '--fail-on-findings',
    ]);
    const analysis = readAnalysis(root, outputDirectory);

    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.equal(analysis.counts.blocking, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
