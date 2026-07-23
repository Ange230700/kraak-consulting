#!/usr/bin/env bash
#
# KRAAK GitHub Projects planning awareness report
#
# Read-only audit of a GitHub Projects (v2) board and its linked repository.
# It collects project metadata, views, fields, options, workflows, items,
# repository issues/PRs, planning completeness, drift, and optional dependency
# relationships. It never edits the project or repository.
#
# Requirements:
#   - bash 4+
#   - git
#   - gh authenticated with at least read:project/project access
#   - jq
#   - node
#
# Typical KRAAK usage:
#   bash scripts/github-project-awareness.sh
#   bash scripts/github-project-awareness.sh --deep
#   bash scripts/github-project-awareness.sh --project 6 --owner @me --deep
#   bash scripts/github-project-awareness.sh --output .reports/project-audit
#
# The default project is KRAAK Project #6 owned by the authenticated user.

set -uo pipefail

PROJECT_NUMBER="${KRAAK_PROJECT_NUMBER:-6}"
PROJECT_OWNER="${KRAAK_PROJECT_OWNER:-@me}"
REPOSITORY="${KRAAK_REPOSITORY:-}"
OUTPUT_DIR=""
MAX_ITEMS=1000
STALE_DAYS=30
CURRENT_WAVE="${KRAAK_CURRENT_WAVE:-}"
DEEP=0
GENERIC=0
FAIL_ON_DRIFT=0
OPEN_PROJECT=0
USE_CANONICAL=1
CANONICAL_FILE="docs/generated/planning/github_project_planning_current.csv"
PLANNING_EXPORT_FILE=""
USE_COLOR=1

usage() {
  cat <<'EOF'
KRAAK GitHub Projects planning awareness report

Usage:
  github-project-awareness.sh [options]

Options:
  --project NUMBER       Project number. Default: 6
  --owner LOGIN          Project owner login or @me. Default: @me
  --repo OWNER/REPO      Repository to compare with the project. Auto-detected.
  --output DIR           Output directory. Default: .reports/github-project-<time>
  --max-items NUMBER     Maximum project/repository items. Default: 1000
  --stale-days NUMBER    Open-item inactivity threshold. Default: 30
  --current-wave NAME    Active wave for current Todo field requirements
  --deep                 Fetch issue dependencies, parents, sub-issues and PR details
  --canonical FILE       Compare with a canonical planning CSV
  --export-current FILE  Write a current planning CSV snapshot from live project data
  --check-current        Check the live project against the generated planning CSV
  --no-canonical         Disable canonical CSV comparison
  --generic              Disable KRAAK-specific fields, views and option checks
  --fail-on-drift        Exit 3 when planning drift is detected
  --open                 Open the selected project in the browser after the audit
  --no-color             Disable terminal colors
  -h, --help             Show this help

Examples:
  bash scripts/github-project-awareness.sh
  bash scripts/github-project-awareness.sh --deep
  bash scripts/github-project-awareness.sh --project 6 --owner @me --deep
  bash scripts/github-project-awareness.sh --export-current docs/generated/planning/github_project_planning_current.csv
  bash scripts/github-project-awareness.sh --check-current
EOF
}

while (($# > 0)); do
  case "$1" in
    --project)
      PROJECT_NUMBER="${2:-}"
      shift 2
      ;;
    --owner)
      PROJECT_OWNER="${2:-}"
      shift 2
      ;;
    --repo)
      REPOSITORY="${2:-}"
      shift 2
      ;;
    --output)
      OUTPUT_DIR="${2:-}"
      shift 2
      ;;
    --max-items)
      MAX_ITEMS="${2:-}"
      shift 2
      ;;
    --stale-days)
      STALE_DAYS="${2:-}"
      shift 2
      ;;
    --current-wave)
      CURRENT_WAVE="${2:-}"
      shift 2
      ;;
    --deep)
      DEEP=1
      shift
      ;;
    --canonical)
      CANONICAL_FILE="${2:-}"
      USE_CANONICAL=1
      shift 2
      ;;
    --export-current)
      PLANNING_EXPORT_FILE="${2:-}"
      shift 2
      ;;
    --check-current)
      USE_CANONICAL=1
      FAIL_ON_DRIFT=1
      shift
      ;;
    --no-canonical)
      USE_CANONICAL=0
      shift
      ;;
    --generic)
      GENERIC=1
      shift
      ;;
    --fail-on-drift)
      FAIL_ON_DRIFT=1
      shift
      ;;
    --open)
      OPEN_PROJECT=1
      shift
      ;;
    --no-color)
      USE_COLOR=0
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      printf 'Unknown option: %s\n\n' "$1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ ! "$PROJECT_NUMBER" =~ ^[0-9]+$ ]]; then
  printf 'Error: --project must be a positive integer.\n' >&2
  exit 2
fi

if [[ ! "$MAX_ITEMS" =~ ^[0-9]+$ ]] || ((MAX_ITEMS < 1)); then
  printf 'Error: --max-items must be a positive integer.\n' >&2
  exit 2
fi

if [[ ! "$STALE_DAYS" =~ ^[0-9]+$ ]]; then
  printf 'Error: --stale-days must be a non-negative integer.\n' >&2
  exit 2
fi

if [[ ! -t 1 || -n "${NO_COLOR:-}" ]]; then
  USE_COLOR=0
fi

if ((USE_COLOR)); then
  C_RESET=$'\033[0m'
  C_BOLD=$'\033[1m'
  C_BLUE=$'\033[34m'
  C_CYAN=$'\033[36m'
  C_GREEN=$'\033[32m'
  C_YELLOW=$'\033[33m'
  C_RED=$'\033[31m'
else
  C_RESET=""
  C_BOLD=""
  C_BLUE=""
  C_CYAN=""
  C_GREEN=""
  C_YELLOW=""
  C_RED=""
fi

have() {
  command -v "$1" >/dev/null 2>&1
}

fatal() {
  printf '%sERROR:%s %s\n' "$C_RED" "$C_RESET" "$1" >&2
  exit 1
}

warn() {
  printf '%sWARN:%s %s\n' "$C_YELLOW" "$C_RESET" "$1" >&2
}

info() {
  printf '%sINFO:%s %s\n' "$C_CYAN" "$C_RESET" "$1"
}

ok() {
  printf '%sOK:%s %s\n' "$C_GREEN" "$C_RESET" "$1"
}

step() {
  printf '\n%s%s%s\n' "$C_BOLD$C_BLUE" "$1" "$C_RESET"
  printf '%s\n' '--------------------------------------------------------------------------------'
}

for cmd in git gh jq node; do
  have "$cmd" || fatal "Required command is missing: $cmd"
done

if ! gh auth status >/dev/null 2>&1; then
  fatal "GitHub CLI is not authenticated. Run: gh auth login"
fi

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$REPO_ROOT" ]]; then
  fatal "Run this script from inside the KRAAK Git repository."
fi
cd "$REPO_ROOT" || exit 1

if [[ -z "$REPOSITORY" ]]; then
  REPOSITORY="$(gh repo view --json nameWithOwner --jq '.nameWithOwner' 2>/dev/null || true)"
fi
if [[ -z "$REPOSITORY" ]]; then
  fatal "Could not determine the repository. Pass --repo OWNER/REPO."
fi

if [[ "$PROJECT_OWNER" == "@me" ]]; then
  OWNER_LOGIN="$(gh api user --jq '.login' 2>/dev/null || true)"
else
  OWNER_LOGIN="$PROJECT_OWNER"
fi
if [[ -z "$OWNER_LOGIN" ]]; then
  fatal "Could not resolve the GitHub Project owner."
fi

TIMESTAMP="$(date -u '+%Y%m%dT%H%M%SZ')"
if [[ -z "$OUTPUT_DIR" ]]; then
  OUTPUT_DIR=".reports/github-project-${PROJECT_NUMBER}-${TIMESTAMP}"
fi

RAW_DIR="$OUTPUT_DIR/raw"
DEEP_DIR="$OUTPUT_DIR/deep"
mkdir -p "$RAW_DIR" "$DEEP_DIR"

REPORT_FILE="$OUTPUT_DIR/report.md"
ANALYSIS_FILE="$OUTPUT_DIR/analysis.json"
NORMALIZED_ITEMS_FILE="$OUTPUT_DIR/items-normalized.json"
CANONICAL_COMPARISON_FILE="$OUTPUT_DIR/canonical-comparison.json"
ERROR_LOG="$OUTPUT_DIR/errors.log"
: > "$ERROR_LOG"

printf '%s\n' "KRAAK GitHub Project awareness audit" > "$OUTPUT_DIR/README.txt"
printf 'Generated: %s\n' "$TIMESTAMP" >> "$OUTPUT_DIR/README.txt"
printf 'Owner: %s\nProject: %s\nRepository: %s\n' \
  "$OWNER_LOGIN" "$PROJECT_NUMBER" "$REPOSITORY" >> "$OUTPUT_DIR/README.txt"

