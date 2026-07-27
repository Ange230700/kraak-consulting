#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const TOC_HEADING = 'Table des matières';
const TOC_SLUGS = new Set(['table-des-matieres', 'table-of-contents', 'toc']);

function normalizePath(filePath) {
  return filePath.split(path.sep).join('/');
}

function parseNulList(output) {
  return output.toString('utf8').split('\0').filter(Boolean);
}

function gitList(root, args) {
  return parseNulList(
    execFileSync('git', args, {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
    }),
  );
}

function listMarkdownFiles(root) {
  const tracked = gitList(root, ['ls-files', '-z', '--', '*.md']);
  const untracked = gitList(root, [
    'ls-files',
    '-z',
    '--others',
    '--exclude-standard',
    '--',
    '*.md',
  ]);

  return [...new Set([...tracked, ...untracked])]
    .map((file) => normalizePath(file))
    .sort((left, right) => left.localeCompare(right, 'fr'));
}

function splitContent(content) {
  const hasBom = content.startsWith('\uFEFF');
  const body = hasBom ? content.slice(1) : content;
  const eol = body.includes('\r\n') ? '\r\n' : '\n';

  return {
    body: body.replace(/\r\n/g, '\n'),
    eol,
    hasBom,
  };
}

function joinContent(lines, eol, hasBom) {
  return `${hasBom ? '\uFEFF' : ''}${lines.join('\n').replace(/\n/g, eol)}`;
}

function stripHtmlTags(value) {
  let result = '';
  let insideTag = false;

  for (const character of value) {
    if (character === '<') {
      insideTag = true;
      continue;
    }

    if (insideTag) {
      if (character === '>') {
        insideTag = false;
      }

      continue;
    }

    result += character;
  }

  return result;
}

