# Complete Git Workflow Setup — Summary

> ✅ **Complete Git workflow automation for KRAAK monorepo**
>
> Everything is now configured for automatic versioning, tagging, and releases.

---

## What Was Set Up

### 1. ✅ Changesets Integration

- **`.changeset/config.json`** — Configured for monorepo with `baseBranch: main`
- **`pnpm changesets:version`** — Script to bump versions
- **`pnpm changesets:publish`** — Script to create tags

### 2. ✅ GitHub Actions Workflows

#### **changesets.yml**

- **Trigger:** Push to `main`
- **Action:** Creates/updates version PR with bumped versions and CHANGELOG
- **Output:** PR "chore: bump versions and update changelogs"

#### **promote-to-main.yml** (NEW)

- **Trigger:** Version PR merged to `main`
- **Action:** Fast-forwards `staging` to latest `main`
- **Output:** Staging deployment (Render + Vercel auto-deploy)

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

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Feature Branch (Developer)                              │
│ • git checkout -b feat/my-feature                               │
│ • Make changes + commit                                         │
│ • pnpm changeset (add version info)                             │
│ • git push -u origin feat/my-feature                            │
│ • Open PR to main                                               │
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
│ • Detects push to main                                          │
│ • Bumps versions in package.json                                │
│ • Generates CHANGELOG.md                                        │
│ • Creates PR "chore: bump versions..."                          │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Review Version PR (Maintainer)                          │
│ • Review version bumps (patch/minor/major)                      │
│ • Merge to main                                                 │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Staging Promotion (promote-to-main.yml - AUTOMATIC)     │
│ • Fast-forward staging to main                                  │
│ • Push staging                                                  │
│ ↓                                                               │
│ STAGING DEPLOYMENT (auto)                                       │
│ • Render (kraak-api-staging) redeploys                          │
│ • Vercel (staging project) redeploys                            │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: Tag Creation (publish-release.yml - AUTOMATIC)          │
│ • Runs changeset publish                                        │
│ • Creates Git tags (v1.2.3, etc.)                               │
│ • Pushes tags                                                   │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 7: Production Deploy (release-prod.yml - AUTOMATIC)        │
│ • Triggered by SemVer tag                                       │
│ • Build + tests on tag commit                                   │
│ • Awaits production approval (GitHub Environment)               │
│ • Deploy to Render prod + Vercel prod                           │
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
# → Open PR to main on GitHub

# Rest is automatic! ✨
```

---

## Workflow Rules

✅ **Required**

- Always create changesets before merging to main
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

| Document                                                               | Purpose                               |
| ---------------------------------------------------------------------- | ------------------------------------- |
| [GIT_WORKFLOW_COMPLETE.md](docs/runbooks/GIT_WORKFLOW_COMPLETE.md)     | Full guide with detailed explanations |
| [CHANGESETS.md](docs/runbooks/CHANGESETS.md)                           | Changesets configuration and usage    |
| [GIT_WORKFLOW_CHEATSHEET.md](docs/runbooks/GIT_WORKFLOW_CHEATSHEET.md) | Quick command reference               |
| [STAGING_PROMOTION.md](docs/runbooks/STAGING_PROMOTION.md)             | Staging deployment details            |
| [RELEASE_PROD.md](docs/runbooks/RELEASE_PROD.md)                       | Production release procedure          |
| [AGENTS.md](AGENTS.md)                                                 | Git workflow rules (reference)        |

---

## Workflows Deployed

| Workflow         | File                                    | Trigger          | Purpose              |
| ---------------- | --------------------------------------- | ---------------- | -------------------- |
| **Changesets**   | `.github/workflows/changesets.yml`      | Push to main     | Create version PR    |
| **Promote**      | `.github/workflows/promote-to-main.yml` | Version PR merge | Fast-forward staging |
| **Publish**      | `.github/workflows/publish-release.yml` | Version commit   | Create SemVer tags   |
| **Release Prod** | `.github/workflows/release-prod.yml`    | SemVer tag       | Deploy production    |

---

## Next Steps

1. **Review** the workflow documents:
   - Start with [GIT_WORKFLOW_CHEATSHEET.md](docs/runbooks/GIT_WORKFLOW_CHEATSHEET.md)
   - Read [GIT_WORKFLOW_COMPLETE.md](docs/runbooks/GIT_WORKFLOW_COMPLETE.md) for details
   - Reference [CHANGESETS.md](docs/runbooks/CHANGESETS.md) for versioning

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

- Check: Did promote-to-main.yml run after version PR merge?
- View: GitHub Actions > promote-to-main.yml > logs
- Check: Render and Vercel dashboards for errors

---

**Everything is automated. Just create features and changesets, the rest flows automatically! 🚀**