step "1. Authentication and repository context"
gh auth status > "$RAW_DIR/auth-status.txt" 2>&1 || true
gh repo view "$REPOSITORY" \
  --json nameWithOwner,url,description,defaultBranchRef,visibility,isPrivate,owner,name \
  > "$RAW_DIR/repository.json"
ok "Repository: $REPOSITORY"
info "Project owner: $OWNER_LOGIN"
info "Project number: $PROJECT_NUMBER"

step "2. Project metadata, fields and items"

if ! gh project list --owner "$PROJECT_OWNER" --closed --limit 100 --format json \
  > "$RAW_DIR/projects.json" 2>>"$ERROR_LOG"; then
  warn "Could not list all projects for $PROJECT_OWNER."
  printf '{"projects":[]}\n' > "$RAW_DIR/projects.json"
fi

if ! gh project view "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json \
  > "$RAW_DIR/project.json" 2>>"$ERROR_LOG"; then
  fatal "Could not read Project #$PROJECT_NUMBER. Ensure the gh token has project/read:project scope. Try: gh auth refresh -s project"
fi

if ! gh project field-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" \
  --limit 200 --format json > "$RAW_DIR/fields-cli.json" 2>>"$ERROR_LOG"; then
  fatal "Could not read project fields."
fi

if ! gh project item-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" \
  --limit "$MAX_ITEMS" --format json > "$RAW_DIR/items.json" 2>>"$ERROR_LOG"; then
  fatal "Could not read project items."
fi

PROJECT_TITLE="$(jq -r '.title // "Untitled project"' "$RAW_DIR/project.json")"
PROJECT_URL="$(jq -r '.url // empty' "$RAW_DIR/project.json")"
PROJECT_OWNER_TYPE="$(jq -r '.owner.type // "User"' "$RAW_DIR/project.json")"
ITEM_TOTAL="$(jq -r '.totalCount // (.items | length)' "$RAW_DIR/items.json")"
ok "Project: $PROJECT_TITLE"
ok "Items fetched: $ITEM_TOTAL"

step "3. Advanced project configuration through GraphQL"

if [[ "$PROJECT_OWNER_TYPE" == "Organization" ]]; then
  cat > "$RAW_DIR/project-query.graphql" <<'GRAPHQL'
query($owner: String!, $number: Int!) {
  organization(login: $owner) {
    projectV2(number: $number) { ...ProjectDetails }
  }
}

fragment FieldIdentity on ProjectV2FieldConfiguration {
  __typename
  ... on ProjectV2Field { id name dataType }
  ... on ProjectV2SingleSelectField { id name dataType }
  ... on ProjectV2IterationField { id name dataType }
}

fragment ProjectDetails on ProjectV2 {
  id
  number
  title
  shortDescription
  readme
  url
  public
  closed
  createdAt
  updatedAt
  viewerCanUpdate
  viewerCanClose
  viewerCanReopen
  repositories(first: 100) {
    nodes { nameWithOwner url }
  }
  fields(first: 100) {
    nodes {
      __typename
      ... on ProjectV2Field { id name dataType }
      ... on ProjectV2SingleSelectField {
        id
        name
        dataType
        options { id name color description }
      }
      ... on ProjectV2IterationField {
        id
        name
        dataType
        configuration {
          iterations { id title startDate duration }
          completedIterations { id title startDate duration }
        }
      }
    }
  }
  views(first: 100) {
    nodes {
      id
      number
      name
      layout
      filter
      createdAt
      updatedAt
      fields(first: 50) { nodes { ...FieldIdentity } }
      groupByFields(first: 10) { nodes { ...FieldIdentity } }
      verticalGroupByFields(first: 10) { nodes { ...FieldIdentity } }
      sortByFields(first: 10) {
        nodes {
          direction
          field { ...FieldIdentity }
        }
      }
    }
  }
  workflows(first: 100) {
    nodes { id number name enabled updatedAt }
  }
  statusUpdates(first: 20, orderBy: {field: CREATED_AT, direction: DESC}) {
    nodes {
      id
      status
      startDate
      targetDate
      body
      createdAt
      updatedAt
      creator { login }
    }
  }
}
GRAPHQL
else
  cat > "$RAW_DIR/project-query.graphql" <<'GRAPHQL'
query($owner: String!, $number: Int!) {
  user(login: $owner) {
    projectV2(number: $number) { ...ProjectDetails }
  }
}

fragment FieldIdentity on ProjectV2FieldConfiguration {
  __typename
  ... on ProjectV2Field { id name dataType }
  ... on ProjectV2SingleSelectField { id name dataType }
  ... on ProjectV2IterationField { id name dataType }
}

fragment ProjectDetails on ProjectV2 {
  id
  number
  title
  shortDescription
  readme
  url
  public
  closed
  createdAt
  updatedAt
  viewerCanUpdate
  viewerCanClose
  viewerCanReopen
  repositories(first: 100) {
    nodes { nameWithOwner url }
  }
  fields(first: 100) {
    nodes {
      __typename
      ... on ProjectV2Field { id name dataType }
      ... on ProjectV2SingleSelectField {
        id
        name
        dataType
        options { id name color description }
      }
      ... on ProjectV2IterationField {
        id
        name
        dataType
        configuration {
          iterations { id title startDate duration }
          completedIterations { id title startDate duration }
        }
      }
    }
  }
  views(first: 100) {
    nodes {
      id
      number
      name
      layout
      filter
      createdAt
      updatedAt
      fields(first: 50) { nodes { ...FieldIdentity } }
      groupByFields(first: 10) { nodes { ...FieldIdentity } }
      verticalGroupByFields(first: 10) { nodes { ...FieldIdentity } }
      sortByFields(first: 10) {
        nodes {
          direction
          field { ...FieldIdentity }
        }
      }
    }
  }
  workflows(first: 100) {
    nodes { id number name enabled updatedAt }
  }
  statusUpdates(first: 20, orderBy: {field: CREATED_AT, direction: DESC}) {
    nodes {
      id
      status
      startDate
      targetDate
      body
      createdAt
      updatedAt
      creator { login }
    }
  }
}
GRAPHQL
fi

GRAPHQL_QUERY="$(cat "$RAW_DIR/project-query.graphql")"
if ! gh api graphql \
  -f query="$GRAPHQL_QUERY" \
  -F owner="$OWNER_LOGIN" \
  -F number="$PROJECT_NUMBER" \
  > "$RAW_DIR/project-graphql.json" 2>>"$ERROR_LOG"; then
  warn "Advanced GraphQL project metadata failed; the report will use CLI data where possible."
  printf '{"data":{}}\n' > "$RAW_DIR/project-graphql.json"
fi

step "4. Repository planning inventory"

if ! gh issue list -R "$REPOSITORY" --state all --limit "$MAX_ITEMS" \
  --json number,title,state,stateReason,assignees,labels,milestone,createdAt,updatedAt,closedAt,url \
  > "$RAW_DIR/repository-issues.json" 2>>"$ERROR_LOG"; then
  warn "Could not fetch repository issues."
  printf '[]\n' > "$RAW_DIR/repository-issues.json"
fi

if ! gh pr list -R "$REPOSITORY" --state all --limit "$MAX_ITEMS" \
  --json number,title,state,isDraft,assignees,labels,milestone,createdAt,updatedAt,closedAt,mergedAt,url,headRefName,baseRefName,reviewDecision,mergeStateStatus \
  > "$RAW_DIR/repository-prs.json" 2>>"$ERROR_LOG"; then
  warn "Could not fetch repository pull requests."
  printf '[]\n' > "$RAW_DIR/repository-prs.json"
fi

if ! gh label list -R "$REPOSITORY" --limit 1000 --json name,color,description \
  > "$RAW_DIR/repository-labels.json" 2>>"$ERROR_LOG"; then
  warn "Could not fetch repository labels."
  printf '[]\n' > "$RAW_DIR/repository-labels.json"
fi

if ! gh api --paginate "repos/$REPOSITORY/milestones?state=all&per_page=100" \
  --jq '.[]' 2>>"$ERROR_LOG" | jq -s '.' > "$RAW_DIR/repository-milestones.json"; then
  warn "Could not fetch repository milestones."
  printf '[]\n' > "$RAW_DIR/repository-milestones.json"
fi

step "5. Normalize project items"

cat > "$RAW_DIR/analyze-project.mjs" <<'NODE'
import fs from 'node:fs';
import path from 'node:path';

