---
layout: guide
title: Git Workflow — Complete
description: Full developer guide for feature branches, changesets, staging, and production releases.
---

# GIT WORKFLOW — Complet

> Guide complet pour développeurs. Couvre branches, commits, changesets,
> promotion staging→main, et déploiements production.

Voir aussi:

- [`AGENTS.md`](../../AGENTS.md) — Règles du workflow Git (stratégie rebase-only, conventions)
- [`CHANGESETS.md`](CHANGESETS.md) — Gestion des versions et tags
- [`STAGING_PROMOTION.md`](STAGING_PROMOTION.md) — Promotion staging→main
- [`RELEASE_PROD.md`](RELEASE_PROD.md) — Déploiement production
- Décisions architecture : [`ARC-07`](../decisions/ARC-07-prod-release-tag-based.md), [`ARC-08`](../decisions/ARC-08-staging-environment.md)

---

## Grandes lignes du flux

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. FEATURE BRANCH (développeur)                                 │
│    • git checkout -b feat/user-auth                             │
│    • commits + push                                             │
│    • PR vers main                                               │
├─────────────────────────────────────────────────────────────────┤
│ 2. CODE REVIEW + CI                                             │
│    • GitHub Actions : lint, build, tests, type-check           │
│    • Revue manuelle                                             │
│    • Approve + merge                                            │
├─────────────────────────────────────────────────────────────────┤
│ 3. CHANGESET (développeur ou CI)                                │
│    • À faire AVANT merge, ou ajouté en branche                  │
│    • pnpm changeset → .changeset/*.md                           │
│    • Décrit package + version bump + description                │
├─────────────────────────────────────────────────────────────────┤
│ 4. STAGING DEPLOYMENT (automatique via staging branch)          │
│    • Code mergé vers main                                       │
│    • CI crée PR de version (changesets.yml)                     │
│    • PR version mergée → staging (promote-to-main.yml)          │
│    • Push staging → déploiement Render + Vercel (auto-déploie)  │
├─────────────────────────────────────────────────────────────────┤
│ 5. PRODUCTION TAG & RELEASE (automatique via tag)               │
│    • Version PR mergée vers staging → promotion vers main       │
│    • publish-release.yml crée tags SemVer (v1.2.3)              │
│    • Tag v1.2.3 déclenche release-prod.yml                      │
│    • Build, tests, approbation review → déploiement prod        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1 · SETUP LOCAL (une seule fois)

### Cloner et configurer

```bash
git clone https://github.com/Ange230700/kraak-consulting.git
cd kraak-consulting

# Configuration git obligatoire (rebase-only + fast-forward)
git config pull.rebase true
git config merge.ff only

# Global (recommandé)
git config --global pull.rebase true
git config --global merge.ff only
```

### Vérifier la config

```bash
git config --get pull.rebase   # → true
git config --get merge.ff      # → only
```

### Installer les outils

```bash
# Installer les dépendances
pnpm install

# Vérifier que changesets est disponible
pnpm changeset --version
```

---

## 2 · WORKFLOW DÉVELOPPEUR (par feature)

### 2.1 Créer une branche feature

```bash
# Récupérer main à jour
git checkout main
git pull --rebase

# Créer branche courte
git checkout -b feat/user-profile
# Noms: feat/*, fix/*, chore/*, docs/*, test/*, refactor/*, ci/*, etc.
```

### 2.2 Implémenter + commit

```bash
# Éditer fichiers
# ...

# Commiter (avec lint + format)
pnpm lint:fix
pnpm format
git add .
git commit -m "feat: add user profile page"

# Messages: respecter conventional commits
# Types: feat, fix, chore, docs, test, refactor, ci, style, perf, revert, build
```

### 2.3 Créer un changeset (AVANT de merger)

```bash
pnpm changeset

# Sélectionner les packages affectés :
#   - @kraak/api
#   - @kraak/client
#   - @kraak/contracts
#   - @kraak/domain
#   - @kraak/api-client
#   - @kraak/tokens

# Sélectionner le type de version :
#   - patch (0.0.X) pour bugfix
#   - minor (0.X.0) pour feature
#   - major (X.0.0) pour breaking change

# Décrire le changement
# Exemple: "Add user profile page with avatar upload"

# Ceci crée .changeset/<hash>.md
```

### 2.4 Commit du changeset

```bash
git add .changeset/
git commit -m "chore: add changeset for user profile"
```

### 2.5 Pousser et ouvrir PR

```bash
# Pousser la branche
git push -u origin feat/user-profile

# Ouvrir PR via GitHub UI
# - Title: "feat: add user profile page"
# - Description: décrire le changement, référencer issues si applicable
# - Target : main
```

### 2.6 Attendre la revue et CI

- **CI** s'exécute automatiquement (lint, build, tests, type-check)
- **Revue humaine** : approve + request changes ou approve
- **Merge** : une fois approuvé et CI verte

---

## 3 · MERGE → STAGING (automatique)

Après que votre PR soit mergée vers `main` :

### 3.1 changesets.yml s'exécute

1. Détecte les fichiers `.changeset/*.md`
2. Exécute `changeset version` :
   - Bump versions dans `package.json` / `packages/*/package.json`
   - Génère `CHANGELOG.md`
   - Crée commit `chore: bump versions and update changelogs`
3. Crée une **PR de version** vers `main`

### 3.2 Review version PR

- Vérifier que les bumps sont corrects (patch/minor/major)
- Exemple : `v1.0.0` → `v1.1.0` (minor) ou `v1.0.1` (patch)
- Merge quand satisfait

### 3.3 promote-to-main.yml s'exécute

1. Détecte que version PR a été mergée vers `staging`
2. Rebase `staging` sur `main` et fast-forward
3. Promotion automatique : `staging` contient le commit de version
4. Push `staging` → déclenche déploiement Render + Vercel

### Déploiement staging

- **API** : Render service `kraak-api-staging` redéploie (2-3 min)
- **Web** : Vercel project staging redéploie (1-2 min)
- Supabase migrations appliquées si nécessaire

### Tester sur staging

```bash
# Récupérer les changements
git fetch origin

