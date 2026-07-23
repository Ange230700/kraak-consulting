#!/usr/bin/env bash
#
# KRAAK docs audit
#
# Read-only audit of the repository docs/ tree.
#
# Requirements: git, node >= 18
# Optional: rg, tree, curl
#
# Usage:
#   bash scripts/audit-docs.sh
#   bash scripts/audit-docs.sh --full
#   bash scripts/audit-docs.sh --network
#   bash scripts/audit-docs.sh --fail-on-findings
#   bash scripts/audit-docs.sh --output .reports/docs-audit
#   bash scripts/audit-docs.sh --docs docs
#
# Exit codes:
#   0 completed
#   2 invalid input or missing prerequisite
#   3 findings detected in strict mode
#   4 audit execution failure

set -uo pipefail

DOCS_DIR="docs"
OUTPUT_DIR=""
FULL=0
NETWORK=0
FAIL_ON_FINDINGS=0
STALE_DAYS=180

usage() {
  sed -n '2,28p' "$0" | sed 's/^# \{0,1\}//'
}

while (($# > 0)); do
  case "$1" in
    --docs)
      [[ $# -ge 2 ]] || { echo "ERROR: --docs requires a directory." >&2; exit 2; }
      DOCS_DIR="$2"; shift 2 ;;
    --output)
      [[ $# -ge 2 ]] || { echo "ERROR: --output requires a directory." >&2; exit 2; }
      OUTPUT_DIR="$2"; shift 2 ;;
    --full) FULL=1; shift ;;
    --network) NETWORK=1; shift ;;
    --fail-on-findings) FAIL_ON_FINDINGS=1; shift ;;
    --stale-days)
      [[ $# -ge 2 && "$2" =~ ^[0-9]+$ ]] || {
        echo "ERROR: --stale-days requires a non-negative integer." >&2
        exit 2
      }
      STALE_DAYS="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "ERROR: unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

have() { command -v "$1" >/dev/null 2>&1; }
section() { printf '\n## %s\n' "$1"; printf '%s\n' '--------------------------------------------------------------------------------'; }
run() {
  printf '\n$'; printf ' %q' "$@"; printf '\n'
  "$@" 2>&1 || { status=$?; echo "WARN: command exited with status $status; audit continues."; return 0; }
}
run_shell() {
  printf '\n$ %s\n' "$1"
  bash -lc "$1" 2>&1 || { status=$?; echo "WARN: command exited with status $status; audit continues."; return 0; }
}

for cmd in git node; do
  have "$cmd" || { echo "ERROR: required command is missing: $cmd" >&2; exit 2; }
done

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
[[ -n "$REPO_ROOT" ]] || { echo "ERROR: run inside a Git repository." >&2; exit 2; }
cd "$REPO_ROOT" || exit 4
[[ -d "$DOCS_DIR" ]] || { echo "ERROR: directory not found: $DOCS_DIR" >&2; exit 2; }

TIMESTAMP="$(date -u '+%Y%m%dT%H%M%SZ' 2>/dev/null || date '+%Y%m%dT%H%M%S')"
[[ -n "$OUTPUT_DIR" ]] || OUTPUT_DIR=".reports/docs-audit-$TIMESTAMP"
mkdir -p "$OUTPUT_DIR/raw"

REPORT_MD="$OUTPUT_DIR/report.md"
REPORT_JSON="$OUTPUT_DIR/analysis.json"
FILES_JSON="$OUTPUT_DIR/files.json"
FINDINGS_TSV="$OUTPUT_DIR/findings.tsv"
EXTERNAL_URLS="$OUTPUT_DIR/raw/external-urls.txt"
EXTERNAL_RESULTS="$OUTPUT_DIR/raw/external-link-results.tsv"
CONSOLE_LOG="$OUTPUT_DIR/raw/console.txt"

: > "$FINDINGS_TSV"
: > "$EXTERNAL_URLS"
: > "$EXTERNAL_RESULTS"
exec > >(tee "$CONSOLE_LOG") 2>&1

printf '# KRAAK DOCUMENTATION AUDIT\n'
printf 'Generated:          %s\n' "$TIMESTAMP"
printf 'Repository:         %s\n' "$REPO_ROOT"
printf 'Documentation root: %s\n' "$DOCS_DIR"
printf 'Output:             %s\n' "$OUTPUT_DIR"
printf 'Mode:               full=%s network=%s strict=%s\n' "$FULL" "$NETWORK" "$FAIL_ON_FINDINGS"

section "1. Git scope"
run git status --short --branch
run git log -1 --format='%h %cI %s'
run_shell "git ls-files \"$DOCS_DIR\" | wc -l"
run git ls-files --others --exclude-standard "$DOCS_DIR"

section "2. Documentation tree"
if have tree; then
  if ((FULL)); then run tree -a "$DOCS_DIR"; else run tree -a -L 4 "$DOCS_DIR"; fi
else
  if ((FULL)); then
    run_shell "find \"$DOCS_DIR\" -print | sort"
  else
    run_shell "find \"$DOCS_DIR\" -maxdepth 4 -print | sort"
  fi
fi

section "3. Inventory"
run_shell "find \"$DOCS_DIR\" -type f | sort"
run_shell "find \"$DOCS_DIR\" -type f | awk -F. 'NF==1 {ext=\"[none]\"} NF>1 {ext=\$NF} {count[ext]++} END {for (e in count) print count[e], e}' | sort -nr"
run_shell "find \"$DOCS_DIR\" -type f -print0 | xargs -0 wc -l | sort -n | tail -30"

section "4. Fast risk scan"
if have rg; then
  run rg -n --glob '*.md' --glob '*.mmd' --glob '*.html' \
    '<<<<<<<|=======|>>>>>>>' "$DOCS_DIR"
  run rg -n -i --glob '*.md' --glob '*.mmd' --glob '*.html' \
    'vercel|vercel\.app|VERCEL_|kraak-consulting-staging|kraak-consulting-git-staging' "$DOCS_DIR"
  echo "NOTE: unfinished-marker checks run in the structural analyzer to ignore Markdown code spans and fences."
else
  echo "NOTE: rg is unavailable; core Node analysis still runs."
fi

section "5. Structural, link, ADR, and runbook analysis"
node - "$REPO_ROOT" "$DOCS_DIR" "$REPORT_MD" "$REPORT_JSON" "$FILES_JSON" "$FINDINGS_TSV" "$EXTERNAL_URLS" "$STALE_DAYS" "$FULL" <<'NODE'
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {execFileSync} = require('child_process');

const [repoArg, docsArg, mdArg, jsonArg, filesArg, tsvArg, urlsArg, staleArg, fullArg] = process.argv.slice(2);
const repo = path.resolve(repoArg);
const docs = path.resolve(repo, docsArg);
const reportMd = path.resolve(repo, mdArg);
const reportJson = path.resolve(repo, jsonArg);
const filesJson = path.resolve(repo, filesArg);
const findingsTsv = path.resolve(repo, tsvArg);
const urlsFile = path.resolve(repo, urlsArg);
const staleDays = Number(staleArg);
const full = fullArg === '1';

const mdExt = new Set(['.md', '.markdown', '.mdown']);
const textExt = new Set(['.md', '.markdown', '.mdown', '.mmd', '.txt', '.html', '.css', '.json', '.yaml', '.yml', '.toml', '.csv', '.xml', '.xsl']);
const findings = [];
const records = [];
const externalUrls = new Set();
const headingsByFile = new Map();
const hashes = new Map();
const basenames = new Map();

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (entry.isFile()) out.push(p);
  }
  return out;
}
function rel(p) { return path.relative(repo, p).split(path.sep).join('/'); }
function add(severity, category, file, line, message, details='') {
  findings.push({severity, category, file: file ? rel(file) : '', line: line || 0, message, details});
}
function slug(text) {
  return text.trim().toLowerCase().replace(/<[^>]+>/g, '').replace(/[`*_~]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}
function decode(value) { try { return decodeURIComponent(value); } catch { return value; } }
function stripInlineCode(line) {
  let out = '';
  let inCode = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '`') {
      let j = i;
      while (j < line.length && line[j] === '`') j++;
      inCode = !inCode;
      i = j - 1;
      continue;
    }
    out += inCode ? ' ' : line[i];
  }
  return out;
}
function markerLineForScan(line) {
  return stripInlineCode(line);
}
function hasUnfinishedMarker(line) {
  const actionable = /\b(TODO|FIXME|TBD|XXX|HACK)\b|^\s*(<<<<<<<|=======|>>>>>>>)/;
  const contextDependentStatus = /^\s*(?:document\s+)?(?:status|statut)\s*:\s*(?:draft|legacy|stale|obsolete|wip)\b/i;
  const contextDependentSentence = /\bthis document is\s+(?:stale|obsolete|wip)\b/i;
  const frenchIncomplete = /\ba completer\b/i;

  return actionable.test(line) || contextDependentStatus.test(line) || contextDependentSentence.test(line) || frenchIncomplete.test(line);
}
function isTemplateReferenceLink(label, key) {
  const normalizedLabel = label.trim().toUpperCase();
  const normalizedKey = key.trim().toUpperCase();
  const typedPlaceholders = new Set(['TASK', 'EPIC', 'BUG', 'DEFECT', 'ALERT', 'DOCS', 'OPS']);

  return normalizedKey === 'ID' && typedPlaceholders.has(normalizedLabel)
    || normalizedLabel === 'ID' && normalizedKey === 'ID'
    || /^DEP-\*$/.test(normalizedLabel)
    || /^DEP-\*$/.test(normalizedKey);
}
function gitCommittedAt(relativeFile) {
  try {
    const output = execFileSync('git', ['log', '-1', '--format=%cI', '--', relativeFile], {
      cwd: repo,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();

    if (!output) return null;
    const date = new Date(output);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}
function duplicateContentIsIgnorable(files) {
  return files.every(file => file.bytes < 16 || file.file.toLowerCase().endsWith('.exitcode'));
}

function parseMarkdown(file, content) {
  const lines = content.split(/\r?\n/);
  const headings = [];
  const links = [];
  const refs = new Map();
  let fence = null;
  let mermaid = 0;

  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1;
    const line = lines[i];
    const fenceMatch = line.match(/^\s*(```+|~~~+)\s*([^\s`]*)?.*$/);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      const language = (fenceMatch[2] || '').trim();
      if (!fence) {
        fence = {char: marker[0], length: marker.length, line: lineNo};
        if (!language) add('warning', 'code-fence-language', file, lineNo, 'Fenced code block has no language identifier.');
        if (language.toLowerCase() === 'mermaid') mermaid++;
      } else if (marker[0] === fence.char && marker.length >= fence.length) {
        fence = null;
      }
      continue;
    }
    if (fence) continue;

    const hm = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (hm) headings.push({level: hm[1].length, text: hm[2].trim(), line: lineNo, slug: slug(hm[2])});

    const searchableLine = stripInlineCode(line);
    const rd = searchableLine.match(/^\s*\[([^\]]+)\]:\s*(\S+)/);
    if (rd) refs.set(rd[1].trim().toLowerCase(), {target: rd[2], line: lineNo});

    let m;
    const inline = /!?\[([^\]]*)\]\(([^)]+)\)/g;
    while ((m = inline.exec(searchableLine)) !== null) {
      const raw = m[2].trim().replace(/^<|>$/g, '');
      links.push({label: m[1], target: raw.split(/\s+["'(]/)[0], line: lineNo, image: m[0].startsWith('!')});
    }
    const refLink = /!?\[([^\]]+)\]\[([^\]]*)\]/g;
    while ((m = refLink.exec(searchableLine)) !== null) {
      const key = (m[2] || m[1]).trim().toLowerCase();
      if (isTemplateReferenceLink(m[1], key)) continue;
      links.push({label: m[1], target: refs.get(key)?.target || '', line: lineNo, image: m[0].startsWith('!'), unresolved: !refs.has(key), key});
    }
    const bare = /https?:\/\/[^\s<>"')\]]+/g;
    while ((m = bare.exec(searchableLine)) !== null) externalUrls.add(m[0].replace(/[.,;:]$/, ''));
  }

  if (fence) add('error', 'unclosed-code-fence', file, fence.line, 'Unclosed fenced code block.');
  const h1 = headings.filter(h => h.level === 1);
  if (h1.length === 0) add('warning', 'missing-h1', file, 1, 'Markdown file has no H1 heading.');
  if (h1.length > 1) add('warning', 'multiple-h1', file, h1[1].line, `Markdown file has ${h1.length} H1 headings.`);

  let previous = 0;
  for (const h of headings) {
    if (previous && h.level > previous + 1) add('warning', 'heading-level-skip', file, h.line, `Heading jumps from H${previous} to H${h.level}.`, h.text);
    previous = h.level;
  }
  const counts = new Map();
  for (const h of headings) counts.set(h.slug, (counts.get(h.slug) || 0) + 1);
  for (const [key, count] of counts) if (key && count > 1) add('warning', 'duplicate-heading', file, headings.find(h => h.slug === key)?.line || 1, `Heading anchor "${key}" appears ${count} times.`);

  headingsByFile.set(file, headings);
  return {lines, headings, links, mermaid};
}

for (const file of walk(docs).sort()) {
  const stat = fs.statSync(file);
  const relativeFile = rel(file);
  const ext = path.extname(file).toLowerCase();
  const base = path.basename(file).toLowerCase();
  if (!basenames.has(base)) basenames.set(base, []);
  basenames.get(base).push(relativeFile);

  const committedAt = gitCommittedAt(relativeFile);
  const ageBasisMs = committedAt ? committedAt.getTime() : stat.mtimeMs;
  const record = {file: relativeFile, extension: ext || '[none]', bytes: stat.size, lines: null, ageDays: Math.floor((Date.now() - ageBasisMs) / 86400000), ageSource: committedAt ? 'git-history' : 'filesystem-mtime', lastCommittedAt: committedAt ? committedAt.toISOString() : null, markdown: mdExt.has(ext), headings: 0, links: 0, mermaidBlocks: 0};
  let content = null;

  if (textExt.has(ext)) {
    try { content = fs.readFileSync(file, 'utf8'); }
    catch (e) { add('error', 'read-failure', file, 0, 'Unable to read text file.', e.message); }
  }

  if (content !== null) {
    const lines = content.split(/\r?\n/);
    record.lines = lines.length;
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    if (!hashes.has(hash)) hashes.set(hash, []);
    hashes.get(hash).push({file: relativeFile, bytes: stat.size});

    if (/\r\n/.test(content)) add('info', 'crlf-line-endings', file, 1, 'File uses CRLF line endings.');
    const trail = lines.findIndex(line => /[ \t]+$/.test(line));
    if (trail >= 0) add('warning', 'trailing-whitespace', file, trail + 1, 'File contains trailing whitespace.');
    const conflict = lines.findIndex(line => /^(<<<<<<<|=======|>>>>>>>)/.test(line));
    if (conflict >= 0) add('error', 'merge-conflict-marker', file, conflict + 1, 'Merge-conflict marker detected.');

    let scanFence = null;
    for (let i = 0; i < lines.length; i++) {
      if (mdExt.has(ext)) {
        const fenceMatch = lines[i].match(/^\s*(```+|~~~+)/);
        if (fenceMatch) {
          const marker = fenceMatch[1];
          if (!scanFence) scanFence = {char: marker[0], length: marker.length};
          else if (marker[0] === scanFence.char && marker.length >= scanFence.length) scanFence = null;
          continue;
        }
        if (scanFence) continue;
      }

      const markerLine = mdExt.has(ext) ? markerLineForScan(lines[i]) : lines[i];
      if (hasUnfinishedMarker(markerLine))
        add('warning', 'unfinished-marker', file, i + 1, 'Potential unfinished or stale documentation marker.', markerLine.trim().slice(0, 180));
    }
    const provider = lines.findIndex(line => /vercel|vercel\.app|VERCEL_|kraak-consulting-staging|kraak-consulting-git-staging/i.test(line));
    if (provider >= 0) add('warning', 'retired-provider-reference', file, provider + 1, 'Potential retired hosting-provider reference.', lines[provider].trim().slice(0, 180));

    if (mdExt.has(ext)) {
      const parsed = parseMarkdown(file, content);
      record.headings = parsed.headings.length;
      record.links = parsed.links.length;
      record.mermaidBlocks = parsed.mermaid;
      record.parsedLinks = parsed.links;
    }
  } else {
    const hash = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    if (!hashes.has(hash)) hashes.set(hash, []);
    hashes.get(hash).push({file: relativeFile, bytes: stat.size});
  }

  if (stat.size === 0) add('warning', 'empty-file', file, 1, 'File is empty.');
  if (stat.size > 500000) add('info', 'large-doc-file', file, 0, 'Documentation file exceeds 500 KB.', `${stat.size} bytes`);
  if (record.ageDays > staleDays) add('info', committedAt ? 'old-file-git-history' : 'old-file-mtime', file, 0, committedAt ? `Last Git commit for file is older than ${staleDays} days.` : `File mtime is older than ${staleDays} days.`, `${record.ageDays} days`);
  if (/\s/.test(path.relative(docs, file))) add('warning', 'space-in-path', file, 0, 'Documentation path contains spaces.');
  records.push(record);
}

for (const [base, files] of basenames) {
  if (files.length > 1 && base !== 'readme.md' && base !== '.gitkeep') add('info', 'duplicate-basename', null, 0, `Basename "${base}" appears ${files.length} times.`, files.join(', '));
}
for (const files of hashes.values()) if (files.length > 1 && !duplicateContentIsIgnorable(files)) add('warning', 'duplicate-content', null, 0, `Identical content appears in ${files.length} files.`, files.map(file => file.file).join(', '));

for (const record of records.filter(r => r.markdown)) {
  const source = path.resolve(repo, record.file);
  const sourceDir = path.dirname(source);
  for (const link of record.parsedLinks || []) {
    if (link.unresolved) { add('error', 'undefined-reference-link', source, link.line, `Undefined reference link: [${link.key}]`); continue; }
    const target = link.target.trim();
    if (!target) { add('warning', 'empty-link-target', source, link.line, 'Link has an empty target.'); continue; }
    if (/^(https?:|mailto:|tel:|sms:|data:)/i.test(target)) {
      if (/^https?:/i.test(target)) externalUrls.add(target);
      if (/^http:\/\//i.test(target)) add('warning', 'insecure-http-link', source, link.line, 'External link uses HTTP.', target);
      continue;
    }
    if (target.startsWith('#')) {
      const anchor = decode(target.slice(1)).toLowerCase();
      const anchors = new Set((headingsByFile.get(source) || []).map(h => h.slug));
      if (anchor && !anchors.has(anchor)) add('error', 'broken-local-anchor', source, link.line, `Anchor not found: #${anchor}`);
      continue;
    }
    const parts = target.split('#', 2);
    const cleanPath = decode(parts[0].split('?')[0]);
    const resolved = path.resolve(sourceDir, cleanPath);
    if (!fs.existsSync(resolved)) {
      add('error', link.image ? 'missing-image' : 'broken-relative-link', source, link.line, `Referenced path does not exist: ${target}`, rel(resolved));
      continue;
    }
    if (parts[1] && fs.statSync(resolved).isFile() && mdExt.has(path.extname(resolved).toLowerCase())) {
      if (!headingsByFile.has(resolved)) parseMarkdown(resolved, fs.readFileSync(resolved, 'utf8'));
      const anchors = new Set((headingsByFile.get(resolved) || []).map(h => h.slug));
      const anchor = decode(parts[1]).toLowerCase();
      if (anchor && !anchors.has(anchor)) add('error', 'broken-cross-file-anchor', source, link.line, `Cross-file anchor not found: ${target}`);
    }
  }
}

const decisions = path.join(docs, 'decisions');
if (fs.existsSync(decisions)) {
  const adrFiles = fs.readdirSync(decisions).filter(name => /^ARC-\d{2}-.+\.md$/i.test(name)).sort();
  const numbers = new Map();
  for (const name of adrFiles) {
    const number = Number(name.match(/^ARC-(\d{2})-/i)[1]);
    if (!numbers.has(number)) numbers.set(number, []);
    numbers.get(number).push(name);
  }
  for (const [number, names] of numbers) if (names.length > 1) add('error', 'duplicate-adr-number', decisions, 0, `ADR ARC-${String(number).padStart(2,'0')} is duplicated.`, names.join(', '));
  const sequence = [...numbers.keys()].sort((a,b) => a-b);
  if (sequence.length) for (let n = sequence[0]; n <= sequence[sequence.length-1]; n++) if (!numbers.has(n)) add('warning', 'missing-adr-number', decisions, 0, `ADR sequence is missing ARC-${String(n).padStart(2,'0')}.`);
  const index = path.join(decisions, 'README.md');
  if (!fs.existsSync(index)) add('warning', 'missing-adr-index', decisions, 0, 'decisions/ has no README.md index.');
  else {
    const indexText = fs.readFileSync(index, 'utf8');
    for (const name of adrFiles) if (!indexText.includes(name)) add('warning', 'adr-missing-from-index', index, 1, `ADR is not referenced by decisions/README.md: ${name}`);
  }
}

const order = {error: 0, warning: 1, info: 2};
findings.sort((a,b) => (order[a.severity]-order[b.severity]) || a.file.localeCompare(b.file) || a.line-b.line);
const counts = {
  files: records.length,
  markdownFiles: records.filter(r => r.markdown).length,
  totalLines: records.reduce((s,r) => s + (r.lines || 0), 0),
  totalBytes: records.reduce((s,r) => s + r.bytes, 0),
  headings: records.reduce((s,r) => s + r.headings, 0),
  links: records.reduce((s,r) => s + r.links, 0),
  mermaidBlocks: records.reduce((s,r) => s + r.mermaidBlocks, 0),
  externalUrls: externalUrls.size,
  findings: findings.length,
  errors: findings.filter(f => f.severity === 'error').length,
  warnings: findings.filter(f => f.severity === 'warning').length,
  info: findings.filter(f => f.severity === 'info').length,
};
const categories = {};
for (const f of findings) categories[f.category] = (categories[f.category] || 0) + 1;
const analysis = {generatedAt: new Date().toISOString(), documentationRoot: rel(docs), staleThresholdDays: staleDays, counts, categories, findings};

fs.writeFileSync(filesJson, JSON.stringify(records.map(({parsedLinks, ...r}) => r), null, 2) + '\n');
fs.writeFileSync(reportJson, JSON.stringify(analysis, null, 2) + '\n');
fs.writeFileSync(urlsFile, [...externalUrls].sort().join('\n') + (externalUrls.size ? '\n' : ''));
const esc = v => String(v ?? '').replace(/\t/g,' ').replace(/\r?\n/g,' ');
fs.writeFileSync(findingsTsv, ['severity\tcategory\tfile\tline\tmessage\tdetails', ...findings.map(f => [f.severity,f.category,f.file,f.line,f.message,f.details].map(esc).join('\t'))].join('\n') + '\n');

const categoryRows = Object.entries(categories).sort((a,b) => b[1]-a[1]).map(([k,v]) => `| \`${k}\` | ${v} |`).join('\n') || '| _None_ | 0 |';
const largestRows = [...records].sort((a,b) => b.bytes-a.bytes).slice(0,20).map(r => `| \`${r.file}\` | ${r.bytes} | ${r.lines ?? 'binary'} |`).join('\n');
const max = full ? findings.length : 250;
const findingRows = findings.slice(0,max).map(f => {
  const loc = f.file ? `\`${f.file}${f.line ? ':'+f.line : ''}\`` : '-';
  const details = f.details ? `<br><sub>${f.details.replace(/\|/g,'\\|')}</sub>` : '';
  return `| ${f.severity} | \`${f.category}\` | ${loc} | ${f.message.replace(/\|/g,'\\|')}${details} |`;
}).join('\n') || '| - | - | - | No findings. |';

const md = `# KRAAK documentation audit\n\n- Generated: ${analysis.generatedAt}\n- Documentation root: \`${analysis.documentationRoot}\`\n- Stale threshold: ${staleDays} days\n\n## Executive summary\n\n| Metric | Value |\n| --- | ---: |\n| Files | ${counts.files} |\n| Markdown files | ${counts.markdownFiles} |\n| Text lines | ${counts.totalLines} |\n| Bytes | ${counts.totalBytes} |\n| Headings | ${counts.headings} |\n| Markdown links/images | ${counts.links} |\n| Mermaid blocks | ${counts.mermaidBlocks} |\n| External URLs | ${counts.externalUrls} |\n| Findings | ${counts.findings} |\n| Errors | ${counts.errors} |\n| Warnings | ${counts.warnings} |\n| Informational | ${counts.info} |\n\n## Findings by category\n\n| Category | Count |\n| --- | ---: |\n${categoryRows}\n\n## Largest files\n\n| File | Bytes | Lines |\n| --- | ---: | ---: |\n${largestRows}\n\n## Detailed findings\n\n| Severity | Category | Location | Finding |\n| --- | --- | --- | --- |\n${findingRows}\n${!full && findings.length > 250 ? '\n> The Markdown report shows the first 250 findings. Use analysis.json or findings.tsv for the complete set.\n' : ''}\n## Artifacts\n\n- \`analysis.json\`\n- \`files.json\`\n- \`findings.tsv\`\n- \`raw/external-urls.txt\`\n- \`raw/external-link-results.tsv\`\n- \`raw/console.txt\`\n`;
fs.writeFileSync(reportMd, md);

console.log(`Files analyzed:      ${counts.files}`);
console.log(`Markdown files:      ${counts.markdownFiles}`);
console.log(`Errors:              ${counts.errors}`);
console.log(`Warnings:            ${counts.warnings}`);
console.log(`Informational:       ${counts.info}`);
console.log(`External URLs:       ${counts.externalUrls}`);
console.log(`Markdown report:     ${path.relative(repo, reportMd)}`);
console.log(`JSON report:         ${path.relative(repo, reportJson)}`);
NODE

NODE_STATUS=$?
((NODE_STATUS == 0)) || { echo "ERROR: Node analysis failed with status $NODE_STATUS." >&2; exit 4; }

section "6. External links"
if ((NETWORK)); then
  if ! have curl; then
    echo "WARN: --network requested, but curl is unavailable."
  elif [[ ! -s "$EXTERNAL_URLS" ]]; then
    echo "No external URLs found."
  else
    printf 'url\tstatus\tresult\n' > "$EXTERNAL_RESULTS"
    curl_status() {
      local method="$1"
      local url="$2"
      local status

      if [[ "$method" == "HEAD" ]]; then
        status="$(curl --location --silent --show-error --output /dev/null --write-out '%{http_code}' --max-time 20 --connect-timeout 8 --user-agent 'KRAAK-Docs-Audit/1.0' --head "$url" 2>/dev/null || true)"
      else
        status="$(curl --location --silent --show-error --output /dev/null --write-out '%{http_code}' --max-time 20 --connect-timeout 8 --user-agent 'KRAAK-Docs-Audit/1.0' "$url" 2>/dev/null || true)"
      fi

      [[ "$status" =~ ^[0-9]{3}$ ]] || status="000"
      printf '%s' "$status"
    }
    check_url_once() {
      local url="$1"
      local status

      status="$(curl_status HEAD "$url")"
      if [[ "$status" == "405" ]]; then
        status="$(curl_status GET "$url")"
      fi

      printf '%s' "$status"
    }
    retryable_status() {
      case "$1" in
        429|5??) return 0 ;;
        *) return 1 ;;
      esac
    }
    classify_status() {
      case "$1" in
        2??|3??) printf 'ok' ;;
        401|403) printf 'restricted' ;;
        *) printf 'failed' ;;
      esac
    }
    while IFS= read -r url; do
      [[ -n "$url" ]] || continue
      status="$(check_url_once "$url")"
      if retryable_status "$status"; then
        status="$(check_url_once "$url")"
      fi
      result="$(classify_status "$status")"
      printf '%s\t%s\t%s\n' "$url" "$status" "$result" >> "$EXTERNAL_RESULTS"
      printf '%-4s %s\n' "$status" "$url"
    done < "$EXTERNAL_URLS"
  fi