const mode = process.argv[2];
const rawDir = process.env.RAW_DIR;
const outDir = process.env.OUT_DIR;
const repository = process.env.REPOSITORY;
const projectNumber = Number(process.env.PROJECT_NUMBER);
const ownerLogin = process.env.OWNER_LOGIN;
const staleDays = Number(process.env.STALE_DAYS || 30);
const generic = process.env.GENERIC === '1';
const canonicalEnabled = process.env.USE_CANONICAL === '1';
const canonicalFile = process.env.CANONICAL_FILE || '';
const planningExportFile = process.env.PLANNING_EXPORT_FILE || '';
const configuredCurrentWave = process.env.CURRENT_WAVE || '';

const readJson = (file, fallback) => {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (error) {
    console.warn(
      `Lecture JSON impossible pour ${file}: ${error instanceof Error ? error.message : String(error)}`,
    );
    return fallback;
  }
};

const writeJson = (file, value) => {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};

const normalizeKey = (value) => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '');

const scalarText = (value) => {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(scalarText).filter(Boolean).join(', ');
  if (typeof value === 'object') {
    return value.name ?? value.title ?? value.login ?? value.text ?? value.date ??
      (value.number != null ? String(value.number) : null);
  }
  return String(value);
};

const arrayNames = (value) => {
  if (value == null) return [];
  const values = Array.isArray(value) ? value : [value];
  return values.map((entry) => {
    if (entry == null) return null;
    if (typeof entry === 'string') return entry;
    return entry.login ?? entry.name ?? entry.title ?? String(entry);
  }).filter(Boolean);
};

const fieldValue = (item, fieldName) => {
  const target = normalizeKey(fieldName);
  for (const [key, value] of Object.entries(item ?? {})) {
    if (normalizeKey(key) === target) return value;
  }
  return null;
};

const parseContentUrl = (url) => {
  const match = String(url ?? '').match(/^https:\/\/github\.com\/([^/]+\/[^/]+)\/(issues|pull)\/(\d+)/);
  if (!match) return {};
  return {
    repository: match[1],
    type: match[2] === 'issues' ? 'Issue' : 'PullRequest',
    number: Number(match[3]),
  };
};

const rawItemsPayload = readJson(path.join(rawDir, 'items.json'), { items: [] });
const rawItems = rawItemsPayload.items ?? [];
const repositoryIssues = readJson(path.join(rawDir, 'repository-issues.json'), []);
const repositoryPrs = readJson(path.join(rawDir, 'repository-prs.json'), []);
const issueByUrl = new Map(repositoryIssues.map((issue) => [issue.url, issue]));
const prByUrl = new Map(repositoryPrs.map((pr) => [pr.url, pr]));

const normalizedItems = rawItems.map((item) => {
  const content = item.content ?? {};
  const parsed = parseContentUrl(content.url ?? item.url);
  const url = content.url ?? item.url ?? null;
  const relatedIssue = issueByUrl.get(url);
  const relatedPr = prByUrl.get(url);
  const related = relatedIssue ?? relatedPr ?? {};
  const type = content.type ?? item.type ?? parsed.type ?? 'Unknown';
  const title = content.title ?? item.title ?? related.title ?? '';
  const number = content.number ?? item.number ?? parsed.number ?? null;
  const itemRepository = content.repository ?? item.repository ?? parsed.repository ?? null;

  return {
    itemId: item.id ?? null,
    type,
    title,
    url,
    number,
    repository: itemRepository,
    state: content.state ?? item.state ?? related.state ?? null,
    stateReason: related.stateReason ?? null,
    createdAt: related.createdAt ?? null,
    updatedAt: related.updatedAt ?? null,
    closedAt: related.closedAt ?? related.mergedAt ?? null,
    status: scalarText(fieldValue(item, 'Status')),
    priority: scalarText(fieldValue(item, 'Priority')),
    area: scalarText(fieldValue(item, 'Area')),
    effort: scalarText(fieldValue(item, 'Effort')),
    launchBlocker: scalarText(fieldValue(item, 'Launch blocker')),
    lane: scalarText(fieldValue(item, 'Lane')),
    surface: scalarText(fieldValue(item, 'Surface')),
    coupling: scalarText(fieldValue(item, 'Coupling')),
    wave: scalarText(fieldValue(item, 'Wave')),
    assignees: arrayNames(item.assignees ?? content.assignees ?? related.assignees),
    labels: arrayNames(item.labels ?? content.labels ?? related.labels),
    milestone: scalarText(item.milestone ?? content.milestone ?? related.milestone),
    linkedPullRequests: arrayNames(item['linked pull requests'] ?? item.linkedPullRequests),
    rawKeys: Object.keys(item).sort(),
  };
});

if (mode === 'normalize') {
  writeJson(path.join(outDir, 'items-normalized.json'), normalizedItems);
  process.exit(0);
}

const graphPayload = readJson(path.join(rawDir, 'project-graphql.json'), { data: {} });
const projectGraph = graphPayload?.data?.user?.projectV2 ??
  graphPayload?.data?.organization?.projectV2 ?? null;
const cliProject = readJson(path.join(rawDir, 'project.json'), {});
const cliFieldsPayload = readJson(path.join(rawDir, 'fields-cli.json'), { fields: [] });
const issueDetails = readJson(path.join(outDir, 'deep', 'issue-details.json'), []);
const prDetails = readJson(path.join(outDir, 'deep', 'pr-details.json'), []);
const labels = readJson(path.join(rawDir, 'repository-labels.json'), []);
const milestones = readJson(path.join(rawDir, 'repository-milestones.json'), []);

