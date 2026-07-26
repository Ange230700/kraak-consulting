#!/usr/bin/env bash
#
# KRAAK repository awareness report
#
# Read-only audit of the KRAAK monorepo before editing or adding code.
# Compatible with Git Bash/MINGW64, Linux, and macOS.
#
# Usage:
#   bash scripts/repo-awareness.sh
#   bash scripts/repo-awareness.sh --full
#   bash scripts/repo-awareness.sh --checks
#   bash scripts/repo-awareness.sh --network
#   bash scripts/repo-awareness.sh --full --checks --network
#   bash scripts/repo-awareness.sh --output .reports/repo-awareness.txt
#
# Flags:
#   --full       Broader listings, ignored files, dependencies, and searches.
#   --checks     Run non-mutating format, test, typecheck, and build commands.
#   --network    Query GitHub and deployed Render services.
#   --output     Save the report while also printing it.
#   --no-color   Disable terminal colors.
#   -h, --help   Show help.
#
# Security:
#   Environment-variable values are never printed. Only names from tracked
#   example files are shown.

set -uo pipefail

FULL=0
RUN_CHECKS=0
RUN_NETWORK=0
USE_COLOR=1
OUTPUT_FILE=""
OUTPUT_FILE_WAS_SET=0

usage() {
  awk '
    NR == 1 { next }
    /^#/ {
      sub(/^# ?/, "")
      print
      next
    }
    { exit }
  ' "$0"
}

while (($# > 0)); do
  case "$1" in
    --full) FULL=1; shift ;;
    --checks) RUN_CHECKS=1; shift ;;
    --network) RUN_NETWORK=1; shift ;;
    --output)
      (($# >= 2)) || { printf 'Error: --output requires a file path.\n' >&2; exit 2; }
      OUTPUT_FILE="$2"
      OUTPUT_FILE_WAS_SET=1
      shift 2
      ;;
    --no-color) USE_COLOR=0; shift ;;
    -h|--help) usage; exit 0 ;;
    *)
      printf 'Error: unknown argument: %s\n\n' "$1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

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

title() {
  printf '\n%s%s%s\n' "$C_BOLD$C_BLUE" "$1" "$C_RESET"
  printf '%s\n' '================================================================================'
}

section() {
  printf '\n%s%s%s\n' "$C_BOLD$C_CYAN" "$1" "$C_RESET"
  printf '%s\n' '--------------------------------------------------------------------------------'
}

subsection() {
  printf '\n%s%s%s\n' "$C_BOLD" "$1" "$C_RESET"
}

note() {
  printf '%sNOTE:%s %s\n' "$C_YELLOW" "$C_RESET" "$1"
}

warn() {
  printf '%sWARN:%s %s\n' "$C_YELLOW" "$C_RESET" "$1"
}

info() {
  printf '%sINFO:%s %s\n' "$C_CYAN" "$C_RESET" "$1"
}

fail() {
  printf '%sFAIL:%s %s\n' "$C_RED" "$C_RESET" "$1"
}

run() {
  printf '\n%s$%s' "$C_GREEN" "$C_RESET"
  printf ' %q' "$@"
  printf '\n'
  "$@" 2>&1 || {
    local status=$?
    warn "Command exited with status $status; report generation continues."
    return 0
  }
}

run_shell() {
  local command="$1"
  printf '\n%s$%s %s\n' "$C_GREEN" "$C_RESET" "$command"
  bash -lc "$command" 2>&1 || {
    local status=$?
    warn "Command exited with status $status; report generation continues."
    return 0
  }
}

run_info() {
  printf '\n%s$%s' "$C_GREEN" "$C_RESET"
  printf ' %q' "$@"
  printf '\n'
  "$@" 2>&1 || {
    local status=$?
    info "Command exited with status $status; this result is informational only."
    return 0
  }
}

tracked_ref_exists() {
  git show-ref --verify --quiet "refs/remotes/origin/$1" ||
    git show-ref --verify --quiet "refs/heads/$1"
}

resolve_ref() {
  local branch="$1"
  if git show-ref --verify --quiet "refs/remotes/origin/$branch"; then
    printf 'origin/%s' "$branch"
  elif git show-ref --verify --quiet "refs/heads/$branch"; then
    printf '%s' "$branch"
  else
    return 1
  fi
}

