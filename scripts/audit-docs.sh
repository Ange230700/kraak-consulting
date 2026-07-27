#!/usr/bin/env bash

set -uo pipefail

DOCS_DIR="docs"
OUTPUT_DIR=".reports/docs-audit"
FULL=0
NETWORK=0
FAIL_ON_FINDINGS=0
STALE_DAYS=180

usage() {
  cat <<'USAGE'
KRAAK documentation audit

Usage:
  bash scripts/audit-docs.sh [--full] [--network] [--fail-on-findings] [--output DIR]

Options:
  --docs DIR            Documentation root to audit. Defaults to docs.
  --output DIR          Report output directory. Defaults to .reports/docs-audit.
  --full                Include staleness and broader inventory reporting.
  --network             Check collected external HTTP(S) links.
  --fail-on-findings    Fail only on initial blocking documentation categories.
  --stale-days DAYS     Staleness threshold used with --full. Defaults to 180.
USAGE
  return 0
}

while (($# > 0)); do
  case "$1" in
    --docs)
      [[ $# -ge 2 ]] || { echo "ERROR: --docs requires a directory." >&2; exit 2; }
      DOCS_DIR="$2"
      shift 2
      ;;
    --output)
      [[ $# -ge 2 ]] || { echo "ERROR: --output requires a directory." >&2; exit 2; }
      OUTPUT_DIR="$2"
      shift 2
      ;;
    --full)
      FULL=1
      shift
      ;;
    --network)
      NETWORK=1
      shift
      ;;
    --fail-on-findings)
      FAIL_ON_FINDINGS=1
      shift
      ;;
    --stale-days)
      [[ $# -ge 2 && "$2" =~ ^[0-9]+$ ]] || {
        echo "ERROR: --stale-days requires a non-negative integer." >&2
        exit 2
      }
      STALE_DAYS="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "ERROR: unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

command -v node >/dev/null 2>&1 || {
  echo "ERROR: node is required for documentation audit." >&2
  exit 2
}

mkdir -p "$OUTPUT_DIR/raw"

node --input-type=module - "$PWD" "$DOCS_DIR" "$OUTPUT_DIR" "$FULL" "$NETWORK" "$STALE_DAYS" <<'NODE'
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const [rootArg, docsArg, outputArg, fullArg, networkArg, staleDaysArg] =
  process.argv.slice(2);
const root = path.resolve(rootArg);
const docsRoot = path.resolve(root, docsArg);
const outputRoot = path.resolve(root, outputArg);
const full = fullArg === '1';
const network = networkArg === '1';
const staleDays = Number(staleDaysArg);

const markdownExtensions = new Set(['.md', '.markdown', '.mdown', '.mmd']);
const linkMarkdownExtensions = new Set(['.md', '.markdown', '.mdown']);
const blockingCategories = new Set([
  'broken-cross-file-anchor',
  'broken-local-anchor',
  'broken-relative-link',
  'duplicate-adr-number',
  'invalid-mermaid',
  'merge-conflict-marker',
  'missing-required-metadata',
  'retired-provider-reference',
  'undefined-reference-link',
  'unclosed-code-fence',
]);
const activeMetadataPrefixes = [
  'docs/architecture/',
  'docs/decisions/',
  'docs/engineering/',
  'docs/operations/',
  'docs/planning/',
  'docs/product/',
];
const generatedMetadataExclusions = [
  'docs/generated/primeng/',
];
const mermaidStarts = [
  'flowchart',
  'graph',
  'sequenceDiagram',
  'classDiagram',
  'stateDiagram',
  'stateDiagram-v2',
  'erDiagram',
  'journey',
  'gantt',
  'pie',
  'mindmap',
  'timeline',
  'gitGraph',
  'quadrantChart',
  'requirementDiagram',
  'C4Context',
  'sankey-beta',
  'xychart-beta',
  'block-beta',
  'packet-beta',
];

const findings = [];
const files = [];
const headingsByFile = new Map();
const externalUrls = new Set();
const hashes = new Map();

function toRelative(filePath) {
  return path.relative(root, filePath).split(path.sep).join('/');
}

function addFinding(category, file, line, message, severity = 'warning', details = '') {
  findings.push({
    blocking: blockingCategories.has(category),
    category,
    details,
    file: file ? toRelative(file) : '',
    line: line ?? 0,
    message,
    severity: blockingCategories.has(category) ? 'error' : severity,
  });
}

function walk(directory) {
  const entries = fs.existsSync(directory)
    ? fs.readdirSync(directory, { withFileTypes: true })
    : [];
  const output = [];

  for (const entry of entries) {
    const absoluteEntry = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      output.push(...walk(absoluteEntry));
      continue;
    }

    if (entry.isFile()) {
      output.push(absoluteEntry);
    }
  }

  return output;
}