const countBy = (items, getter, unset = '(unset)') => {
  const counts = new Map();
  for (const item of items) {
    const raw = getter(item);
    const values = Array.isArray(raw) ? raw : [raw];
    const effective = values.filter((value) => value != null && String(value).trim() !== '');
    const list = effective.length > 0 ? effective : [unset];
    for (const value of list) {
      const key = String(value);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
};

const groupDuplicates = (items, getter) => {
  const groups = new Map();
  for (const item of items) {
    const key = getter(item);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return [...groups.entries()]
    .filter(([, values]) => values.length > 1)
    .map(([key, values]) => ({ key, count: values.length, items: values }));
};

const isDone = (status) => normalizeKey(status) === 'done';
const isOpen = (state) => normalizeKey(state) === 'open';
const isClosed = (state) => ['closed', 'merged'].includes(normalizeKey(state));
const planningItems = normalizedItems.filter((item) => ['Issue', 'DraftIssue'].includes(item.type));
const activePlanningItems = planningItems.filter((item) => !isClosed(item.state) || item.type === 'DraftIssue');
const projectUrls = new Set(normalizedItems.map((item) => item.url).filter(Boolean));
const now = Date.now();
const staleCutoff = now - staleDays * 24 * 60 * 60 * 1000;

const itemFieldMapping = {
  Status: 'status',
  Priority: 'priority',
  Area: 'area',
  Effort: 'effort',
  'Launch blocker': 'launchBlocker',
  Lane: 'lane',
  Surface: 'surface',
  Coupling: 'coupling',
  Wave: 'wave',
  Assignee: 'assignees',
  Milestone: 'milestone',
};

const statusOptions = ['Todo', 'In Progress', 'Done'];
const priorityOptions = ['critical', 'high', 'medium', 'low'];
const waveOptions = [
  'Wave 0 - Cadrage',
  'Wave 1 - Socle',
  'Wave 2 - Acces',
  'Wave 3A - Site public',
  'Wave 3B - Parcours participant',
  'Wave 4 - Qualite',
  'Wave 5 - Release',
  'Wave 6 - Monetisation',
  'Wave 7 - Apprentissage',
  'Wave 8 - Release V1.1',
];
const requiredProjectFields = generic ? ['Status'] : [
  'Status',
  'Priority',
  'Effort',
  'Launch blocker',
  'Lane',
  'Surface',
  'Coupling',
  'Wave',
];
const requiredFieldUniverse = generic ? ['Status'] : [
  'Status',
  'Priority',
  'Lane',
  'Surface',
  'Coupling',
  'Wave',
  'Effort',
  'Launch blocker',
  'Assignee',
  'Milestone',
];
const effortPointMap = new Map([
  ['xs', '1'],
  ['s', '2'],
  ['m', '3'],
  ['l', '5'],
  ['xl', '8'],
]);
const priorityValueMap = new Map([
  ['p0', 'critical'],
  ['p1', 'high'],
  ['p2', 'medium'],
  ['p3', 'low'],
]);
const isTodo = (status) => normalizeKey(status) === 'todo';
const isInProgress = (status) => normalizeKey(status) === 'inprogress';
const isEpicItem = (item) =>
  /^\[EPIC\]\[[A-Z0-9-]+\]/.test(item.title) ||
  /^\[EPIC\]\s+\[[A-Z0-9-]+\]/.test(item.title);
const isTaskItem = (item) =>
  ['Issue', 'DraftIssue'].includes(item.type) && !isEpicItem(item);
const waveRank = (wave) => {
  const rank = waveOptions.findIndex((option) => normalizeKey(option) === normalizeKey(wave));
  return rank === -1 ? Number.MAX_SAFE_INTEGER : rank;
};
const firstWaveByOrder = (items) => items
  .map((item) => item.wave)
  .filter((wave) => wave != null && String(wave).trim() !== '')
  .sort((left, right) => waveRank(left) - waveRank(right) || String(left).localeCompare(String(right)))[0] ?? '';
const inferredCurrentWave = configuredCurrentWave ||
  firstWaveByOrder(planningItems.filter((item) => isTaskItem(item) && isInProgress(item.status))) ||
  firstWaveByOrder(planningItems.filter((item) => isTaskItem(item) && !isDone(item.status)));
const currentWaveRank = waveRank(inferredCurrentWave);
const isCurrentWave = (item) =>
  inferredCurrentWave && normalizeKey(item.wave) === normalizeKey(inferredCurrentWave);
const isFutureWaveItem = (item) =>
  isTodo(item.status) &&
  currentWaveRank !== Number.MAX_SAFE_INTEGER &&
  waveRank(item.wave) > currentWaveRank;
const requiredFieldsForItem = (item) => {
  if (generic) return ['Status'];
  if (isDone(item.status)) return ['Status'];
  if (isEpicItem(item)) return ['Status', 'Priority', 'Lane', 'Wave'];
  if (isInProgress(item.status)) {
    return [
      'Status',
      'Priority',
      'Lane',
      'Surface',
      'Coupling',
      'Wave',
      'Effort',
      'Launch blocker',
      'Assignee',
      'Milestone',
    ];
  }
  if (isTodo(item.status) && isCurrentWave(item)) {
    return [
      'Status',
      'Priority',
      'Lane',
      'Surface',
      'Coupling',
      'Wave',
      'Effort',
      'Launch blocker',
    ];
  }
  return ['Status', 'Priority', 'Lane', 'Surface', 'Wave'];
};
const itemContractCategory = (item) => {
  if (isDone(item.status)) return 'Done item';
  if (isEpicItem(item)) return 'Epic';
  if (isInProgress(item.status)) return 'In Progress task';
  if (isTodo(item.status) && isCurrentWave(item)) return 'Todo task in current wave';
  return 'Future-wave task';
};
const hasFieldValue = (item, field) => {
  if (field === 'Assignee') return item.assignees.length > 0;
  if (field === 'Milestone') return item.milestone != null && String(item.milestone).trim() !== '';
  const key = itemFieldMapping[field];
  return key && item[key] != null && String(item[key]).trim() !== '';
};
const numericEffort = (value) => {
  const number = Number.parseFloat(String(value ?? '').replace(',', '.'));
  return Number.isFinite(number) ? number : 0;
};
const hasNumericEffort = (value) =>
  Number.isFinite(Number.parseFloat(String(value ?? '').replace(',', '.')));
const isLaunchBlockerValue = (value) =>
  ['yes', 'true', '1', 'launchblocker'].includes(normalizeKey(value));

const missingFields = [];
for (const item of planningItems) {
  const requiredFields = requiredFieldsForItem(item);
  const missing = requiredFields.filter((field) => !hasFieldValue(item, field));
  if (missing.length > 0) {
    missingFields.push({
      ...item,
      contractCategory: itemContractCategory(item),
      missing,
      requiredFields,
    });
  }
}

const invalidRequiredEffortValues = planningItems.filter((item) =>
  requiredFieldsForItem(item).includes('Effort') &&
  hasFieldValue(item, 'Effort') &&
  !hasNumericEffort(item.effort),
);

const stateStatusMismatches = normalizedItems.filter((item) =>
  (isClosed(item.state) && !isDone(item.status)) ||
  (isOpen(item.state) && isDone(item.status)),
);
const duplicateUrls = groupDuplicates(normalizedItems, (item) => item.url);
const duplicateTitles = groupDuplicates(normalizedItems, (item) => item.title);
const externalItems = normalizedItems.filter((item) => item.repository && item.repository !== repository);
const openRepoIssuesNotInProject = repositoryIssues.filter((issue) =>
  issue.state === 'OPEN' && !projectUrls.has(issue.url),
);
const staleOpenItems = normalizedItems.filter((item) =>
  isOpen(item.state) && !isDone(item.status) && item.updatedAt &&
  !isFutureWaveItem(item) &&
  Date.parse(item.updatedAt) < staleCutoff,
);
const unassignedInProgressItems = planningItems.filter((item) =>
  !isFutureWaveItem(item) && isTaskItem(item) &&
  isInProgress(item.status) && item.assignees.length === 0,
);
const unassignedCriticalItems = unassignedInProgressItems.filter((item) =>
  ['critical', 'high'].includes(normalizeKey(item.priority)),
);
const launchBlockers = normalizedItems.filter((item) =>
  isLaunchBlockerValue(item.launchBlocker) && !isDone(item.status),
);
const pullRequestProjectItems = normalizedItems.filter((item) => item.type === 'PullRequest');
const canonicalLabelName = (label) => String(label ?? '')
  .trim()
  .replace(/\s*:\s*/g, ': ');
const labelName = (label) => typeof label === 'string' ? label : label?.name;
const labelNamespace = (label) => canonicalLabelName(label).split(':')[0];
const retiredLabelNamespaces = new Set(['status', 'priority']);
const retiredLabelReplacement = (label) => {
  const namespace = labelNamespace(label);
  const fieldName = namespace.charAt(0).toUpperCase() + namespace.slice(1);
  return `GitHub Project ${fieldName} field`;
};
const retiredLabels = labels
  .map((label) => labelName(label))
  .filter(Boolean)
  .filter((name) => retiredLabelNamespaces.has(normalizeKey(labelNamespace(name))))
  .sort((left, right) => left.localeCompare(right))
  .map((name) => ({
    name,
    replacement: retiredLabelReplacement(name),
  }));
const labelFormatDrift = groupDuplicates(
  labels
    .map((label) => labelName(label))
    .filter(Boolean)
    .map((name) => ({ name, canonical: canonicalLabelName(name) })),
  (label) => normalizeKey(label.canonical),
)
  .map((group) => ({
    canonical: group.items[0].canonical,
    labels: [...new Set(group.items.map((label) => label.name))].sort((left, right) => left.localeCompare(right)),
  }))
  .filter((group) => group.labels.length > 1)
  .sort((left, right) => left.canonical.localeCompare(right.canonical));
const canonicalTitlePattern = /^(?:\[(?:EPIC|TASK|BUG|DEFECT|ALERT)\]\[[A-Z0-9-]+\](?:\[[A-Za-z0-9-]+\])*|\[(?:OPS|DOCS)\])\s+/;
const nonCanonicalTitles = generic ? [] : planningItems.filter((item) =>
  item.type === 'Issue' && !canonicalTitlePattern.test(item.title),
);

const graphFields = projectGraph?.fields?.nodes ?? [];
const cliFields = cliFieldsPayload.fields ?? [];
const fieldNames = graphFields.map((field) => field?.name).filter(Boolean);
if (fieldNames.length === 0) {
  for (const field of cliFields) if (field?.name) fieldNames.push(field.name);
}
const missingExpectedFields = requiredProjectFields.filter((expected) =>
  !fieldNames.some((actual) => normalizeKey(actual) === normalizeKey(expected)),
);

const expectedViews = generic ? [] : [
  'Board',
  'Master backlog',
  'Lane A - Web public',
  'Lane B - Platform & participant',
  'Shared handoff',
  'Ready now',
  'Release critical',
];
const views = projectGraph?.views?.nodes ?? [];
const missingExpectedViews = expectedViews.filter((expected) =>
  !views.some((view) => normalizeKey(view.name) === normalizeKey(expected)),
);

const expectedOptions = generic ? {} : {
  Status: statusOptions,
  Priority: priorityOptions,
  Lane: ['Lane A - Web public', 'Lane B - Platform & participant', 'Shared handoff'],
  Surface: ['docs', 'shared', 'api', 'web', 'mobile', 'qa', 'ops'],
  Coupling: ['independent', 'handoff', 'paired', 'portfolio'],
  Wave: waveOptions,
};
const optionDrift = [];
for (const [fieldName, expected] of Object.entries(expectedOptions)) {
  const field = graphFields.find((candidate) => normalizeKey(candidate?.name) === normalizeKey(fieldName));
  if (!field?.options) continue;
  const actual = field.options.map((option) => option.name);
  const missing = expected.filter((value) => !actual.some((item) => normalizeKey(item) === normalizeKey(value)));
  const extra = actual.filter((value) => !expected.some((item) => normalizeKey(item) === normalizeKey(value)));
  if (missing.length || extra.length) optionDrift.push({ field: fieldName, missing, extra, actual });
}

const fieldCompleteness = requiredFieldUniverse.map((field) => {
  const eligibleItems = planningItems.filter((item) => requiredFieldsForItem(item).includes(field));
  const filled = eligibleItems.filter((item) => hasFieldValue(item, field)).length;
  return {
    field,
    required: eligibleItems.length,
    filled,
    missing: eligibleItems.length - filled,
    percent: eligibleItems.length === 0 ? 100 : Math.round((filled / eligibleItems.length) * 1000) / 10,
  };
});

const effortSummary = {
  total: normalizedItems.reduce((sum, item) => sum + numericEffort(item.effort), 0),
  byStatus: countBy(normalizedItems, (item) => item.status).map((entry) => ({
    ...entry,
    effort: normalizedItems
      .filter((item) => String(item.status ?? '(unset)') === entry.value)
      .reduce((sum, item) => sum + numericEffort(item.effort), 0),
  })),
  byLane: countBy(normalizedItems, (item) => item.lane).map((entry) => ({
    ...entry,
    effort: normalizedItems
      .filter((item) => String(item.lane ?? '(unset)') === entry.value)
      .reduce((sum, item) => sum + numericEffort(item.effort), 0),
  })),
};

const issueDetailByUrl = new Map(issueDetails.map((issue) => [issue.url, issue]));
const openBlockedItems = [];
const dependenciesMissingFromProject = [];
const parentsMissingFromProject = [];
const subIssuesMissingFromProject = [];
for (const item of normalizedItems) {
  const detail = issueDetailByUrl.get(item.url);
  if (!detail) continue;
  const blockedBy = detail.blockedBy ?? [];
  const openBlockers = blockedBy.filter((blocker) => blocker.state !== 'CLOSED');
  if (openBlockers.length > 0) {
    openBlockedItems.push({ item, blockers: openBlockers });
  }
  for (const blocker of blockedBy) {
    if (blocker.url && !projectUrls.has(blocker.url)) {
      dependenciesMissingFromProject.push({ item, dependency: blocker });
    }
  }
  if (detail.parent?.url && !projectUrls.has(detail.parent.url)) {
    parentsMissingFromProject.push({ item, parent: detail.parent });
  }
  for (const subIssue of detail.subIssues ?? []) {
    if (subIssue.url && !projectUrls.has(subIssue.url)) {
      subIssuesMissingFromProject.push({ item, subIssue });
    }
  }
}

const planningCsvHeaders = [
  'Issue Number',
  'Issue URL',
  'Title',
  'Priority',
  'Lane',
  'Surface',
  'Coupling',
  'Wave',
  'Effort',
];
const csvEscape = (value) => {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
};
const exportablePlanningItems = planningItems
  .filter((item) => item.type === 'Issue' && item.number != null && item.url)
  .sort((left, right) => Number(left.number) - Number(right.number) || left.title.localeCompare(right.title));
const writePlanningCsv = (filePath, items) => {
  const resolvedPath = path.resolve(filePath);
  fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
  const rows = [
    planningCsvHeaders.map(csvEscape).join(','),
    ...items.map((item) => [
      item.number,
      item.url,
      item.title,
      item.priority,
      item.lane,
      item.surface,
      item.coupling,
      item.wave,
      item.effort,
    ].map(csvEscape).join(',')),
  ];
  fs.writeFileSync(resolvedPath, `${rows.join('\n')}\n`, 'utf8');
};
const reportPlanningExportFile = path.join(outDir, 'github_project_planning_current.csv');
writePlanningCsv(reportPlanningExportFile, exportablePlanningItems);
if (planningExportFile) {
  writePlanningCsv(planningExportFile, exportablePlanningItems);
}

const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n') {
      row.push(cell.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  if (cell.length || row.length) {
    row.push(cell.replace(/\r$/, ''));
    rows.push(row);
  }
  return rows.filter((values) => values.some((value) => value.trim() !== ''));
};

const canonicalComparison = {
  enabled: false,
  file: canonicalFile,
  generatedExport: reportPlanningExportFile,
  rowCount: 0,
  comparedRows: 0,
  missingInProject: [],
  extraInProject: [],
  duplicateCanonicalKeys: [],
  duplicateCanonicalTitles: [],
  fallbackMatches: [],
  fieldMismatches: [],
  error: null,
};

if (canonicalEnabled && canonicalFile && fs.existsSync(canonicalFile)) {
  try {
    const rows = parseCsv(fs.readFileSync(canonicalFile, 'utf8'));
    const headers = rows.shift() ?? [];
    const records = rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])));
    const getCsv = (record, name) => {
      const target = normalizeKey(name);
      const entry = Object.entries(record).find(([key]) => normalizeKey(key) === target);
      return entry?.[1] ?? '';
    };
    const normalizeIssueUrl = (value) => {
      const text = String(value ?? '').trim();
      if (!text) return '';
      const match = text.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)(?:[/?#].*)?$/i);
      if (!match) return text;
      return `https://github.com/${match[1].toLowerCase()}/${match[2].toLowerCase()}/issues/${Number(match[3])}`;
    };
    const normalizeIssueNumber = (value) => {
      const text = String(value ?? '').trim();
      if (!/^\d+$/.test(text)) return '';
      return String(Number(text));
    };
    const fallbackTitleKey = (value) => normalizeKey(value);
    const canonicalIdentity = (record) => {
      const issueUrl = normalizeIssueUrl(getCsv(record, 'Issue URL'));
      if (issueUrl) return { kind: 'url', key: issueUrl, label: issueUrl };
      const issueNumber = normalizeIssueNumber(getCsv(record, 'Issue Number'));
      if (issueNumber) return { kind: 'number', key: issueNumber, label: `#${issueNumber}` };
      const title = getCsv(record, 'Title').trim();
      if (title) return { kind: 'fallbackTitle', key: fallbackTitleKey(title), label: title };
      return { kind: 'missing', key: '', label: '' };
    };
    const itemIdentity = (item) => {
      const issueUrl = normalizeIssueUrl(item.url);
      if (issueUrl) return `url:${issueUrl}`;
      if (item.number != null) return `number:${Number(item.number)}`;
      return `fallbackTitle:${fallbackTitleKey(item.title)}`;
    };
    const issueItems = planningItems.filter((item) => item.type === 'Issue');
    const itemByUrl = new Map();
    const itemByNumber = new Map();
    const itemByFallbackTitle = new Map();
    for (const item of planningItems) {
      const issueUrl = normalizeIssueUrl(item.url);
      if (issueUrl && !itemByUrl.has(issueUrl)) itemByUrl.set(issueUrl, item);
      if (item.number != null && !itemByNumber.has(String(Number(item.number)))) {
        itemByNumber.set(String(Number(item.number)), item);
      }
      const titleKey = fallbackTitleKey(item.title);
      if (titleKey && !itemByFallbackTitle.has(titleKey)) itemByFallbackTitle.set(titleKey, item);
    }
    const resolveCanonicalRecord = (record) => {
      const issueUrl = normalizeIssueUrl(getCsv(record, 'Issue URL'));
      if (issueUrl && itemByUrl.has(issueUrl)) return { item: itemByUrl.get(issueUrl), method: 'Issue URL' };
      const issueNumber = normalizeIssueNumber(getCsv(record, 'Issue Number'));
      if (issueNumber && itemByNumber.has(issueNumber)) return { item: itemByNumber.get(issueNumber), method: 'Issue Number' };
      const title = getCsv(record, 'Title').trim();
      const titleKey = fallbackTitleKey(title);
      if (titleKey && itemByFallbackTitle.has(titleKey)) {
        return { item: itemByFallbackTitle.get(titleKey), method: 'normalized Title fallback' };
      }
      return { item: null, method: null };
    };
    const canonicalIdentityGroups = new Map();
    for (const record of records) {
      const identity = canonicalIdentity(record);
      if (!identity.key) continue;
      const groupKey = `${identity.kind}:${identity.key}`;
      if (!canonicalIdentityGroups.has(groupKey)) canonicalIdentityGroups.set(groupKey, { ...identity, records: [] });
      canonicalIdentityGroups.get(groupKey).records.push(record);
    }
    const normalizeCanonicalFieldValue = (field, value) => {
      const normalizedValue = normalizeKey(value);
      if (field === 'Priority') {
        return priorityValueMap.get(normalizedValue) ?? value;
      }
      if (field === 'Effort') return effortPointMap.get(normalizedValue) ?? value;
      return value;
    };
    canonicalComparison.enabled = true;
    canonicalComparison.rowCount = records.length;
    canonicalComparison.duplicateCanonicalKeys = [...canonicalIdentityGroups.values()]
      .filter((group) => group.kind !== 'fallbackTitle' && group.records.length > 1)
      .map((group) => ({ key: group.label, count: group.records.length }));
    canonicalComparison.duplicateCanonicalTitles = [...canonicalIdentityGroups.values()]
      .filter((group) => group.kind === 'fallbackTitle' && group.records.length > 1)
      .map((group) => ({ title: group.label, count: group.records.length }));
    const matchedItemIdentities = new Set();
    const fieldsToCompare = ['Priority', 'Lane', 'Surface', 'Coupling', 'Wave', 'Effort'];
    for (const record of records) {
      const identity = canonicalIdentity(record);
      const resolved = resolveCanonicalRecord(record);
      const item = resolved.item;
      const title = getCsv(record, 'Title').trim();
      const displayTitle = title || identity.label;
      if (!item) {
        canonicalComparison.missingInProject.push({
          key: identity.label,
          issueNumber: getCsv(record, 'Issue Number').trim(),
          issueUrl: getCsv(record, 'Issue URL').trim(),
          title: displayTitle,
        });
        continue;
      }
      canonicalComparison.comparedRows += 1;
      matchedItemIdentities.add(itemIdentity(item));
      if (resolved.method === 'normalized Title fallback') {
        canonicalComparison.fallbackMatches.push({
          title: displayTitle,
          url: item.url,
        });
      }
      for (const field of fieldsToCompare) {
        const expected = normalizeCanonicalFieldValue(field, getCsv(record, field).trim());
        if (!expected) continue;
        const actual = item[itemFieldMapping[field]] ?? '';
        if (normalizeKey(actual) !== normalizeKey(expected)) {
          canonicalComparison.fieldMismatches.push({
            title: item.title,
            field,
            expected,
            actual,
            url: item.url,
            match: resolved.method,
          });
        }
      }
    }
    canonicalComparison.extraInProject = issueItems
      .filter((item) => !matchedItemIdentities.has(itemIdentity(item)))
      .map((item) => ({ title: item.title, url: item.url, number: item.number }));
  } catch (error) {
    canonicalComparison.error = error instanceof Error ? error.message : String(error);
    console.warn(`Comparaison CSV canonique impossible: ${canonicalComparison.error}`);
  }
} else if (canonicalEnabled && canonicalFile) {
  canonicalComparison.error = `Canonical planning file not found: ${canonicalFile}`;
}