else
  echo "NOTE: re-run with --network to check collected external URLs."
fi

section "7. Documentation history"
run git log --oneline --decorate -20 -- "$DOCS_DIR"
if ((FULL)); then
  run_shell "git log --name-only --format='' -- \"$DOCS_DIR\" | sed '/^$/d' | sort | uniq -c | sort -nr | head -50"
fi

ERROR_COUNT="$(node -e 'const fs=require("fs"); const a=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); process.stdout.write(String(a.counts.errors||0));' "$REPORT_JSON")"
WARNING_COUNT="$(node -e 'const fs=require("fs"); const a=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); process.stdout.write(String(a.counts.warnings||0));' "$REPORT_JSON")"
NETWORK_FAILURES=0
if [[ -s "$EXTERNAL_RESULTS" ]]; then
  NETWORK_FAILURES="$(awk -F '\t' 'NR>1 && $3=="failed" {n++} END {print n+0}' "$EXTERNAL_RESULTS")"
fi

section "8. Final summary"
printf 'Errors:                 %s\n' "$ERROR_COUNT"
printf 'Warnings:               %s\n' "$WARNING_COUNT"
printf 'External link failures: %s\n' "$NETWORK_FAILURES"
printf 'Markdown report:        %s\n' "$REPORT_MD"
printf 'JSON report:            %s\n' "$REPORT_JSON"
printf 'Findings TSV:           %s\n' "$FINDINGS_TSV"

if ((FAIL_ON_FINDINGS)) && ((ERROR_COUNT > 0 || WARNING_COUNT > 0 || NETWORK_FAILURES > 0)); then
  echo "FAIL: documentation findings detected."
  exit 3
fi

echo "Audit completed."