function parseFrontmatter(content) {
  if (!content.startsWith('---\n')) {
    return { body: content, metadata: {} };
  }

  const end = content.indexOf('\n---', 4);

  if (end === -1) {
    return { body: content, metadata: {} };
  }

  const metadata = {};

  for (const line of content.slice(4, end).split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);

    if (match) {
      metadata[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
    }
  }

  return {
    body: content.slice(content.indexOf('\n', end + 1) + 1),
    metadata,
  };
}

function slug(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[`*_~]/g, '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-') || 'section';
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

function stripInlineCode(line) {
  let output = '';
  let inCode = false;

  for (let index = 0; index < line.length; index += 1) {
    if (line[index] === '`') {
      inCode = !inCode;
      continue;
    }

    output += inCode ? ' ' : line[index];
  }

  return output;
}

function isGeneratedMetadataExcluded(relativeFile) {
  return generatedMetadataExclusions.some((prefix) =>
    relativeFile.startsWith(prefix),
  );
}

function requiresActiveMetadata(relativeFile, metadata) {
  if (isGeneratedMetadataExcluded(relativeFile)) {
    return false;
  }

  return (
    /^docs\/[^/]+\.md$/i.test(relativeFile) ||
    relativeFile === 'docs/README.md' ||
    relativeFile === 'docs/archive/README.md' ||
    activeMetadataPrefixes.some((prefix) => relativeFile.startsWith(prefix)) ||
    metadata.status === 'active'
  );
}

function validateRequiredMetadata(file, relativeFile, metadata) {
  if (!requiresActiveMetadata(relativeFile, metadata)) {
    return;
  }

  const missing = ['status', 'owner', 'last_reviewed', 'source_of_truth'].filter(
    (key) => !metadata[key],
  );

  if (missing.length > 0) {
    addFinding(
      'missing-required-metadata',
      file,
      1,
      'Required metadata is missing on an active documentation file.',
      'error',
      missing.join(', '),
    );
  }
}