writeJson(path.join(outDir, 'canonical-comparison.json'), canonicalComparison);

const breakdowns = {
  type: countBy(normalizedItems, (item) => item.type),
  repository: countBy(normalizedItems, (item) => item.repository),
  state: countBy(normalizedItems, (item) => item.state),
  status: countBy(normalizedItems, (item) => item.status),
  priority: countBy(normalizedItems, (item) => item.priority),
  area: countBy(normalizedItems, (item) => item.area),
  effort: countBy(normalizedItems, (item) => item.effort),
  launchBlocker: countBy(normalizedItems, (item) => item.launchBlocker),
  lane: countBy(normalizedItems, (item) => item.lane),
  surface: countBy(normalizedItems, (item) => item.surface),
  coupling: countBy(normalizedItems, (item) => item.coupling),
  wave: countBy(normalizedItems, (item) => item.wave),
  assignees: countBy(normalizedItems, (item) => item.assignees),
  labels: countBy(normalizedItems, (item) => item.labels),
  milestone: countBy(normalizedItems, (item) => item.milestone),
};

const workflows = projectGraph?.workflows?.nodes ?? [];
const statusUpdates = projectGraph?.statusUpdates?.nodes ?? [];
const linkedRepositories = projectGraph?.repositories?.nodes ?? [];
const disabledWorkflows = workflows.filter((workflow) => !workflow.enabled);

