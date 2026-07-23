import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
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

function runCommand(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: options.cwd ?? repoRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      NO_COLOR: '1',
      ...options.env,
    },
    maxBuffer: 1024 * 1024 * 100,
    timeout: options.timeout ?? 90_000,
  });
}

function runScript(root, args = []) {
  return runCommand(
    bashCommand,
    [path.join(root, 'scripts', 'audit-docs.sh'), ...args],
    {
      cwd: root,
      timeout: 120_000,
    },
  );
}

function createFixtureRepository() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'kraak-docs-audit-'));
  const scriptsDirectory = path.join(root, 'scripts');
  const docsDirectory = path.join(root, 'docs');

  mkdirSync(scriptsDirectory, { recursive: true });
  mkdirSync(docsDirectory, { recursive: true });
  cpSync(scriptPath, path.join(scriptsDirectory, 'audit-docs.sh'));
  chmodSync(path.join(scriptsDirectory, 'audit-docs.sh'), 0o755);

  assert.equal(
    runCommand('git', ['init', '-b', 'staging'], { cwd: root }).status,
    0,
  );
  assert.equal(
    runCommand('git', ['config', 'user.name', 'KRAAK Test'], { cwd: root })
      .status,
    0,
  );
  assert.equal(
    runCommand('git', ['config', 'user.email', 'test@example.com'], {
      cwd: root,
    }).status,
    0,
  );

  return { docsDirectory, root };
}