redacted_env_names() {
  local file
  while IFS= read -r file; do
    [[ -f "$file" ]] || continue
    printf '\n[%s]\n' "$file"
    awk '
      /^[[:space:]]*#/ { next }
      /^[[:space:]]*[A-Za-z_][A-Za-z0-9_]*[[:space:]]*=/ {
        line=$0
        sub(/^[[:space:]]*/, "", line)
        split(line, parts, "=")
        print parts[1] "=<redacted>"
      }
    ' "$file"
  done < <(
    git ls-files |
      awk '
        /(^|\/)\.env(\..*)?$/ ||
        /(^|\/)\.env\..*\.example$/ ||
        /(^|\/)\.env\.example$/ { print }
      ' |
      sort -u
  )
}

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$REPO_ROOT" ]]; then
  fail "Run this script from inside a Git repository."
  exit 1
fi

cd "$REPO_ROOT" || exit 1

STARTED_AT="$(date -u '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null || date)"
CURRENT_BRANCH="$(git branch --show-current 2>/dev/null || true)"
CURRENT_COMMIT="$(git rev-parse --short HEAD 2>/dev/null || true)"

if ((OUTPUT_FILE_WAS_SET == 0)); then
  REPORT_STAMP="$(date -u '+%Y-%m-%dT%H%M%SZ' 2>/dev/null || date '+%Y%m%dT%H%M%SZ')"
  OUTPUT_FILE=".reports/repo-awareness-${REPORT_STAMP}.txt"
fi

if [[ -n "$OUTPUT_FILE" ]]; then
  mkdir -p "$(dirname "$OUTPUT_FILE")"
  exec 3>&1 4>&2
  print_saved_report() {
    local status=$?
    exec 1>&3 2>&4
    cat "$OUTPUT_FILE"
    exit "$status"
  }
  trap print_saved_report EXIT
  exec > "$OUTPUT_FILE" 2>&1
fi

title "KRAAK REPOSITORY AWARENESS REPORT"
printf 'Generated at (UTC): %s\n' "$STARTED_AT"
printf 'Repository root:     %s\n' "$REPO_ROOT"
printf 'Current branch:      %s\n' "${CURRENT_BRANCH:-<detached HEAD>}"
printf 'Current commit:      %s\n' "${CURRENT_COMMIT:-<unknown>}"
printf 'Mode:                full=%s checks=%s network=%s\n' "$FULL" "$RUN_CHECKS" "$RUN_NETWORK"

section "1. Runtime and toolchain"
run pwd
run uname -a
run git --version
have node && run node --version || warn "node is unavailable."
have pnpm && run pnpm --version || warn "pnpm is unavailable."
have corepack && run corepack --version
have gh && run gh --version || warn "GitHub CLI is unavailable."
have rg && run rg --version || warn "ripgrep is unavailable."

section "2. Git repository state"
run git rev-parse --show-toplevel
run git status --short --branch
run git branch --show-current
run git branch -vv
run git remote -v
run git worktree list
run git submodule status
run git stash list
run git tag --sort=-creatordate --list

subsection "Recent history"
run git log --oneline --decorate -15
run git log --graph --oneline --decorate --all -30

subsection "Upstream and divergence"
if [[ -n "$CURRENT_BRANCH" ]]; then
  UPSTREAM="$(git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null || true)"
  if [[ -n "$UPSTREAM" ]]; then
    printf 'Upstream: %s\n' "$UPSTREAM"
    run git rev-list --left-right --count "$UPSTREAM...HEAD"
  else
    note "Current branch has no configured upstream."
  fi
else
  warn "Detached HEAD: no current branch name."
fi

if ((FULL)); then
  subsection "Untracked and ignored files"
  run git ls-files --others --exclude-standard
  run git status --ignored --short
fi

section "3. Local changes and branch comparisons"
subsection "Unstaged changes"
run git diff --stat
run git diff --name-status
run git diff --check

subsection "Staged changes"
run git diff --cached --stat
run git diff --cached --name-status
run git diff --cached --check

subsection "Modified, deleted, and untracked files"
run git ls-files --modified
run git ls-files --deleted
run git ls-files --others --exclude-standard

if tracked_ref_exists staging; then
  STAGING_REF="$(resolve_ref staging)"
  subsection "Current HEAD compared with $STAGING_REF"
  run git log --oneline "$STAGING_REF..HEAD"
  run git log --oneline "HEAD..$STAGING_REF"
  run git diff --stat "$STAGING_REF...HEAD"
  run git diff --name-status "$STAGING_REF...HEAD"
fi

