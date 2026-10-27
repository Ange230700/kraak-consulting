import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import process from 'node:process';

const gitExecutableCandidates = {
  win32: [
    String.raw`C:\Program Files\Git\cmd\git.exe`,
    String.raw`C:\Program Files\Git\bin\git.exe`,
  ],
  fallback: ['/usr/bin/git', '/usr/local/bin/git', '/opt/homebrew/bin/git'],
};

function getPlatformGitCandidates(platform) {
  return platform === 'win32'
    ? gitExecutableCandidates.win32
    : gitExecutableCandidates.fallback;
}

function resolveGitExecutable({
  environment = process.env,
  errorPrefix = '[git]',
  fileExists = existsSync,
  platform = process.platform,
} = {}) {
  const candidates = [];

  if (environment.GIT_EXECUTABLE) {
    candidates.push(environment.GIT_EXECUTABLE);
  }

  candidates.push(...getPlatformGitCandidates(platform));

  for (const candidate of candidates) {
    if (fileExists(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `${errorPrefix} Exécutable git introuvable. Définissez GIT_EXECUTABLE avec un chemin absolu fiable.`,
  );
}

function runGit(args, options = {}) {
  if (options.gitRunner) {
    return options.gitRunner(args);
  }

  const gitExecutable =
    options.gitExecutable ??
    resolveGitExecutable({
      errorPrefix: options.errorPrefix,
    });

  return spawnSync(gitExecutable, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function getGitOutput(args, options = {}) {
  const result = runGit(args, options);

  if (result.status !== 0) {
    return '';
  }

  return result.stdout.trim();
}

function refExists(ref, options = {}) {
  const result = runGit(
    ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`],
    options,
  );

  return result.status === 0;
}

function resolveBaseRef(options = {}) {
  const upstream = getGitOutput(
    ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}'],
    options,
  );

  if (upstream && refExists(upstream, options)) {
    return upstream;
  }

  const candidates = [
    'origin/staging',
    'origin/main',
    'staging',
    'main',
    'HEAD~1',
  ];

  for (const candidate of candidates) {
    if (refExists(candidate, options)) {
      return candidate;
    }
  }

  return 'HEAD~1';
}

function getChangedFiles(baseRef, options = {}) {
  const result = runGit(
    ['diff', '--name-only', '--diff-filter=ACMRTUXB', `${baseRef}...HEAD`],
    options,
  );

  if (result.status !== 0) {
    const writeWarning = options.writeWarning ?? console.warn;
    writeWarning(
      options.warningMessage ??
        '[git] Impossible de détecter finement les changements.',
    );
    return [];
  }

  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export {
  getChangedFiles,
  getGitOutput,
  refExists,
  resolveBaseRef,
  resolveGitExecutable,
  runGit,
};