const findingGroups = {
  missingExpectedFields,
  missingExpectedViews,
  optionDrift,
  missingFields,
  stateStatusMismatches,
  duplicateUrls,
  duplicateTitles,
  externalItems,
  openRepoIssuesNotInProject,
  staleOpenItems,
  unassignedInProgressItems,
  unassignedCriticalItems,
  invalidRequiredEffortValues,
  launchBlockers,
  pullRequestProjectItems,
  nonCanonicalTitles,
  retiredLabels,
  labelFormatDrift,
  openBlockedItems,
  dependenciesMissingFromProject,
  parentsMissingFromProject,
  subIssuesMissingFromProject,
  canonicalMissingInProject: canonicalComparison.missingInProject,
  canonicalFieldMismatches: canonicalComparison.fieldMismatches,
};
const findingCount = Object.values(findingGroups).reduce((sum, group) => sum + group.length, 0);
const canonicalDriftCount = canonicalComparison.error ? 1 : (
  canonicalComparison.missingInProject.length +
  canonicalComparison.extraInProject.length +
  canonicalComparison.fieldMismatches.length +
  canonicalComparison.duplicateCanonicalKeys.length +
  canonicalComparison.duplicateCanonicalTitles.length
);
const blockingCount = missingExpectedFields.length + missingExpectedViews.length +
  stateStatusMismatches.length + duplicateUrls.length +
  canonicalComparison.missingInProject.length + canonicalComparison.fieldMismatches.length;

const analysis = {
  generatedAt: new Date().toISOString(),
  owner: ownerLogin,
  projectNumber,
  repository,
  currentWave: inferredCurrentWave,
  project: projectGraph ?? cliProject,
  linkedRepositories,
  views,
  workflows,
  disabledWorkflows,
  statusUpdates,
  fieldDefinitions: graphFields.length ? graphFields : cliFields,
  repositoryPlanning: {
    issueCount: repositoryIssues.length,
    openIssueCount: repositoryIssues.filter((issue) => issue.state === 'OPEN').length,
    pullRequestCount: repositoryPrs.length,
    openPullRequestCount: repositoryPrs.filter((pr) => pr.state === 'OPEN').length,
    labelCount: labels.length,
    milestoneCount: milestones.length,
  },
  inventory: {
    totalItems: normalizedItems.length,
    planningItems: planningItems.length,
    activePlanningItems: activePlanningItems.length,
    deepIssueDetails: issueDetails.length,
    deepPullRequestDetails: prDetails.length,
  },
  breakdowns,
  fieldCompleteness,
  effortSummary,
  findings: findingGroups,
  canonicalComparison,
  summary: {
    totalFindings: findingCount,
    canonicalDriftFindings: canonicalDriftCount,
    blockingFindings: blockingCount,
    warningFindings: Math.max(0, findingCount - blockingCount),
  },
};

writeJson(path.join(outDir, 'analysis.json'), analysis);

const escapeMd = (value) => String(value ?? '')
  .replaceAll('|', '\\|')
  .replaceAll('\n', ' ');
const linkTitle = (item) => item.url ? `[${escapeMd(item.title)}](${item.url})` : escapeMd(item.title);
const table = (headers, rows) => {
  if (!rows.length) return '_None._\n';
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.map(escapeMd).join(' | ')} |`),
    '',
  ].join('\n');
};
const breakdownTable = (entries) => table(['Value', 'Count'], entries.map((entry) => [entry.value, entry.count]));
const top = (values, limit = 50) => values.slice(0, limit);

const report = [];
report.push(`# GitHub Project planning awareness: ${escapeMd(projectGraph?.title ?? cliProject.title ?? `Project ${projectNumber}`)}`);
report.push('');
report.push(`- Generated: ${analysis.generatedAt}`);
report.push(`- Owner: \`${ownerLogin}\``);
report.push(`- Project: \`${projectNumber}\``);
report.push(`- Repository: \`${repository}\``);
report.push(`- Current wave for Todo refinement: ${inferredCurrentWave ? `\`${escapeMd(inferredCurrentWave)}\`` : '_not resolved_'}`);
if (projectGraph?.url ?? cliProject.url) report.push(`- Project URL: ${projectGraph?.url ?? cliProject.url}`);
report.push(`- Deep dependency scan: ${issueDetails.length || prDetails.length ? 'enabled' : 'disabled'}`);
report.push(`- Stale threshold: ${staleDays} days`);
report.push('');

report.push('## Executive summary');
report.push('');
report.push(table(['Metric', 'Value'], [
  ['Project items', normalizedItems.length],
  ['Planning issues/drafts', planningItems.length],
  ['Active planning issues/drafts', activePlanningItems.length],
  ['Repository open issues', analysis.repositoryPlanning.openIssueCount],
  ['Repository open pull requests', analysis.repositoryPlanning.openPullRequestCount],
  ['Total findings', findingCount],
  ['Blocking findings', blockingCount],
  ['Warning findings', Math.max(0, findingCount - blockingCount)],
  ['Total numeric effort', effortSummary.total],
]));

report.push('## Project status updates');
report.push('');
report.push(table(['Status', 'Start', 'Target', 'Updated', 'Author', 'Body'], statusUpdates.map((update) => [
  update.status ?? '', update.startDate ?? '', update.targetDate ?? '', update.updatedAt ?? '',
  update.creator?.login ?? '', update.body ?? '',
])));

report.push('## Saved views');
report.push('');
report.push(table(['#', 'Name', 'Layout', 'Filter', 'Group by', 'Vertical group', 'Sort'], views.map((view) => [
  view.number,
  view.name,
  view.layout,
  view.filter ?? '',
  (view.groupByFields?.nodes ?? []).map((field) => field.name).filter(Boolean).join(', '),
  (view.verticalGroupByFields?.nodes ?? []).map((field) => field.name).filter(Boolean).join(', '),
  (view.sortByFields?.nodes ?? []).map((sort) => `${sort.field?.name ?? '?'} ${sort.direction}`).join(', '),
])));

report.push('## Project workflows');
report.push('');
report.push(table(['#', 'Name', 'Enabled', 'Updated'], workflows.map((workflow) => [
  workflow.number, workflow.name, workflow.enabled ? 'yes' : 'no', workflow.updatedAt ?? '',
])));

report.push('## Field definitions');
report.push('');
report.push(table(['Field', 'Type', 'Options / iterations'], (graphFields.length ? graphFields : cliFields).map((field) => [
  field.name ?? '',
  field.dataType ?? field.type ?? field.__typename ?? '',
  field.options?.map((option) => option.name).join(', ') ??
    field.configuration?.iterations?.map((iteration) => iteration.title).join(', ') ?? '',
])));

report.push('## Field completeness');
report.push('');
report.push(table(['Field', 'Required items', 'Filled', 'Missing', 'Complete'], fieldCompleteness.map((entry) => [
  entry.field, entry.required, entry.filled, entry.missing, `${entry.percent}%`,
])));

for (const [name, entries] of Object.entries({
  Status: breakdowns.status,
  Priority: breakdowns.priority,
  Lane: breakdowns.lane,
  Surface: breakdowns.surface,
  Coupling: breakdowns.coupling,
  Wave: breakdowns.wave,
  Area: breakdowns.area,
  'Launch blocker': breakdowns.launchBlocker,
  Assignees: breakdowns.assignees,
  Labels: breakdowns.labels,
  Milestones: breakdowns.milestone,
  Repositories: breakdowns.repository,
  Types: breakdowns.type,
})) {
  report.push(`## Breakdown: ${name}`);
  report.push('');
  report.push(breakdownTable(entries));
}