if tracked_ref_exists main && tracked_ref_exists staging; then
  MAIN_REF="$(resolve_ref main)"
  STAGING_REF="$(resolve_ref staging)"
  subsection "$STAGING_REF compared with $MAIN_REF"
  run git log --oneline "$MAIN_REF..$STAGING_REF"
  run git diff --stat "$MAIN_REF...$STAGING_REF"
fi

section "4. Repository tree and tracked files"
run ls -la

subsection "Top-level tracked-file distribution"
run_shell "git ls-files | awk -F/ '{print \$1}' | sort | uniq -c | sort -nr"

subsection "Tracked file count"
run_shell "git ls-files | wc -l"

subsection "Directory tree"
if have tree; then
  DEPTH=4
  ((FULL)) || DEPTH=3
  run tree -a -L "$DEPTH" -I 'node_modules|.git|dist|coverage|.angular|.scannerwork|.nx|.turbo'
else
  DEPTH=4
  ((FULL)) || DEPTH=3
  run_shell "find . -maxdepth $DEPTH \
    -path './node_modules' -prune -o \
    -path './.git' -prune -o \
    -path './.reports' -prune -o \
    -path './dist' -prune -o \
    -path './coverage' -prune -o \
    -path './.angular' -prune -o \
    -path './.scannerwork' -prune -o \
    -print | sort"
fi

