> **Status:** Historical.
> This document does not define the current process.
> Active reference: [CONTRIBUTION_WORKFLOW](../../engineering/CONTRIBUTION_WORKFLOW.md)

# Complete Git Workflow Setup — Summary

## Table des matières

- [Complete Git Workflow Setup — Summary](#complete-git-workflow-setup-summary)
  - [What Was Set Up](#what-was-set-up)
    - [1. ✅ Changesets Integration](#1-changesets-integration)
    - [2. ✅ GitHub Actions Workflows](#2-github-actions-workflows)
      - [changesets.yml](#changesetsyml)
      - [publish-release.yml (NEW)](#publish-releaseyml-new)
      - [release-prod.yml (existing)](#release-prodyml-existing)
    - [3. ✅ Developer Scripts](#3-developer-scripts)
    - [4. ✅ Documentation](#4-documentation)
  - [Complete Workflow](#complete-workflow)
  - [Developer Quick Start](#developer-quick-start)
    - [First Time Setup](#first-time-setup)
    - [Feature Workflow](#feature-workflow)
  - [Workflow Rules](#workflow-rules)
  - [Documentation Links](#documentation-links)
  - [Workflows Deployed](#workflows-deployed)
  - [Next Steps](#next-steps)
  - [Troubleshooting](#troubleshooting)
    - ["Version PR doesn't appear"](#version-pr-doesnt-appear)
    - ["Tags aren't created"](#tags-arent-created)
    - ["Staging isn't deploying"](#staging-isnt-deploying)
  - [Everything is automated](#everything-is-automated)

> ✅ **Complete Git workflow automation for KRAAK monorepo**
>
> Everything is now configured for automatic versioning, tagging, and releases.

---

## What Was Set Up

### 1. ✅ Changesets Integration

- **`.changeset/config.json`** — Configured for monorepo with `baseBranch: staging`
- **`pnpm changesets:version`** — Script to bump versions
- **`pnpm changesets:publish`** — Script to create tags

### 2. ✅ GitHub Actions Workflows

#### **changesets.yml**

- **Trigger:** Push to `staging`
- **Action:** Creates/updates version PR with bumped versions and CHANGELOG
- **Output:** PR "chore: bump versions and update changelogs"

#### **publish-release.yml** (NEW)

- **Trigger:** Push to `main` with "chore: bump versions..." commit
- **Action:** Runs `changeset publish`, creates SemVer tags (v*.*.\*)
- **Output:** Tags trigger `release-prod.yml`

#### **release-prod.yml** (existing)

- **Trigger:** SemVer tag push (`v*.*.*`)
- **Action:** Validates, builds, tests, deploys to production
- **Output:** Production live

### 3. ✅ Developer Scripts

- **`scripts/setup-git-config.sh`** — Setup git config (macOS/Linux)
- **`scripts/setup-git-config.ps1`** — Setup git config (Windows PowerShell)

### 4. ✅ Documentation

- **`docs/runbooks/GIT_WORKFLOW_COMPLETE.md`** — Full developer guide with diagrams
- **`docs/runbooks/CHANGESETS.md`** — Changesets usage and troubleshooting
- **`docs/runbooks/GIT_WORKFLOW_CHEATSHEET.md`** — Quick reference commands

---

## Complete Workflow

```text
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Feature Branch (Developer)                              │
│ • git checkout -b feat/my-feature                               │
│ • Make changes + commit                                         │
│ • pnpm changeset (add version info)                             │
│ • git push -u origin feat/my-feature                            │
│ • Open PR to staging                                            │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Code Review + CI (GitHub)                               │
│ • Lint ✓ Build ✓ Tests ✓ Type-check ✓                           │
│ • Approve + Merge (fast-forward)                                │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Version Bump (changesets.yml - AUTOMATIC)               │
│ • Detects push to staging                                       │
│ • Bumps versions in package.json                                │
│ • Generates CHANGELOG.md                                        │
│ • Creates PR "chore: bump versions..."                          │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Review Version PR (Maintainer)                          │
│ • Review version bumps (patch/minor/major)                      │
│ • Merge to staging                                              │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Staging Deployment + Validation                         │
│ • Render (kraak-api-staging) redeploys                          │
│ • Render (staging project) redeploys                            │
│ • Maintainer validates staging                                  │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: Release PR + Tag Creation                               │
│ • Open release PR from staging to main                          │
│ • Merge release PR when staging is validated                    │
│ • Push SemVer tag on main                                       │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 7: Production Deploy (release-prod.yml - AUTOMATIC)        │
│ • Triggered by SemVer tag                                       │
│ • Build + tests on tag commit                                   │
│ • Awaits production approval (GitHub Environment)               │
│ • Deploy to Render prod (API + web)                             │
│ • Smoke tests                                                   │
│ ✅ Production Live                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Developer Quick Start

### First Time Setup

```bash
# macOS/Linux
./scripts/setup-git-config.sh

# Windows PowerShell
.\scripts\setup-git-config.ps1

# Or manually
git config pull.rebase true
git config merge.ff only
```

### Feature Workflow

```bash
# 1. Create branch
git checkout -b feat/my-feature

# 2. Make changes
pnpm lint:fix && pnpm format
git add .
git commit -m "feat: description"

# 3. Add changeset
pnpm changeset
git add .changeset/
git commit -m "chore: add changeset"

# 4. Push and PR
git push -u origin feat/my-feature
# → Open PR to staging on GitHub

# Rest is automatic! ✨
```

---

## Workflow Rules

✅ **Required**

- Always create changesets before merging release-worthy work to staging
- Use rebase-only strategy (no merge commits)
- Fast-forward only merges
- Keep branches short (one task per branch)
- Include commits atomically
- Run tests locally before pushing

❌ **Forbidden**

- Direct pushes to `main` or `staging` (branch protection prevents this)
- Manual tag creation (changesets handles this)
- Merge commits (rebase-only enforced)
- Combining multiple features in one branch
- Skipping changesets

---

## Documentation Links

| Document                                                                        | Purpose                               |
| ------------------------------------------------------------------------------- | ------------------------------------- |
| [GIT_WORKFLOW_COMPLETE.md](../historical-planning/GIT_WORKFLOW_COMPLETE.md)     | Full guide with detailed explanations |
| [CHANGESETS.md](../../engineering/CHANGESETS.md)                                | Changesets configuration and usage    |
| [GIT_WORKFLOW_CHEATSHEET.md](../historical-planning/GIT_WORKFLOW_CHEATSHEET.md) | Quick command reference               |
| [STAGING_VALIDATION.md](../../operations/STAGING_VALIDATION.md)                 | Staging deployment details            |
| [RELEASE_PROD.md](../../operations/RELEASE_PROD.md)                             | Production release procedure          |
| [AGENTS.md](../../../AGENTS.md)                                                 | Git workflow rules (reference)        |

---

## Workflows Deployed

| Workflow         | File                                    | Trigger         | Purpose            |
| ---------------- | --------------------------------------- | --------------- | ------------------ |
| **Changesets**   | `.github/workflows/changesets.yml`      | Push to staging | Create version PR  |
| **Publish**      | `.github/workflows/publish-release.yml` | Version commit  | Create SemVer tags |
| **Release Prod** | `.github/workflows/release-prod.yml`    | SemVer tag      | Deploy production  |

---

## Next Steps

1. **Review** the workflow documents:
   - Start with [GIT_WORKFLOW_CHEATSHEET.md](../historical-planning/GIT_WORKFLOW_CHEATSHEET.md)
   - Read [GIT_WORKFLOW_COMPLETE.md](../historical-planning/GIT_WORKFLOW_COMPLETE.md) for details
   - Reference [CHANGESETS.md](../../engineering/CHANGESETS.md) for versioning

2. **Configure** your local environment:

   ```bash
   ./scripts/setup-git-config.sh  # or .ps1 on Windows
   ```

3. **Start developing** following the feature workflow above

4. **Ask questions** if anything is unclear — the docs are your reference!

---

## Troubleshooting

### "Version PR doesn't appear"

- Check: Did you add a changeset before merging?
- View: GitHub Actions > changesets.yml > logs

### "Tags aren't created"

- Check: Did version PR merge to main?
- Commit message must contain "chore: bump versions..."
- View: GitHub Actions > publish-release.yml > logs

### "Staging isn't deploying"

- Check: Did the relevant branch merge to `staging`?
- View: GitHub Actions > changesets.yml > logs if the issue is version-related
- Check: Render dashboard(s) for errors

---

## Everything is automated

Create branches from `staging`, merge PRs back to `staging`, validate staging,
then release to `main` only when production is ready.