# Voir les versions bumpées
git log --oneline staging --not main  # commits en avance sur main
cat CHANGELOG.md  # vérifier le changelog

# Tester les services staging
curl https://kraak-api-staging.onrender.com/health
# → {"status": "ok"}
```

---

## 4 · TAG + PRODUCTION (automatique)

Une fois `staging` promu :

### 4.1 publish-release.yml s'exécute

1. Détecte le commit de version sur `main`
2. Exécute `changeset publish`
3. **Crée les tags SemVer** : `v1.1.0`, `v1.0.1`, etc.
4. Pousse les tags

### 4.2 release-prod.yml s'exécute

1. Déclenché par les tags `v*`
2. Build, tests rejoués sur le commit du tag
3. Supabase migrations prod (si nécessaire)
4. **Attente d'approbation** depuis GitHub Environment `production`
5. Déploie sur Render prod + Vercel prod
6. Smoke tests sur prod

### Suivi release prod

```bash
# Voir les tags créés
git fetch --tags
git log --oneline --decorate | head -20

# Voir release-prod en cours
# GitHub Actions → release-prod → observerles logs
```

---

## 5 · TROUBLESHOOTING

### "PR de version n'apparaît pas"

- changesets.yml a échoué → vérifier les logs GitHub Actions
- Généralement : `pnpm install` failed ou permission issue
- **Solution** : créer le changeset manuellement dans la branche et amendez le commit

### "CI échoue sur main"

- Lint, format, tests, type-check ont échoué
- **Solution** :
  ```bash
  git checkout feat/my-feature
  pnpm lint:fix
  pnpm format
  pnpm test
  pnpm typecheck
  git add .
  git commit -m "fix: linting and formatting issues"
  git push
  ```

### "Tags ne sont pas créés sur main"

- publish-release.yml a échoué
- Vérifier : commit doit être `"chore: bump versions..."`
- Vérifier : GitHub Actions permissions (contents: write)
- **Solution** : relancer manuellement
  ```bash
  GitHub Actions → publish-release → Run workflow
  ```

### "Impossible de merger PR (protection branch)"

- `main` requiert : CI verte + approvals + linear history
- **Solution** :
  ```bash
  # Rebase sur main (rebase-only strategy)
  git fetch origin main
  git rebase origin/main
  git push --force-with-lease origin feat/my-feature
  # Re-request review et attendre que CI passe
  ```

### "Merge conflict sur staging"

- `staging` doit toujours rester en fast-forward de `main`
- Si conflict : **c'est un incident**
- **Solution** :
  ```bash
  # Rollback
  git reset --hard origin/main
  git push --force-with-lease origin staging
  # Enquêter sur la cause du conflict
  ```

---

## 6 · BONNES PRATIQUES

✅ **Faites**

- Branches courtes (une tâche = une branche)
- Commits atomiques avec des messages clairs
- Changeset **avant** de merger (pour aller plus vite)
- Rebase local avant de pousser (évite merge commits)
- Tests locaux avant PR : `pnpm test`, `pnpm lint`, `pnpm typecheck`

❌ **Ne faites pas**

- Pusher directement sur `main` (protection branch l'empêchera)
- Utiliser `git push --force` sauf avec `--force-with-lease` et raison valide
- Combiner plusieurs features en une seule PR (une PR = une tâche)
- Merger sans CI verte
- Oublier le changeset (ira ralentir le release)

---

## 7 · EXEMPLE COMPLET : Feature to Production

```bash
# ═════════════════════════════════════════════════════════════════
# ÉTAPE 1 : Feature branch
# ═════════════════════════════════════════════════════════════════
git checkout main
git pull --rebase
git checkout -b feat/email-verification