function parseMarkdown(file, content) {
  const lines = content.split(/\r?\n/);
  const headings = [];
  const usedHeadingSlugs = new Set();
  const links = [];
  let fence = null;
  let mermaidStart = null;
  let mermaidLines = [];

  function closeMermaid(endLine) {
    if (!mermaidStart) {
      return;
    }

    validateMermaid(file, mermaidStart, mermaidLines.join('\n'));
    mermaidStart = null;
    mermaidLines = [];
  }

  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 1;
    const line = lines[index];
    const fenceMatch = line.match(/^\s*(```+|~~~+)\s*([A-Za-z0-9_-]+)?/);

    if (fenceMatch) {
      const marker = fenceMatch[1];
      const language = (fenceMatch[2] ?? '').toLowerCase();

      if (!fence) {
        fence = { char: marker[0], length: marker.length, line: lineNumber };

        if (language === 'mermaid') {
          mermaidStart = lineNumber;
          mermaidLines = [];
        }
      } else if (marker[0] === fence.char && marker.length >= fence.length) {
        closeMermaid(lineNumber);
        fence = null;
      }

      continue;
    }

    if (fence) {
      if (mermaidStart) {
        mermaidLines.push(line);
      }

      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);

    if (heading) {
      headings.push({
        line: lineNumber,
        slug: uniqueSlug(slug(heading[2]), usedHeadingSlugs),
        text: heading[2],
      });
    }

    const searchableLine = stripInlineCode(line);
    let match;
    const inlineLink = /!?\[([^\]]*)\]\(([^)]+)\)/g;

    while ((match = inlineLink.exec(searchableLine)) !== null) {
      const target = match[2].trim().replace(/^<|>$/g, '').split(/\s+["']/)[0];
      links.push({ line: lineNumber, target });
    }

    const bareUrl = /https?:\/\/[^\s<>"')\]]+/g;

    while ((match = bareUrl.exec(searchableLine)) !== null) {
      externalUrls.add(match[0].replace(/[.,;:]$/, ''));
    }
  }

  if (fence) {
    addFinding(
      'unclosed-code-fence',
      file,
      fence.line,
      'Unclosed fenced code block.',
      'error',
    );
  }

  headingsByFile.set(file, headings);

  return { headings, links };
}

function decodeTarget(target) {
  try {
    return decodeURIComponent(target);
  } catch {
    return target;
  }
}

function validateLinks(file, parsed) {
  const sourceDirectory = path.dirname(file);

  for (const link of parsed.links) {
    const target = link.target;

    if (!target || /^(https?:|mailto:|tel:|sms:|data:)/i.test(target)) {
      if (/^https?:/i.test(target)) {
        externalUrls.add(target);
      }

      continue;
    }

    if (target.startsWith('#')) {
      const anchor = slug(decodeTarget(target.slice(1)));
      const anchors = new Set((headingsByFile.get(file) ?? []).map((item) => item.slug));

      if (anchor && !anchors.has(anchor)) {
        addFinding(
          'broken-local-anchor',
          file,
          link.line,
          `Anchor not found: ${target}`,
          'error',
        );
      }

      continue;
    }

    const [targetPath, rawAnchor] = target.split('#', 2);
    const resolved = path.resolve(sourceDirectory, decodeTarget(targetPath.split('?')[0]));

    if (!fs.existsSync(resolved)) {
      addFinding(
        'broken-relative-link',
        file,
        link.line,
        `Referenced path does not exist: ${target}`,
        'error',
        toRelative(resolved),
      );
      continue;
    }

    if (
      rawAnchor &&
      fs.statSync(resolved).isFile() &&
      linkMarkdownExtensions.has(path.extname(resolved).toLowerCase())
    ) {
      if (!headingsByFile.has(resolved)) {
        const content = fs.readFileSync(resolved, 'utf8');
        parseMarkdown(resolved, content);
      }

      const anchors = new Set((headingsByFile.get(resolved) ?? []).map((item) => item.slug));
      const anchor = slug(decodeTarget(rawAnchor));

      if (anchor && !anchors.has(anchor)) {
        addFinding(
          'broken-cross-file-anchor',
          file,
          link.line,
          `Cross-file anchor not found: ${target}`,
          'error',
        );
      }
    }
  }
}

function validateRetiredProvider(file, relativeFile, content, metadata) {
  const activeLike =
    requiresActiveMetadata(relativeFile, metadata) && metadata.status !== 'historical';

  if (!activeLike) {
    return;
  }

  const lines = content.split(/\r?\n/);
  const providerPattern =
    /vercel|vercel\.app|VERCEL_|kraak-consulting-staging|kraak-consulting-git-staging/i;
  const index = lines.findIndex((line) => providerPattern.test(stripInlineCode(line)));

  if (index !== -1) {
    addFinding(
      'retired-provider-reference',
      file,
      index + 1,
      'Potential retired hosting-provider reference in active documentation.',
      'error',
      lines[index].trim(),
    );
  }
}

function validateMermaid(file, line, content) {
  const withoutFrontmatter = parseFrontmatter(content).body;
  const firstStatement = withoutFrontmatter
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter((item) => item && !item.startsWith('%%'))[0];

  if (!firstStatement) {
    addFinding('invalid-mermaid', file, line, 'Mermaid block is empty.', 'error');
    return;
  }

  const startsWithKnownDiagram = mermaidStarts.some(
    (keyword) =>
      firstStatement === keyword || firstStatement.startsWith(`${keyword} `),
  );

  if (!startsWithKnownDiagram) {
    addFinding(
      'invalid-mermaid',
      file,
      line,
      'Mermaid block does not start with a supported diagram declaration.',
      'error',
      firstStatement,
    );
  }
}

function validateMergeMarkers(file, content) {
  const lines = content.split(/\r?\n/);
  const index = lines.findIndex((line) => /^(<<<<<<<|=======|>>>>>>>)/.test(line));

  if (index !== -1) {
    addFinding(
      'merge-conflict-marker',
      file,
      index + 1,
      'Merge conflict marker detected.',
      'error',
    );
  }
}

function validateDuplicateAdrNumbers() {
  const decisionsRoot = path.join(docsRoot, 'decisions');

  if (!fs.existsSync(decisionsRoot)) {
    return;
  }

  const groups = new Map();

  for (const file of walk(decisionsRoot)) {
    const name = path.basename(file);
    const match = name.match(/^(ARC-\d{2})-.+\.md$/i);

    if (!match) {
      continue;
    }

    const key = match[1].toUpperCase();
    groups.set(key, [...(groups.get(key) ?? []), toRelative(file)]);
  }

  for (const [id, matches] of groups) {
    if (matches.length > 1) {
      addFinding(
        'duplicate-adr-number',
        decisionsRoot,
        0,
        `${id} is duplicated.`,
        'error',
        matches.join(', '),
      );
    }
  }
}

function hashTrackedContent(relativeFile, content) {
  if (relativeFile.startsWith('docs/generated/primeng/')) {
    return;
  }

  const hash = crypto.createHash('sha256').update(content).digest('hex');
  hashes.set(hash, [...(hashes.get(hash) ?? []), relativeFile]);
}

function validateDuplicateContent() {
  for (const matches of hashes.values()) {
    if (matches.length < 2) {
      continue;
    }

    addFinding(
      'duplicate-content',
      null,
      0,
      `Identical documentation content appears in ${matches.length} files.`,
      'warning',
      matches.join(', '),
    );
  }
}

function gitCommittedAt(relativeFile) {
  try {
    const output = execFileSync('git', ['log', '-1', '--format=%cI', '--', relativeFile], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();

    return output ? new Date(output) : null;
  } catch {
    return null;
  }
}

function validateStaleness(file, relativeFile) {
  if (!full || relativeFile.startsWith('docs/archive/')) {
    return;
  }

  const committedAt = gitCommittedAt(relativeFile);
  const basis = committedAt && !Number.isNaN(committedAt.getTime())
    ? committedAt.getTime()
    : fs.statSync(file).mtimeMs;
  const ageDays = Math.floor((Date.now() - basis) / 86400000);

  if (ageDays > staleDays) {
    addFinding(
      'stale-document',
      file,
      0,
      `Document has not changed for more than ${staleDays} days.`,
      'info',
      `${ageDays} days`,
    );
  }
}

async function checkExternalLinks() {
  const rows = ['url\tstatus\tresult'];

  if (!network) {
    fs.writeFileSync(path.join(outputRoot, 'raw', 'external-link-results.tsv'), `${rows.join('\n')}\n`);
    return;
  }

  for (const url of [...externalUrls].sort()) {
    let status = 0;
    let result = 'failed';

    try {
      let response = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: AbortSignal.timeout(15000),
      });

      if (response.status === 405) {
        response = await fetch(url, {
          method: 'GET',
          redirect: 'follow',
          signal: AbortSignal.timeout(15000),
        });
      }

      status = response.status;
      result =
        response.status >= 200 && response.status < 400
          ? 'ok'
          : response.status === 401 || response.status === 403
            ? 'restricted'
            : 'failed';
    } catch (error) {
      result = 'failed';
    }

    rows.push(`${url}\t${status}\t${result}`);

    if (result === 'failed') {
      addFinding(
        'external-link-failure',
        null,
        0,
        'External link check failed.',
        'warning',
        `${status} ${url}`,
      );
    }
  }

  fs.writeFileSync(path.join(outputRoot, 'raw', 'external-link-results.tsv'), `${rows.join('\n')}\n`);
}

if (!fs.existsSync(docsRoot)) {
  console.error(`Documentation directory not found: ${docsArg}`);
  process.exit(2);
}

fs.mkdirSync(path.join(outputRoot, 'raw'), { recursive: true });

const parsedMarkdown = new Map();

for (const file of walk(docsRoot).sort()) {
  const relativeFile = toRelative(file);
  const extension = path.extname(file).toLowerCase();

  if (!markdownExtensions.has(extension)) {
    continue;
  }

  if (relativeFile.startsWith('docs/generated/primeng/')) {
    continue;
  }

  const content = fs.readFileSync(file, 'utf8');
  const { metadata } = parseFrontmatter(content);

  files.push({
    bytes: fs.statSync(file).size,
    file: relativeFile,
    metadata,
  });

  validateRequiredMetadata(file, relativeFile, metadata);
  validateMergeMarkers(file, content);
  validateRetiredProvider(file, relativeFile, content, metadata);
  hashTrackedContent(relativeFile, content);
  validateStaleness(file, relativeFile);

  if (extension === '.mmd') {
    validateMermaid(file, 1, content);
  }

  if (linkMarkdownExtensions.has(extension)) {
    parsedMarkdown.set(file, parseMarkdown(file, content));
  }
}

for (const [file, parsed] of parsedMarkdown) {
  validateLinks(file, parsed);
}

validateDuplicateAdrNumbers();
validateDuplicateContent();
await checkExternalLinks();

findings.sort(
  (left, right) =>
    Number(right.blocking) - Number(left.blocking) ||
    left.category.localeCompare(right.category, 'en') ||
    left.file.localeCompare(right.file, 'en') ||
    left.line - right.line,
);

const categories = {};

for (const finding of findings) {
  categories[finding.category] = (categories[finding.category] ?? 0) + 1;
}

const counts = {
  blocking: findings.filter((finding) => finding.blocking).length,
  files: files.length,
  findings: findings.length,
  informational: findings.filter((finding) => finding.severity === 'info').length,
  warnings: findings.filter((finding) => finding.severity === 'warning').length,
};
const analysis = {
  categories,
  counts,
  documentationRoot: path.relative(root, docsRoot).split(path.sep).join('/'),
  externalUrls: [...externalUrls].sort(),
  findings,
  generatedAt: new Date().toISOString(),
};

fs.writeFileSync(
  path.join(outputRoot, 'analysis.json'),
  `${JSON.stringify(analysis, null, 2)}\n`,
);
fs.writeFileSync(
  path.join(outputRoot, 'files.json'),
  `${JSON.stringify(files, null, 2)}\n`,
);
fs.writeFileSync(
  path.join(outputRoot, 'findings.tsv'),
  [
    'blocking\tseverity\tcategory\tfile\tline\tmessage\tdetails',
    ...findings.map((finding) =>
      [
        finding.blocking,
        finding.severity,
        finding.category,
        finding.file,
        finding.line,
        finding.message,
        finding.details,
      ]
        .map((value) => String(value).replace(/\t/g, ' ').replace(/\r?\n/g, ' '))
        .join('\t'),
    ),
  ].join('\n') + '\n',
);
fs.writeFileSync(
  path.join(outputRoot, 'raw', 'external-urls.txt'),
  `${[...externalUrls].sort().join('\n')}${externalUrls.size ? '\n' : ''}`,
);

const categoryRows = Object.entries(categories)
  .sort((left, right) => right[1] - left[1])
  .map(([category, count]) => `| \`${category}\` | ${count} |`)
  .join('\n') || '| - | 0 |';
const findingRows = findings
  .slice(0, 200)
  .map((finding) => {
    const location = finding.file
      ? `\`${finding.file}${finding.line ? `:${finding.line}` : ''}\``
      : '-';
    return `| ${finding.blocking ? 'yes' : 'no'} | ${finding.severity} | \`${finding.category}\` | ${location} | ${finding.message.replace(/\|/g, '\\|')} |`;
  })
  .join('\n') || '| - | - | - | - | No findings. |';

fs.writeFileSync(
  path.join(outputRoot, 'report.md'),
  `# KRAAK documentation audit

- Generated: ${analysis.generatedAt}
- Documentation root: \`${analysis.documentationRoot}\`
- Blocking findings: ${counts.blocking}
- Warnings: ${counts.warnings}
- Informational: ${counts.informational}

## Categories

| Category | Count |
| --- | ---: |
${categoryRows}

## Findings

| Blocking | Severity | Category | Location | Message |
| --- | --- | --- | --- | --- |
${findingRows}
`,
);

console.log(`Documentation files: ${counts.files}`);
console.log(`Findings: ${counts.findings}`);
console.log(`Blocking findings: ${counts.blocking}`);
console.log(`Report: ${path.relative(root, path.join(outputRoot, 'report.md')).split(path.sep).join('/')}`);
NODE

NODE_STATUS=$?
if ((NODE_STATUS != 0)); then
  exit "$NODE_STATUS"
fi

BLOCKING_COUNT="$(node -e "const fs=require('fs');const p=process.argv[1];const a=JSON.parse(fs.readFileSync(p,'utf8'));process.stdout.write(String(a.counts.blocking||0));" "$OUTPUT_DIR/analysis.json")"

if ((FAIL_ON_FINDINGS)) && ((BLOCKING_COUNT > 0)); then
  echo "FAIL: blocking documentation findings detected." >&2
  exit 3
fi

echo "Audit completed."