subsection "Tracked files by extension"
run_shell "git ls-files | awk '
  {
    name=\$0
    n=split(name, parts, \".\")
    ext=(n > 1 ? parts[n] : \"[no extension]\")
    count[ext]++
  }
  END {
    for (ext in count) print count[ext], ext
  }
' | sort -nr | head -50"

subsection "Largest tracked files"
run_shell '
git ls-files -z |
while IFS= read -r -d "" file; do
  if [[ -f "$file" ]]; then
    size=$(wc -c < "$file" 2>/dev/null || printf 0)
    printf "%12d %s\n" "$size" "$file"
  fi
done |
sort -nr |
head -30
'

if ((FULL)); then
  subsection "All tracked files"
  run git ls-files
fi

section "5. Canonical documents"
for file in README.md AGENTS.md CONTRIBUTING.md ARCHITECTURE.md package.json pnpm-workspace.yaml render.yaml; do
  if [[ -f "$file" ]]; then
    printf '%-28s %8s lines\n' "$file" "$(wc -l < "$file" | tr -d ' ')"
  fi
done

section "6. Workspace and package map"
run_shell "find apps packages -maxdepth 3 -name package.json -print 2>/dev/null | sort"

if have node && [[ -f package.json ]]; then
  subsection "Root package metadata"
  run node -e '
    const fs = require("fs");
    const p = JSON.parse(fs.readFileSync("package.json", "utf8"));
    console.log(JSON.stringify({
      name: p.name,
      private: p.private,
      packageManager: p.packageManager,
      engines: p.engines,
      workspaces: p.workspaces
    }, null, 2));
  '

  subsection "Root scripts"
  run node -e '
    const fs = require("fs");
    const p = JSON.parse(fs.readFileSync("package.json", "utf8"));
    for (const [name, command] of Object.entries(p.scripts || {})) {
      console.log(`${name.padEnd(34)} ${command}`);
    }
  '

  subsection "Workspace package names"
  run node -e '
    const fs = require("fs");
    const path = require("path");
    for (const root of ["apps", "packages"]) {
      if (!fs.existsSync(root)) continue;
      for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const file = path.join(root, entry.name, "package.json");
        if (!fs.existsSync(file)) continue;
        const p = JSON.parse(fs.readFileSync(file, "utf8"));
        console.log(`${file}: ${p.name || "<unnamed>"}`);
      }
    }
  '
fi

have pnpm && run pnpm list -r --depth 0

section "7. Dependencies and imports"
have pnpm && run pnpm list --depth 0
if ((FULL)) && have pnpm; then
  run_info pnpm outdated
fi

if have rg; then
  run rg -n --glob '*.ts' --glob '*.mts' --glob '*.mjs' \
    "from ['\"]@kraak/|import\\(['\"]@kraak/" apps packages scripts
fi

section "8. Configuration inventory"
run_shell "find . \
  -path './node_modules' -prune -o \
  -path './.git' -prune -o \
  -path './.reports' -prune -o \
  -path './dist' -prune -o \
  -path './coverage' -prune -o \
  \\( \
    -name 'package.json' -o \
    -name 'pnpm-workspace.yaml' -o \
    -name 'angular.json' -o \
    -name 'nest-cli.json' -o \
    -name 'tsconfig*.json' -o \
    -name 'eslint.config.*' -o \
    -name '.prettierrc*' -o \
    -name 'render.yaml' -o \
    -name 'sonar-project.properties' -o \
    -path './.github/workflows/*.yml' -o \
    -path './.github/workflows/*.yaml' \
  \\) -print | sort"

if have rg; then
  [[ -f render.yaml ]] && run rg -n \
    "name:|type:|runtime:|plan:|branch:|autoDeploy:|buildCommand:|healthCheckPath:|CLIENT_|CORS_|SUPABASE_" \
    render.yaml

  [[ -f angular.json ]] && run rg -n \
    "projectType|builder|build|serve|prerender|outputPath|fileReplacements|configurations" \
    angular.json

  run rg -n --glob 'tsconfig*.json' \
    '"paths"|"references"|"extends"|"composite"|"outDir"|"rootDir"' .
fi

section "9. Environment variables (values redacted)"
subsection "Tracked environment files"
run_shell "git ls-files | awk '/(^|\\/)\\.env(\\..*)?$/ || /(^|\\/)\\.env\\..*\\.example$/ || /(^|\\/)\\.env\\.example$/' | sort -u"

subsection "Variable names"
redacted_env_names

if have rg; then
  subsection "Variable usage"
  run rg -n \
    --glob '!node_modules/**' \
    --glob '!dist/**' \
    --glob '!coverage/**' \
    "process\\.env|import\\.meta\\.env|PUBLIC_[A-Z0-9_]+|CLIENT_[A-Z0-9_]+|SUPABASE_[A-Z0-9_]+|CORS_[A-Z0-9_]+|RESEND_[A-Z0-9_]+|CONTACT_[A-Z0-9_]+|RENDER_[A-Z0-9_]+" \
    apps packages scripts .github render.yaml supabase docs
fi

section "10. Application entry points and routes"
run_shell "find apps packages -type f \
  \\( \
    -name 'main.ts' -o \
    -name 'server.ts' -o \
    -name 'app.module.ts' -o \
    -name 'app.config.ts' -o \
    -name '*routes*.ts' -o \
    -name 'index.ts' \
  \\) -print | sort"

if have rg; then
  subsection "Angular routes and navigation"
  run rg -n --glob '*.ts' --glob '*.html' \
    "Routes|RouterModule|loadComponent|loadChildren|path:|routerLink|navigate\\(" \
    apps/client/projects

  subsection "NestJS modules and endpoints"
  run rg -n --glob '*.ts' \
    "@Module|@Controller|@Injectable|@Get|@Post|@Put|@Patch|@Delete" \
    apps/api/src
fi

section "11. Test inventory"
run_shell "find apps packages scripts -type f \
  \\( \
    -name '*.spec.ts' -o \
    -name '*.test.ts' -o \
    -name '*.test.mjs' -o \
    -name '*.spec.mjs' \
  \\) -print | sort"

if have rg; then
  run rg -n \
    --glob '*.spec.ts' --glob '*.test.ts' --glob '*.test.mjs' --glob '*.spec.mjs' \
    "describe\\(|it\\(|test\\(" apps packages scripts
fi

section "12. Documentation, ADRs, and workflows"
run_shell "find docs/decisions docs/engineering docs/operations docs/planning -maxdepth 2 -type f -print 2>/dev/null | sort"
run_shell "find .github/workflows -maxdepth 1 -type f -print 2>/dev/null | sort"

if have rg; then
  run rg -n \
    "^(name:|on:|jobs:)|environment:|uses:|run:|workflow_dispatch|push:|pull_request:|Render|Supabase" \
    .github/workflows

  run rg -n \
    "staging|main|release|Render|Supabase|prerender|participant|CORS|authentication|observability" \
    README.md AGENTS.md CONTRIBUTING.md ARCHITECTURE.md docs/decisions docs/engineering docs/operations docs/planning render.yaml
fi

section "13. Risk markers and cleanup residue"
if have rg; then
  subsection "TODO/FIXME/deprecated markers"
  run rg -n -i \
    --glob '!node_modules/**' \
    --glob '!dist/**' \
    --glob '!coverage/**' \
    "TODO|FIXME|HACK|XXX|DEPRECATED|legacy|stale" \
    apps packages scripts docs .github README.md AGENTS.md CONTRIBUTING.md ARCHITECTURE.md

  subsection "Legacy hosting-provider residue"
  run_shell "git grep -n -i -E \
    'vercel|vercel\\.app|VERCEL_|kraak-consulting-staging|kraak-consulting-git-staging' \
    -- . ':(exclude)scripts/repo-awareness.sh' || true"

  subsection "Stale branch-flow language"
  arrow="->"
  workflow_name="promote-to-main"
  remote_main="origin/main"
  reverse_title="Promote main to staging"
  run rg -n \
    "main ${arrow} staging|main [-][>] staging|ff-only ${remote_main}|${workflow_name}|${reverse_title}" \
    README.md CONTRIBUTING.md AGENTS.md docs render.yaml .github

  subsection "Merge-conflict markers"
  run rg -n "^(<<<<<<<|=======|>>>>>>>)" \
    --glob '!node_modules/**' \
    --glob '!.git/**' \
    --glob '!pnpm-lock.yaml' \
    .
fi

subsection "Local artifacts"
for path in .vercel apps/.vercel apps/client/.vercel .scannerwork coverage dist .angular; do
  if [[ -e "$path" ]]; then
    if git check-ignore -q "$path" 2>/dev/null; then
      printf 'ignored: %s\n' "$path"
    else
      printf 'present, not confirmed ignored: %s\n' "$path"
    fi
  fi
done

section "14. Generated/public assets and large files"
if have rg; then
  run rg -n \
    "https?://|Sitemap:|<loc>|canonical|PUBLIC_SITE_URL|CLIENT_SITE_URL" \
    apps/client/projects/web/public \
    apps/client/projects/web/src/app/seo \
    scripts/generate-web-seo.mjs
fi

run_shell "find . \
  -path './node_modules' -prune -o \
  -path './.git' -prune -o \
  -path './.reports' -prune -o \
  -path './dist' -prune -o \
  -path './coverage' -prune -o \
  -path './.scannerwork' -prune -o \
  -type f -size +1M -print | sort"

section "15. GitHub state"
if ((RUN_NETWORK)); then
  if have gh; then
    run gh auth status
    run gh repo view
    run gh pr status
    run gh pr list --limit 30
    run gh issue list --limit 50
    run gh workflow list
    run gh run list --limit 15
    run gh api "repos/{owner}/{repo}/branches/staging/protection"
    run gh api "repos/{owner}/{repo}/branches/main/protection"
  else
    warn "--network requested, but gh is unavailable."
  fi
else
  note "Skipped GitHub API queries. Use --network to include them."
fi

section "16. Deployed Render service checks"
if ((RUN_NETWORK)); then
  if have curl; then
    run curl -sS -I --max-time 20 https://kraak-web-staging.onrender.com
    run curl -sS -I --max-time 20 https://kraak-web-prod.onrender.com
    run curl -sS -i --max-time 30 https://kraak-api-staging.onrender.com/health
    run curl -sS -i --max-time 30 https://kraak-api-prod.onrender.com/health
  else
    warn "--network requested, but curl is unavailable."
  fi
else
  note "Skipped deployed-service checks. Use --network to include them."
fi

section "17. Non-mutating validation"
if ((RUN_CHECKS)); then
  if have pnpm; then
    run pnpm format:check
    run pnpm test:workspace
    if ((FULL)); then
      run pnpm typecheck
      run pnpm test:libs
      run pnpm test:api
      run pnpm test:unit
      run pnpm build
    fi
  else
    warn "--checks requested, but pnpm is unavailable."
  fi
else
  note "Skipped validation commands. Use --checks to run them."
fi

section "18. Summary"
printf 'Repository:       %s\n' "$REPO_ROOT"
printf 'Branch:           %s\n' "${CURRENT_BRANCH:-<detached HEAD>}"
printf 'Commit:           %s\n' "${CURRENT_COMMIT:-<unknown>}"
printf 'Working tree:     '
if [[ -z "$(git status --porcelain 2>/dev/null)" ]]; then
  printf '%sclean%s\n' "$C_GREEN" "$C_RESET"
else
  printf '%shas local changes%s\n' "$C_YELLOW" "$C_RESET"
fi
printf 'Tracked files:    %s\n' "$(git ls-files | wc -l | tr -d ' ')"
printf 'Report completed: %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null || date)"
[[ -n "$OUTPUT_FILE" ]] && printf 'Saved report:     %s\n' "$OUTPUT_FILE"

printf '\nRecommended next commands:\n'
printf '  git status --short --branch\n'
printf '  git diff --stat && git diff --check\n'
printf '  rg -n "target-symbol|target-route|target-env" apps packages scripts docs\n'
printf '  pnpm format:check\n'
printf '  pnpm test:workspace\n'