# ... implémenter la feature ...

pnpm lint:fix
pnpm format
git add .
git commit -m "feat: add email verification flow"

# ═════════════════════════════════════════════════════════════════
# ÉTAPE 2 : Changeset
# ═════════════════════════════════════════════════════════════════
pnpm changeset
# Sélectionner @kraak/api (minor)
# Description: "Add email verification to auth module"

git add .changeset/
git commit -m "chore: add changeset for email verification"

# ═════════════════════════════════════════════════════════════════
# ÉTAPE 3 : PR vers main
# ═════════════════════════════════════════════════════════════════
git push -u origin feat/email-verification
# → Ouvrir PR via GitHub UI

# ═════════════════════════════════════════════════════════════════
# ÉTAPE 4 : CI + Revue (GitHub Actions) + Merge
# ═════════════════════════════════════════════════════════════════
# Attendre que CI passe ✅
# Obtenir approbations
# Merge (fast-forward)

# ═════════════════════════════════════════════════════════════════
# ÉTAPE 5 : Automatique — changesets.yml
# ═════════════════════════════════════════════════════════════════
# PR de version créée automatiquement : "chore: bump versions and update changelogs"
# Reviewer approuve

# ═════════════════════════════════════════════════════════════════
# ÉTAPE 6 : Automatique — promote-to-main.yml
# ═════════════════════════════════════════════════════════════════
# staging rebase et promeut sur main automatiquement
# Render staging + Vercel staging redéploient

# ═════════════════════════════════════════════════════════════════
# ÉTAPE 7 : Automatique — publish-release.yml
# ═════════════════════════════════════════════════════════════════
# Tag SemVer créé (ex: v1.1.0)
# release-prod.yml déclenché par le tag