report.push('## Effort');
report.push('');
report.push(`Total numeric effort: **${effortSummary.total}**`);
report.push('');
report.push('### By status');
report.push('');
report.push(table(['Status', 'Items', 'Effort'], effortSummary.byStatus.map((entry) => [entry.value, entry.count, entry.effort])));
report.push('### By lane');
report.push('');
report.push(table(['Lane', 'Items', 'Effort'], effortSummary.byLane.map((entry) => [entry.value, entry.count, entry.effort])));

report.push('## Planning findings');
report.push('');
report.push(table(['Finding', 'Count'], Object.entries(findingGroups).map(([name, values]) => [name, values.length])));

report.push('### Missing required field values');
report.push('');
report.push(table(['Item', 'Category', 'Missing fields', 'Status', 'Lane', 'Wave'], top(missingFields).map((item) => [
  linkTitle(item), item.contractCategory ?? '', item.missing.join(', '), item.status ?? '', item.lane ?? '', item.wave ?? '',
])));

report.push('### State / project-status mismatches');
report.push('');
report.push(table(['Item', 'Repository state', 'Project status'], top(stateStatusMismatches).map((item) => [
  linkTitle(item), item.state ?? '', item.status ?? '',
])));

report.push('### Open repository issues missing from the project');
report.push('');
report.push(table(['Issue', 'Updated', 'Assignees'], top(openRepoIssuesNotInProject).map((issue) => [
  `[${escapeMd(issue.title)}](${issue.url})`, issue.updatedAt ?? '', arrayNames(issue.assignees).join(', '),
])));

report.push('### Stale open items');
report.push('');
report.push(table(['Item', 'Updated', 'Status', 'Assignees'], top(staleOpenItems).map((item) => [
  linkTitle(item), item.updatedAt ?? '', item.status ?? '', item.assignees.join(', '),
])));

report.push('### Unassigned In Progress critical/high tasks');
report.push('');
report.push(table(['Item', 'Priority', 'Status', 'Lane'], top(unassignedCriticalItems).map((item) => [
  linkTitle(item), item.priority ?? '', item.status ?? '', item.lane ?? '',
])));

report.push('### Invalid required effort values');
report.push('');
report.push(table(['Item', 'Effort', 'Status', 'Wave'], top(invalidRequiredEffortValues).map((item) => [
  linkTitle(item), item.effort ?? '', item.status ?? '', item.wave ?? '',
])));

report.push('### Active launch blockers');
report.push('');
report.push(table(['Item', 'Priority', 'Status', 'Wave'], top(launchBlockers).map((item) => [
  linkTitle(item), item.priority ?? '', item.status ?? '', item.wave ?? '',
])));

report.push('### Pull requests kept as project cards');
report.push('');
report.push(table(['Pull request', 'Status', 'Repository'], top(pullRequestProjectItems).map((item) => [
  linkTitle(item), item.status ?? '', item.repository ?? '',
])));

report.push('### Retired status/priority labels');
report.push('');
report.push(table(['Label', 'Replacement'], top(retiredLabels).map((label) => [
  label.name, label.replacement,
])));

report.push('### Label format drift');
report.push('');
report.push(table(['Canonical label', 'Existing variants'], top(labelFormatDrift).map((group) => [
  group.canonical, group.labels.join(', '),
])));

report.push('### Non-canonical issue titles');
report.push('');
report.push(table(['Issue', 'Current title'], top(nonCanonicalTitles).map((item) => [
  item.url ? `[#${item.number}](${item.url})` : item.number ?? '', item.title,
])));

report.push('### External repository items');
report.push('');
report.push(table(['Item', 'Repository', 'Status'], top(externalItems).map((item) => [
  linkTitle(item), item.repository ?? '', item.status ?? '',
])));

if (issueDetails.length > 0) {
  report.push('## Dependencies and hierarchy');
  report.push('');
  report.push('### Open blocked items');
  report.push('');
  report.push(table(['Item', 'Open blockers'], top(openBlockedItems).map((entry) => [
    linkTitle(entry.item), entry.blockers.map((blocker) => blocker.url ? `[${escapeMd(blocker.title)}](${blocker.url})` : blocker.title).join(', '),
  ])));
  report.push('### Dependencies missing from the project');
  report.push('');
  report.push(table(['Item', 'Missing dependency'], top(dependenciesMissingFromProject).map((entry) => [
    linkTitle(entry.item), entry.dependency.url ? `[${escapeMd(entry.dependency.title)}](${entry.dependency.url})` : entry.dependency.title,
  ])));
  report.push('### Parent or sub-issue items missing from the project');
  report.push('');
  report.push(table(['Kind', 'Item', 'Missing related item'], [
    ...top(parentsMissingFromProject).map((entry) => ['parent', linkTitle(entry.item), entry.parent.url ? `[${escapeMd(entry.parent.title)}](${entry.parent.url})` : entry.parent.title]),
    ...top(subIssuesMissingFromProject).map((entry) => ['sub-issue', linkTitle(entry.item), entry.subIssue.url ? `[${escapeMd(entry.subIssue.title)}](${entry.subIssue.url})` : entry.subIssue.title]),
  ]));
}

report.push('## Canonical CSV comparison');
report.push('');
if (!canonicalComparison.enabled) {
  report.push(canonicalComparison.error ? `Comparison failed: ${escapeMd(canonicalComparison.error)}` : '_Disabled or canonical CSV not found._');
  report.push('');
} else {
  report.push(`- File: \`${escapeMd(canonicalComparison.file)}\``);
  report.push(`- Generated current export: \`${escapeMd(canonicalComparison.generatedExport)}\``);
  report.push(`- Rows: ${canonicalComparison.rowCount}`);
  report.push(`- Compared rows: ${canonicalComparison.comparedRows}`);
  report.push(`- Fallback title matches: ${canonicalComparison.fallbackMatches.length}`);
  report.push(`- Missing in project: ${canonicalComparison.missingInProject.length}`);
  report.push(`- Extra in project: ${canonicalComparison.extraInProject.length}`);
  report.push(`- Field mismatches: ${canonicalComparison.fieldMismatches.length}`);
  report.push('');
  report.push('### Canonical items missing from project');
  report.push('');
  report.push(table(['Key', 'Title'], top(canonicalComparison.missingInProject).map((entry) => [
    entry.key || entry.issueUrl || entry.issueNumber,
    entry.title,
  ])));
  report.push('### Live project items missing from canonical CSV');
  report.push('');
  report.push(table(['Issue', 'Title'], top(canonicalComparison.extraInProject).map((entry) => [
    entry.url ? `[#${entry.number}](${entry.url})` : entry.number ?? '',
    entry.title,
  ])));
  report.push('### Fallback title matches');
  report.push('');
  report.push(table(['CSV title', 'Matched issue'], top(canonicalComparison.fallbackMatches).map((entry) => [
    entry.title,
    entry.url ?? '',
  ])));
  report.push('### Field mismatches');
  report.push('');
  report.push(table(['Item', 'Field', 'Expected', 'Actual', 'Match'], top(canonicalComparison.fieldMismatches).map((entry) => [
    entry.url ? `[${escapeMd(entry.title)}](${entry.url})` : entry.title,
    entry.field, entry.expected, entry.actual, entry.match ?? '',
  ])));
}