function commitAll(root, date = '2026-01-01T00:00:00Z') {
  assert.equal(runCommand('git', ['add', '.'], { cwd: root }).status, 0);
  const result = runCommand('git', ['commit', '-m', 'fixture docs'], {
    cwd: root,
    env: {
      GIT_AUTHOR_DATE: date,
      GIT_COMMITTER_DATE: date,
    },
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
}

function readAnalysis(root, outputDirectory) {
  return JSON.parse(
    readFileSync(path.join(root, outputDirectory, 'analysis.json'), 'utf8'),
  );
}

function readFiles(root, outputDirectory) {
  return JSON.parse(
    readFileSync(path.join(root, outputDirectory, 'files.json'), 'utf8'),
  );
}

function findingMessages(analysis, category) {
  return analysis.findings
    .filter((finding) => finding.category === category)
    .map((finding) => `${finding.file}:${finding.line}:${finding.details}`);
}

test('Given the documentation audit script, When Bash checks syntax, Then the script is valid', () => {
  const result = runCommand(bashCommand, ['-n', scriptPath]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test('Given valid enum values and placeholders, When the audit runs, Then false positives are not reported', () => {
  const { docsDirectory, root } = createFixtureRepository();
  const outputDirectory = '.reports/audit';

  writeFileSync(
    path.join(docsDirectory, 'README.md'),
    `# Fixture

This active document shows supported values without declaring its status.

- status = draft
- Status = Todo
- legacy alias
- [TASK][ID]
- [EPIC][ID]
- [DEP-*]

\`Status = Todo\`

\`\`\`text
status = draft
Status = Todo
legacy alias
\`\`\`

Status: Draft
This document is obsolete.
TODO: complete this section.
`,
    'utf8',
  );
  commitAll(root);

  try {
    const result = runScript(root, ['--output', outputDirectory]);

    assert.equal(result.status, 0, result.stderr || result.stdout);

    const analysis = readAnalysis(root, outputDirectory);
    const unfinishedMarkers = findingMessages(analysis, 'unfinished-marker');

    assert.equal(analysis.categories['undefined-reference-link'] ?? 0, 0);
    assert.equal(unfinishedMarkers.length, 3);
    assert.deepEqual(unfinishedMarkers, [
      'docs/README.md:20:Status: Draft',
      'docs/README.md:21:This document is obsolete.',
      'docs/README.md:22:TODO: complete this section.',
    ]);
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
});

test('Given tiny duplicated evidence artifacts, When the audit runs, Then duplicate content is ignored', () => {
  const { docsDirectory, root } = createFixtureRepository();
  const evidenceDirectory = path.join(docsDirectory, 'runbooks', 'evidence');
  const outputDirectory = '.reports/audit';

  mkdirSync(evidenceDirectory, { recursive: true });
  writeFileSync(path.join(docsDirectory, 'README.md'), '# Fixture\n', 'utf8');
  writeFileSync(path.join(evidenceDirectory, 'first.exitcode'), '0\n', 'utf8');
  writeFileSync(path.join(evidenceDirectory, 'second.exitcode'), '0\n', 'utf8');
  commitAll(root);

  try {
    const result = runScript(root, ['--output', outputDirectory]);

    assert.equal(result.status, 0, result.stderr || result.stdout);

    const analysis = readAnalysis(root, outputDirectory);

    assert.equal(analysis.categories['duplicate-content'] ?? 0, 0);
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
});

test('Given Git history differs from mtime, When stale age is computed, Then commit time is used', () => {
  const { docsDirectory, root } = createFixtureRepository();
  const outputDirectory = '.reports/audit';
  const guidePath = path.join(docsDirectory, 'README.md');

  writeFileSync(guidePath, '# Fixture\n', 'utf8');
  commitAll(root, '2020-01-01T00:00:00Z');
  const now = new Date();
  utimesSync(guidePath, now, now);

  try {
    const result = runScript(root, [
      '--output',
      outputDirectory,
      '--stale-days',
      '30',
    ]);

    assert.equal(result.status, 0, result.stderr || result.stdout);

    const analysis = readAnalysis(root, outputDirectory);
    const files = readFiles(root, outputDirectory);
    const record = files.find((file) => file.file === 'docs/README.md');

    assert.ok(record.ageDays > 30);
    assert.equal(analysis.categories['old-file-git-history'] ?? 0, 1);
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
});

test('Given HEAD fallback and restricted external links, When network audit runs, Then only genuinely failed URLs fail', async () => {
  const { docsDirectory, root } = createFixtureRepository();
  const outputDirectory = '.reports/audit';
  const serverPath = path.join(root, 'server.mjs');

  writeFileSync(
    serverPath,
    `import { createServer } from 'node:http';

const requests = new Map();
const server = createServer((request, response) => {
  const count = requests.get(request.url) ?? 0;
  requests.set(request.url, count + 1);

  if (request.url === '/head-unsupported' && request.method === 'HEAD') {
    response.writeHead(405).end();
    return;
  }

  if (request.url === '/restricted') {
    response.writeHead(403).end();
    return;
  }

  if (request.url === '/transient') {
    response.writeHead(count === 0 ? 500 : 200).end();
    return;
  }

  response.writeHead(200).end('ok');
});

server.listen(0, '127.0.0.1', () => {
  console.log(server.address().port);
});
`,
    'utf8',
  );

  const server = spawn(process.execPath, [serverPath], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  const port = await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Timed out waiting for fixture server.')),
      10_000,
    );

    server.stdout.once('data', (chunk) => {
      clearTimeout(timer);
      resolve(String(chunk).trim());
    });
    server.once('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`Fixture server exited early with status ${code}.`));
    });
  });

  writeFileSync(
    path.join(docsDirectory, 'README.md'),
    `# Fixture

- [Fallback](http://127.0.0.1:${port}/head-unsupported)
- [Fallback duplicate](http://127.0.0.1:${port}/head-unsupported)
- [Restricted](http://127.0.0.1:${port}/restricted)
- [Transient](http://127.0.0.1:${port}/transient)
`,
    'utf8',
  );
  commitAll(root);

  try {
    const result = runScript(root, ['--network', '--output', outputDirectory]);

    assert.equal(result.status, 0, result.stderr || result.stdout);

    const rows = readFileSync(
      path.join(root, outputDirectory, 'raw', 'external-link-results.tsv'),
      'utf8',
    )
      .trim()
      .split(/\r?\n/)
      .slice(1);

    assert.deepEqual(rows.sort(), [
      `http://127.0.0.1:${port}/head-unsupported\t200\tok`,
      `http://127.0.0.1:${port}/restricted\t403\trestricted`,
      `http://127.0.0.1:${port}/transient\t200\tok`,
    ]);
  } finally {
    await new Promise((resolve) => {
      server.once('exit', resolve);
      server.kill();
    });
    rmSync(root, { force: true, recursive: true });
  }
});
