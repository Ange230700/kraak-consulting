#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

function runGit(args) {
  const result = spawnSync('git', args, {
    encoding: 'utf8',
    shell: false,
  });

  if (result.status !== 0) {
    throw new Error(
      (result.stderr || result.stdout || `git ${args.join(' ')} failed`).trim(),
    );
  }

  return result.stdout.trim();
}

function isAncestor(ancestorRef, descendantRef) {
  const result = spawnSync(
    'git',
    ['merge-base', '--is-ancestor', ancestorRef, descendantRef],
    {
      encoding: 'utf8',
      shell: false,
    },
  );

  if (result.status === 0) {
    return true;
  }

  if (result.status === 1) {
    return false;
  }

  throw new Error(
    (
      result.stderr ||
      `Impossible de comparer ${ancestorRef} et ${descendantRef}.`
    ).trim(),
  );
}

function getCommitSummary(ref) {
  return runGit(['show', '-s', '--format=%H%x09%cI%x09%s', ref]);
}

function parseArguments(args) {
  let requireMainAncestor = false;
  const refs = [];

  for (const arg of args) {
    if (arg === '--require-main-ancestor') {
      requireMainAncestor = true;
    } else if (arg.startsWith('--')) {
      throw new Error(`Option inconnue : ${arg}`);
    } else {
      refs.push(arg);
    }
  }

  if (refs.length > 2) {
    throw new Error(
      'Usage : node scripts/github/check-branch-lineage.mjs [--require-main-ancestor] [<ref-staging> <ref-main>]',
    );
  }

  return {
    requireMainAncestor,
    stagingRef: refs[0] ?? 'origin/staging',
    mainRef: refs[1] ?? 'origin/main',
  };
}

function main() {
  const { mainRef, requireMainAncestor, stagingRef } = parseArguments(
    process.argv.slice(2),
  );
  const mergeBase = runGit(['merge-base', stagingRef, mainRef]);
  const [stagingAhead, mainAhead] = runGit([
    'rev-list',
    '--left-right',
    '--count',
    `${stagingRef}...${mainRef}`,
  ])
    .split(/\s+/)
    .map(Number);
  const mainIsAncestor = isAncestor(mainRef, stagingRef);

  console.log(`[branch-lineage] staging : ${getCommitSummary(stagingRef)}`);
  console.log(`[branch-lineage] main    : ${getCommitSummary(mainRef)}`);
  console.log(`[branch-lineage] base commune : ${mergeBase}`);
  console.log(
    `[branch-lineage] staging en avance de ${stagingAhead} commit(s) ; main en avance de ${mainAhead} commit(s).`,
  );

  if (mainIsAncestor) {
    console.log('[branch-lineage] main est un ancêtre de staging.');
    return;
  }

  console.log(
    '[branch-lineage] main n’est pas un ancêtre de staging ; une promotion automatique n’est pas sûre.',
  );

  if (requireMainAncestor) {
    process.exitCode = 1;
  }
}

try {
  main();
} catch (error) {
  console.error(
    '[branch-lineage] Échec du contrôle :',
    error instanceof Error ? error.message : String(error),
  );
  process.exitCode = 2;
}
