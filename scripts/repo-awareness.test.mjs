import assert from 'node:assert/strict';
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const repoRoot = process.cwd();
const scriptPath = path.join(repoRoot, 'scripts', 'repo-awareness.sh');
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

function toBashPath(filePath) {
  if (process.platform !== 'win32') {
    return filePath;
  }

  return filePath
    .replace(/^([A-Za-z]):/, (_, drive) => `/${drive.toLowerCase()}`)
    .replace(/\\/g, '/');
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

function runScript(args = [], options = {}) {
  const targetScript = options.scriptPath ?? scriptPath;

  return runCommand(bashCommand, [targetScript, ...args], options);
}

function writeExecutableScript(filePath, content) {
  writeFileSync(filePath, content);
  chmodSync(filePath, 0o755);
}

function createFixtureRepository() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'kraak-repo-awareness-'));
  const scriptsDirectory = path.join(root, 'scripts');
  const docsDirectory = path.join(root, 'docs');
  const binDirectory = path.join(root, 'bin');
  const envSecretValue = 'super-secret-fixture-value';
  const fixtureScriptPath = path.join(scriptsDirectory, 'repo-awareness.sh');

  mkdirSync(scriptsDirectory, { recursive: true });
  mkdirSync(docsDirectory, { recursive: true });
  mkdirSync(binDirectory, { recursive: true });
  cpSync(scriptPath, fixtureScriptPath);
  writeExecutableScript(
    path.join(binDirectory, 'git'),
    `#!/usr/bin/env sh
case "$1" in
  --version)
    printf 'git version fixture\\n'
    ;;
  rev-parse)
    if [ "$2" = "--show-toplevel" ]; then
      pwd
    elif [ "$2" = "--short" ]; then
      printf 'abc123\\n'
    fi
    ;;
  branch)
    if [ "$2" = "--show-current" ]; then
      printf 'staging\\n'
    elif [ "$2" = "-vv" ]; then
      printf '* staging abc123 test fixture\\n'
    fi
    ;;
  status)
    if [ "$2" = "--short" ]; then
      printf '## staging\\n'
    fi
    ;;
  worktree)
    pwd
    ;;
  log|diff|remote|submodule|stash|tag|rev-list)
    ;;
  show-ref)
    exit 1
    ;;
  ls-files)
    case " $* " in
      *" --others "*|*" --modified "*|*" --deleted "*)
        ;;
      *" -z "*)
        printf '.env.example\\0.gitignore\\0README.md\\0docs/provider.md\\0package.json\\0scripts/repo-awareness.sh\\0'
        ;;
      *)
        printf '.env.example\\n.gitignore\\nREADME.md\\ndocs/provider.md\\npackage.json\\nscripts/repo-awareness.sh\\n'
        ;;
    esac
    ;;
  grep)
    printf 'docs/provider.md:1:Legacy provider mention: Vercel.\\n'
    ;;
esac
`,
  );
  writeExecutableScript(
    path.join(binDirectory, 'pnpm'),
    '#!/usr/bin/env sh\nprintf "pnpm fixture %s\\n" "$*"\n',
  );
  writeExecutableScript(
    path.join(binDirectory, 'rg'),
    '#!/usr/bin/env sh\nif [ "$1" = "--version" ]; then printf "ripgrep fixture\\n"; fi\n',
  );
  writeExecutableScript(
    path.join(binDirectory, 'gh'),
    '#!/usr/bin/env sh\nif [ "$1" = "--version" ]; then printf "gh fixture\\n"; fi\n',
  );
  writeFileSync(path.join(root, '.gitignore'), '.reports/\n');
  writeFileSync(path.join(root, 'README.md'), '# Fixture\n');
  writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({ name: 'fixture', private: true, scripts: {} }, null, 2),
  );
  writeFileSync(
    path.join(root, '.env.example'),
    `FIXTURE_SECRET=${envSecretValue}\n`,
  );
  writeFileSync(
    path.join(docsDirectory, 'provider.md'),
    'Legacy provider mention: Vercel.\n',
  );

  assert.equal(
    runCommand('git', ['init', '-b', 'staging'], { cwd: root }).status,
    0,
  );
  assert.equal(runCommand('git', ['add', '.'], { cwd: root }).status, 0);
  assert.equal(
    runCommand(
      'git',
      [
        '-c',
        'user.name=KRAAK Test',
        '-c',
        'user.email=test@example.com',
        'commit',
        '-m',
        'test fixture',
      ],
      { cwd: root },
    ).status,
    0,
  );

  return {
    binDirectory,
    envSecretValue,
    root,
    scriptPath: fixtureScriptPath,
  };
}

function getReportPath(output) {
  const match = output.match(/^Saved report:\s+(.+)$/m);

  assert.ok(
    match,
    'Expected the report output to include a saved report path.',
  );

  return match[1].trim();
}

function getSection(output, title) {
  const marker = `\n${title}\n`;
  const start = output.lastIndexOf(marker);

  assert.notEqual(start, -1, `Expected section "${title}" to be present.`);

  const nextSection = output.indexOf('\n\n', start + marker.length);

  return nextSection === -1
    ? output.slice(start)
    : output.slice(start, nextSection);
}

function createFixturePath(binDirectory) {
  return [
    toBashPath(binDirectory),
    toBashPath(path.dirname(bashCommand)),
    process.env.PATH,
  ].join(':');
}

test('Given the repository awareness script, When Bash checks syntax, Then the script is valid', () => {
  const result = runCommand(bashCommand, ['-n', scriptPath]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test('Given the repository awareness script, When help is requested, Then usage is printed without running the report', () => {
  const result = runScript(['--help']);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /KRAAK repository awareness report/);
  assert.match(result.stdout, /--output/);
  assert.doesNotMatch(result.stdout, /KRAAK REPOSITORY AWARENESS REPORT/);
});

test('Given default mode, When the report runs, Then generated output is ignored and sensitive values stay hidden', () => {
  const fixture = createFixtureRepository();
  const secretValue = 'repo-awareness-secret-value-should-not-print';

  try {
    const result = runScript([], {
      cwd: fixture.root,
      env: {
        KRAAK_REPO_AWARENESS_SECRET_TEST: secretValue,
        PATH: createFixturePath(fixture.binDirectory),
      },
      scriptPath: fixture.scriptPath,
    });

    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /Mode:\s+full=0 checks=0 network=0/);
    assert.doesNotMatch(result.stdout, new RegExp(secretValue));
    assert.doesNotMatch(result.stdout, new RegExp(fixture.envSecretValue));

    const reportPath = getReportPath(result.stdout);
    assert.match(
      reportPath,
      /^\.reports\/repo-awareness-\d{4}-\d{2}-\d{2}T\d{6}Z\.txt$/,
    );
    assert.equal(existsSync(path.join(fixture.root, reportPath)), true);

    const ignoreResult = runCommand('git', ['check-ignore', '-q', reportPath], {
      cwd: fixture.root,
    });
    assert.equal(
      ignoreResult.status,
      0,
      `${reportPath} should be ignored by git.`,
    );

    const providerSection = getSection(
      result.stdout,
      'Legacy hosting-provider residue',
    );
    assert.match(providerSection, /docs\/provider\.md:/);
    assert.doesNotMatch(providerSection, /scripts\/repo-awareness\.sh:/);
    assert.doesNotMatch(providerSection, /scripts\\repo-awareness\.sh:/);
  } finally {
    rmSync(fixture.root, { force: true, recursive: true });
  }
});