function stripMarkdown(value) {
  return stripHtmlTags(value)
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\\([\\`*{}\[\]()#+\-.!_>])/g, '$1')
    .replaceAll('**', '')
    .replaceAll('__', '')
    .replaceAll('*', '')
    .replaceAll('_', '')
    .replaceAll('`', '')
    .replaceAll('~', '')
    .trim();
}

function slug(text) {
  return (
    text
      .trim()
      .toLowerCase()
      .replace(/<[^>]+>/g, '')
      .replace(/[`*_~]/g, '')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-') || 'section'
  );
}

function uniqueSlug(baseSlug, usedSlugs) {
  if (!usedSlugs.has(baseSlug)) {
    usedSlugs.add(baseSlug);
    return baseSlug;
  }

  let index = 1;
  let candidate = `${baseSlug}-${index}`;

  while (usedSlugs.has(candidate)) {
    index += 1;
    candidate = `${baseSlug}-${index}`;
  }

  usedSlugs.add(candidate);
  return candidate;
}

function fenceUpdate(line, fence) {
  const fenceMatch = line.match(/^\s*(```+|~~~+)/);

  if (!fenceMatch) {
    return fence;
  }

  const marker = fenceMatch[1];

  if (!fence) {
    return { char: marker[0], length: marker.length };
  }

  if (marker[0] === fence.char && marker.length >= fence.length) {
    return null;
  }

  return fence;
}

function headingFromLine(line) {
  const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);

  if (!heading) {
    return undefined;
  }

  return {
    level: heading[1].length,
    rawText: heading[2].trim(),
    text: stripMarkdown(heading[2]) || heading[2].trim(),
  };
}

function extractHeadings(lines) {
  const headings = [];
  let fence = null;

  for (const line of lines) {
    const nextFence = fenceUpdate(line, fence);

    if (nextFence !== fence) {
      fence = nextFence;
      continue;
    }

    if (fence) {
      continue;
    }

    const heading = headingFromLine(line);

    if (heading) {
      headings.push(heading);
    }
  }

  const usedSlugs = new Set();

  return headings.map((heading) => ({
    ...heading,
    slug: uniqueSlug(slug(heading.rawText), usedSlugs),
  }));
}

function isTocHeading(line) {
  const heading = headingFromLine(line);

  return Boolean(heading && TOC_SLUGS.has(slug(heading.rawText)));
}

function isTocListLine(line) {
  return /^\s*[-*+]\s+.*\]\(#[^)]+\)\s*$/.test(line);
}

function removeExistingToc(lines) {
  let fence = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const nextFence = fenceUpdate(line, fence);

    if (nextFence !== fence) {
      fence = nextFence;
      continue;
    }

    if (fence || !isTocHeading(line)) {
      continue;
    }

    let end = index + 1;

    while (end < lines.length) {
      const candidate = lines[end];

      if (candidate.trim() === '' || isTocListLine(candidate)) {
        end += 1;
        continue;
      }

      break;
    }

    return [...lines.slice(0, index), ...lines.slice(end)];
  }

  return lines;
}

function findInsertionIndex(lines) {
  let fence = null;
  let frontmatterEnd = 0;

  if (lines[0] === '---') {
    const end = lines.findIndex((line, index) => index > 0 && line === '---');

    if (end !== -1) {
      frontmatterEnd = end + 1;
    }
  }

  for (let index = frontmatterEnd; index < lines.length; index += 1) {
    const line = lines[index];
    const nextFence = fenceUpdate(line, fence);

    if (nextFence !== fence) {
      fence = nextFence;
      continue;
    }

    if (fence) {
      continue;
    }

    const heading = headingFromLine(line);

    if (heading?.level === 1) {
      let insertionIndex = index + 1;

      while (
        insertionIndex < lines.length &&
        lines[insertionIndex].trim() === ''
      ) {
        insertionIndex += 1;
      }

      if (
        /^<!-- Generated by .* -->$/.test(lines[insertionIndex]?.trim() ?? '')
      ) {
        insertionIndex += 1;

        while (
          insertionIndex < lines.length &&
          lines[insertionIndex].trim() === ''
        ) {
          insertionIndex += 1;
        }
      }

      return insertionIndex;
    }
  }

  return frontmatterEnd;
}

function renderTocLines(headings) {
  const minimumLevel = Math.min(...headings.map((heading) => heading.level));

  return [
    `## ${TOC_HEADING}`,
    '',
    ...headings.map((heading) => {
      const indent = '  '.repeat(Math.max(0, heading.level - minimumLevel));

      return `${indent}- [${heading.text}](#${heading.slug})`;
    }),
  ];
}

function insertToc(lines, tocLines) {
  const insertionIndex = findInsertionIndex(lines);
  const before = lines.slice(0, insertionIndex);
  const after = lines.slice(insertionIndex);

  while (before.at(-1)?.trim() === '') {
    before.pop();
  }

  while (after[0]?.trim() === '') {
    after.shift();
  }

  const output = [...before, '', ...tocLines];

  if (after.length > 0) {
    output.push('', ...after);
  }

  return output;
}

export function renderMarkdownWithToc(content) {
  const { body, eol, hasBom } = splitContent(content);
  const hadFinalNewline = body.endsWith('\n');
  const lines = body.replace(/\n$/, '').split('\n');
  const linesWithoutToc = removeExistingToc(lines);
  const headings = extractHeadings(linesWithoutToc).filter(
    (heading) => !TOC_SLUGS.has(slug(heading.rawText)),
  );

  if (headings.length === 0) {
    return content;
  }

  const nextLines = insertToc(linesWithoutToc, renderTocLines(headings));
  const nextBody = joinContent(nextLines, eol, hasBom);

  return hadFinalNewline ? `${nextBody}${eol}` : nextBody;
}

export function buildMarkdownTocUpdates(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const updates = [];
  const files = listMarkdownFiles(root);

  for (const relativeFile of files) {
    const absoluteFile = path.join(root, relativeFile);

    if (!existsSync(absoluteFile) || !statSync(absoluteFile).isFile()) {
      continue;
    }

    const current = readFileSync(absoluteFile, 'utf8');
    const next = renderMarkdownWithToc(current);

    if (current !== next) {
      updates.push({ absoluteFile, next, relativeFile });
    }
  }

  return { files, updates };
}

function usage() {
  return `Usage:
  node scripts/generate-markdown-tocs.mjs --check
  node scripts/generate-markdown-tocs.mjs --write

Options:
  --check   fail when Markdown tables of contents are missing or stale
  --write   add or update Markdown tables of contents
`;
}

function parseArgs(args) {
  const check = args.includes('--check');
  const write = args.includes('--write');
  const help = args.includes('--help') || args.includes('-h');
  const unknown = args.filter(
    (arg) => !['--check', '--write', '--help', '-h'].includes(arg),
  );

  if (help) {
    return { mode: 'help' };
  }

  if (unknown.length > 0) {
    return { error: `Unknown option: ${unknown.join(', ')}` };
  }

  if (check === write) {
    return { error: 'Choose exactly one mode: --check or --write.' };
  }

  return { mode: check ? 'check' : 'write' };
}

export function writeMarkdownTocUpdates(updates) {
  for (const update of updates) {
    mkdirSync(path.dirname(update.absoluteFile), { recursive: true });
    writeFileSync(update.absoluteFile, update.next, 'utf8');
    console.log(`Wrote ${update.relativeFile}`);
  }
}

export function runCli(args = process.argv.slice(2), root = process.cwd()) {
  const parsed = parseArgs(args);

  if (parsed.mode === 'help') {
    console.log(usage());
    return 0;
  }

  if (parsed.error) {
    console.error(parsed.error);
    console.error(usage());
    return 2;
  }

  let result;

  try {
    result = buildMarkdownTocUpdates(root);
  } catch (error) {
    console.error(
      `Unable to inspect Markdown files through Git: ${error.message}`,
    );
    return 2;
  }

  if (parsed.mode === 'write') {
    writeMarkdownTocUpdates(result.updates);
    console.log(
      `Markdown ToCs are up to date for ${result.files.length} non-ignored files.`,
    );
    return 0;
  }

  if (result.updates.length === 0) {
    console.log(
      `Markdown ToCs are up to date for ${result.files.length} non-ignored files.`,
    );
    return 0;
  }

  for (const update of result.updates) {
    console.error(
      `${update.relativeFile} is missing or has a stale table of contents.`,
    );
  }

  console.error('Run `pnpm docs:toc:write` to update Markdown ToCs.');
  return 1;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = runCli();
}