report.push('## Raw artifacts');
report.push('');
report.push('- `raw/project.json`');
report.push('- `raw/project-graphql.json`');
report.push('- `raw/fields-cli.json`');
report.push('- `raw/items.json`');
report.push('- `items-normalized.json`');
report.push('- `github_project_planning_current.csv`');
report.push('- `raw/repository-issues.json`');
report.push('- `raw/repository-prs.json`');
report.push('- `raw/repository-labels.json`');
report.push('- `raw/repository-milestones.json`');
report.push('- `analysis.json`');
report.push('- `canonical-comparison.json`');
if (issueDetails.length > 0) report.push('- `deep/issue-details.json`');
if (prDetails.length > 0) report.push('- `deep/pr-details.json`');
report.push('');

fs.writeFileSync(path.join(outDir, 'report.md'), `${report.join('\n')}\n`, 'utf8');
fs.writeFileSync(path.join(outDir, 'drift-count.txt'), `${findingCount}\n`, 'utf8');
fs.writeFileSync(path.join(outDir, 'canonical-drift-count.txt'), `${canonicalDriftCount}\n`, 'utf8');
fs.writeFileSync(path.join(outDir, 'blocking-count.txt'), `${blockingCount}\n`, 'utf8');
NODE

RAW_DIR="$RAW_DIR" \
OUT_DIR="$OUTPUT_DIR" \
REPOSITORY="$REPOSITORY" \
PROJECT_NUMBER="$PROJECT_NUMBER" \
OWNER_LOGIN="$OWNER_LOGIN" \
STALE_DAYS="$STALE_DAYS" \
GENERIC="$GENERIC" \
USE_CANONICAL="$USE_CANONICAL" \
CANONICAL_FILE="$CANONICAL_FILE" \
PLANNING_EXPORT_FILE="" \
CURRENT_WAVE="$CURRENT_WAVE" \
node "$RAW_DIR/analyze-project.mjs" normalize

NORMALIZED_COUNT="$(jq 'length' "$NORMALIZED_ITEMS_FILE")"
ok "Normalized items: $NORMALIZED_COUNT"

printf '[]\n' > "$DEEP_DIR/issue-details.json"
printf '[]\n' > "$DEEP_DIR/pr-details.json"

if ((DEEP)); then
  step "6. Deep issue dependencies, hierarchy and pull request details"
  : > "$DEEP_DIR/issue-details.ndjson"
  : > "$DEEP_DIR/pr-details.ndjson"

  ISSUE_COUNTER=0
  while IFS= read -r item; do
    ITEM_REPO="$(jq -r '.repository' <<<"$item")"
    ITEM_NUMBER="$(jq -r '.number' <<<"$item")"
    ITEM_TITLE="$(jq -r '.title' <<<"$item")"
    ISSUE_COUNTER=$((ISSUE_COUNTER + 1))
    printf 'Issue %s: %s#%s %s\n' "$ISSUE_COUNTER" "$ITEM_REPO" "$ITEM_NUMBER" "$ITEM_TITLE"
    if gh issue view "$ITEM_NUMBER" -R "$ITEM_REPO" \
      --json assignees,author,blockedBy,blocking,closedAt,createdAt,issueType,labels,milestone,number,parent,state,stateReason,subIssues,subIssuesSummary,title,updatedAt,url \
      >> "$DEEP_DIR/issue-details.ndjson" 2>>"$ERROR_LOG"; then
      printf '\n' >> "$DEEP_DIR/issue-details.ndjson"
    else
      warn "Could not enrich issue $ITEM_REPO#$ITEM_NUMBER"
    fi
  done < <(jq -c '.[] | select(.type == "Issue" and .repository != null and .number != null)' "$NORMALIZED_ITEMS_FILE")

  if [[ -s "$DEEP_DIR/issue-details.ndjson" ]]; then
    jq -s '.' "$DEEP_DIR/issue-details.ndjson" > "$DEEP_DIR/issue-details.json"
  fi

  PR_COUNTER=0
  while IFS= read -r item; do
    ITEM_REPO="$(jq -r '.repository' <<<"$item")"
    ITEM_NUMBER="$(jq -r '.number' <<<"$item")"
    ITEM_TITLE="$(jq -r '.title' <<<"$item")"
    PR_COUNTER=$((PR_COUNTER + 1))
    printf 'Pull request %s: %s#%s %s\n' "$PR_COUNTER" "$ITEM_REPO" "$ITEM_NUMBER" "$ITEM_TITLE"
    if gh pr view "$ITEM_NUMBER" -R "$ITEM_REPO" \
      --json assignees,author,baseRefName,closedAt,closingIssuesReferences,createdAt,headRefName,isDraft,labels,mergeStateStatus,mergeable,mergedAt,milestone,number,reviewDecision,state,title,updatedAt,url \
      >> "$DEEP_DIR/pr-details.ndjson" 2>>"$ERROR_LOG"; then
      printf '\n' >> "$DEEP_DIR/pr-details.ndjson"
    else
      warn "Could not enrich pull request $ITEM_REPO#$ITEM_NUMBER"
    fi
  done < <(jq -c '.[] | select(.type == "PullRequest" and .repository != null and .number != null)' "$NORMALIZED_ITEMS_FILE")

  if [[ -s "$DEEP_DIR/pr-details.ndjson" ]]; then
    jq -s '.' "$DEEP_DIR/pr-details.ndjson" > "$DEEP_DIR/pr-details.json"
  fi
else
  step "6. Deep dependency scan skipped"
  info "Re-run with --deep to inspect blockedBy, blocking, parents and sub-issues."
fi

step "7. Analyze planning health and generate Markdown report"

if ((USE_CANONICAL)) && [[ ! -f "$CANONICAL_FILE" ]]; then
  warn "Canonical planning file not found: $CANONICAL_FILE"
fi

RAW_DIR="$RAW_DIR" \
OUT_DIR="$OUTPUT_DIR" \
REPOSITORY="$REPOSITORY" \
PROJECT_NUMBER="$PROJECT_NUMBER" \
OWNER_LOGIN="$OWNER_LOGIN" \
STALE_DAYS="$STALE_DAYS" \
GENERIC="$GENERIC" \
USE_CANONICAL="$USE_CANONICAL" \
CANONICAL_FILE="$CANONICAL_FILE" \
PLANNING_EXPORT_FILE="$PLANNING_EXPORT_FILE" \
CURRENT_WAVE="$CURRENT_WAVE" \
node "$RAW_DIR/analyze-project.mjs" analyze

DRIFT_COUNT="$(cat "$OUTPUT_DIR/drift-count.txt")"
CANONICAL_DRIFT_COUNT="$(cat "$OUTPUT_DIR/canonical-drift-count.txt")"
BLOCKING_COUNT="$(cat "$OUTPUT_DIR/blocking-count.txt")"

step "8. Summary"
printf '%sProject:%s %s (#%s)\n' "$C_BOLD" "$C_RESET" "$PROJECT_TITLE" "$PROJECT_NUMBER"
printf '%sOwner:%s %s\n' "$C_BOLD" "$C_RESET" "$OWNER_LOGIN"
printf '%sRepository:%s %s\n' "$C_BOLD" "$C_RESET" "$REPOSITORY"
printf '%sItems:%s %s\n' "$C_BOLD" "$C_RESET" "$NORMALIZED_COUNT"
printf '%sFindings:%s %s total, %s blocking\n' "$C_BOLD" "$C_RESET" "$DRIFT_COUNT" "$BLOCKING_COUNT"
printf '%sCanonical CSV drift:%s %s\n' "$C_BOLD" "$C_RESET" "$CANONICAL_DRIFT_COUNT"
printf '%sReport:%s %s\n' "$C_BOLD" "$C_RESET" "$REPORT_FILE"
if [[ -n "$PLANNING_EXPORT_FILE" ]]; then
  printf '%sCurrent CSV:%s %s\n' "$C_BOLD" "$C_RESET" "$PLANNING_EXPORT_FILE"
fi
printf '%sRaw data:%s %s\n' "$C_BOLD" "$C_RESET" "$RAW_DIR"

if [[ -s "$ERROR_LOG" ]]; then
  warn "Some optional calls failed. Inspect: $ERROR_LOG"
fi

if ((OPEN_PROJECT)); then
  gh project view "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --web >/dev/null 2>&1 || true
fi

if ((FAIL_ON_DRIFT)) && ((CANONICAL_DRIFT_COUNT > 0)); then
  exit 3
fi

exit 0