# ═════════════════════════════════════════════════════════════════
# ÉTAPE 8 : Production (humain approuve)
# ═════════════════════════════════════════════════════════════════
# GitHub Environment production : approbation requise
# Déploiement prod Render + Vercel
# Smoke tests prod
# ✅ Release complète
```

---

## 8 · Diagramme complet

```
┌──────────────────────────────────────────────────────────────────┐
│ DÉVELOPPEUR                                                      │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ git checkout -b feat/feature-name                          │  │
│ │ ... edit code ...                                          │  │
│ │ pnpm lint:fix && pnpm format                               │  │
│ │ git commit -m "feat: description"                          │  │
│ │ pnpm changeset  (← VERSION BUMP)                           │  │
│ │ git commit -m "chore: add changeset"                       │  │
│ │ git push -u origin feat/feature-name                       │  │
│ │ ... PR review ...                                          │  │
│ │ MERGE                                                      │  │
│ └────────────────────────────────────────────────────────────┘  │
│                           ↓                                      │
└──────────────────────────────────────────────────────────────────┘
                            │
                  CI vérifie commit
                    (tests, lint...)
                            │
┌──────────────────────────────────────────────────────────────────┐
│ GITHUB ACTIONS — changesets.yml                                  │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ • changeset version                                        │  │
│ │ • bump package.json + CHANGELOG.md                         │  │
│ │ • create PR "chore: bump versions..."                      │  │
│ └────────────────────────────────────────────────────────────┘  │
│                           ↓                                      │
│ VERSION PR REVIEW (humain)                                       │
│                           ↓                                      │
│ MERGE vers staging                                               │
│ └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                            │
┌──────────────────────────────────────────────────────────────────┐
│ GITHUB ACTIONS — promote-to-main.yml                             │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ • git rebase main                                          │  │
│ │ • git push staging                                         │  │
│ │ • staging → main fast-forward                              │  │
│ └────────────────────────────────────────────────────────────┘  │
│                           ↓                                      │
│ STAGING DEPLOYMENT (automatique)                                 │
│ • Render kraak-api-staging redéploie (autoDeploy: true)          │
│ • Vercel staging redéploie                                       │
│ └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                            │
┌──────────────────────────────────────────────────────────────────┐
│ GITHUB ACTIONS — publish-release.yml                             │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ • changeset publish                                        │  │
│ │ • git tag v1.2.3                                           │  │
│ │ • git push --follow-tags                                   │  │
│ └────────────────────────────────────────────────────────────┘  │
│                           ↓                                      │
│ TAG v1.2.3 déclenche release-prod.yml                            │
│ └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                            │
┌──────────────────────────────────────────────────────────────────┐
│ GITHUB ACTIONS — release-prod.yml                                │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ • validate tag SemVer                                      │  │
│ │ • build + tests sur commit du tag                          │  │
│ │ • Supabase migrations prod (si nécessaire)                 │  │
│ │ • ⏸️  ATTENTE APPROBATION PRODUCTION (GitHub Environment)   │  │
│ │ • Deploy Render prod + Vercel prod                         │  │
│ │ • Smoke tests prod                                         │  │
│ │ ✅ Production live                                          │  │
│ └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 9 · Liens rapides

- **Setup** → Local configuration
- **Feature** → Branches courtes + commits atomiques
- **Changesets** → [`CHANGESETS.md`](CHANGESETS.md)
- **Staging** → [`STAGING_PROMOTION.md`](STAGING_PROMOTION.md)
- **Prod** → [`RELEASE_PROD.md`](RELEASE_PROD.md)
- **Règles Git** → [`AGENTS.md`](../../AGENTS.md) (Règles de workflow Git)

---

## 10 · Résumé rapide

| Étape      | Qui                 | Commande                 | Résultat             |
| ---------- | ------------------- | ------------------------ | -------------------- |
| Feature    | Dev                 | `git checkout -b feat/*` | Branche courte       |
| Changeset  | Dev                 | `pnpm changeset`         | `.changeset/*.md`    |
| Push       | Dev                 | `git push`               | PR review            |
| Merge      | Dev+CI              | Approve + merge          | Commit sur main      |
| Version PR | changesets.yml      | auto                     | PR version vers main |
| Staging    | promote-to-main.yml | auto                     | Déploiement staging  |
| Tag        | publish-release.yml | auto                     | `v*.*.* ` créé       |
| Prod       | release-prod.yml    | auto + humain            | Déploiement prod     |

---

**Ce flux est automatisé. Les développeurs créent features + changesets, le reste est orchestré par GitHub Actions.**
