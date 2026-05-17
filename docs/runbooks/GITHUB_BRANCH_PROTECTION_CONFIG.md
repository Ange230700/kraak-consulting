# GitHub Branch Protection & Governance Configuration

**Objectif** : Verrouiller `main` et `staging` pour garantir l'intégrité de l'historique Git et bloquer les merge commits.

**Audience** : Mainteneurs et administrateurs du dépôt.

**Dernière mise à jour** : 2026-05-17

---

## 1. Repository Settings > General > Pull Requests

Accès : Settings → Pull Requests

- [x] `Allow merge commits` → **OFF**
- [x] `Allow squash merging` → **OFF**
- [x] `Allow rebase merging` → **ON**
- [x] `Automatically delete head branches` → **ON**
- [x] `Always suggest updating pull request branches` → **ON**
- [x] `Allow auto-merge` → **OFF**

---

## 2. Branch Protection Rule : `main`

Accès : Settings → Branches → Add rule

**Pattern à protéger** : `main`

### Basic Settings

- [x] `Require a pull request before merging` → **ON**
  - [x] `Require approvals` → **1** (ou 2 pour changements sensibles)
  - [x] `Dismiss stale pull request approvals when new commits are pushed` → **ON**
  - [x] `Require review from Code Owners` → **ON**

### Status Checks & Validation

- [x] `Require status checks to pass before merging` → **ON**
- [x] `Require branches to be up to date before merging` → **ON**

**Required status checks** (noms exacts) :

- [x] `Format & Lint`
- [x] `Build`
- [x] `Tests unitaires`
- [x] `Tests E2E`
- [x] `Workspace Checks`
- [x] `SonarCloud Code Analysis` (si actif)

### Restrictions & Governance

- [x] `Require conversation resolution before merging` → **ON**
- [x] `Require linear history` → **ON**
- [ ] `Require signed commits` → **ON** (si équipe signe les commits)
- [x] `Require deployments to succeed before merging` → **OFF**
- [x] `Lock branch` → **OFF**
- [x] `Do not allow bypassing the above settings` → **ON**
- [ ] `Restrict who can push to matching branches` → **ON** (Maintainers only)
- [x] `Allow force pushes` → **OFF**
- [x] `Allow deletions` → **OFF**

---

## 3. Branch Protection Rule : `staging`

Accès : Settings → Branches → Add rule

**Pattern à protéger** : `staging`

### Basic Settings of `staging`

- [x] `Require a pull request before merging` → **ON**
  - [x] `Require approvals` → **1**
  - [x] `Dismiss stale pull request approvals when new commits are pushed` → **ON**
  - [x] `Require review from Code Owners` → **OFF** (optionnel)

### Status Checks & Validation for `staging`

- [x] `Require status checks to pass before merging` → **ON**
- [x] `Require branches to be up to date before merging` → **ON**

**Required status checks** (au minimum) :

- [x] `Build`
- [x] `Tests unitaires`
- [x] `Tests E2E`

### Restrictions & Governance for `staging`

- [x] `Require conversation resolution before merging` → **ON**
- [x] `Require linear history` → **ON**
- [x] `Require signed commits` → **OFF** (moins strict que main)
- [x] `Require deployments to succeed before merging` → **OFF**
- [x] `Do not allow bypassing the above settings` → **ON**
- [ ] `Restrict who can push to matching branches` → **ON** (Maintainers only)
- [x] `Allow force pushes` → **OFF**
- [x] `Allow deletions` → **OFF**

---

## 4. Rulesets (GitHub Enterprise / Pro)

Accès : Settings → Rules → Rulesets (si disponible)

### Ruleset : `Protect Main`

- [x] **Scope** : Target `main` branch
- [ ] **Rules** :
  - [x] `Block merge commits` → **ON**
  - [x] `Require pull request` → **ON** (1 approval)
  - [x] `Require status checks` → **ON**
  - [x] `Require linear history` → **ON**
  - [ ] `Restrict updates to` → **Maintainers only**
  - [x] `Restrict deletions` → **ON**

---

## 5. Environments pour Déploiement (Production)

Accès : Settings → Environments → Production

- [x] **Environment name** : `production`
- [x] `Required reviewers` → **ON** (1 minimum)
- [ ] Ajouter les mainteneurs comme reviewers autorisés
- [x] `Prevent administrators from bypassing configured protection rules` → **ON**
- [x] **Secrets** :
  - [x] `VERCEL_TOKEN`
  - [x] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] Autres selon la chaîne de déploiement

---

## 6. CODEOWNERS (optionnel mais recommandé)

Fichier : `.github/CODEOWNERS`

Exemple :

```text
# Tous les changements sur main requièrent review
* @Ange230700

# Domaines critiques
/apps/api/ @Ange230700
/apps/client/projects/web/ @Ange230700
/docs/runbooks/ @Ange230700
```

---

## 7. Validation Post-Configuration

### ✓ Vérifier en ligne

1. Aller sur **Settings → Branches**
   - [x] `main` a toutes les protections actives
   - [x] `staging` est moins strict mais linéaire

2. Aller sur **Settings → Rules** (si Rulesets disponible)
   - [x] `Protect Main` apparaît et couvre `main`

3. Aller sur **Pull requests**
   - [ ] Vérifier qu'aucune option merge commit n'est disponible

### ✓ Tester en local

```bash
# Depuis une branche de feature
git checkout -b test/governance-check
echo "test" > test.txt
git add test.txt
git commit -m "test: governance validation"
git push origin test/governance-check

# Créer une PR manuellement vers main via GitHub UI
# ✓ Vérifier que "Merge pull request" (merge commit) n'est PAS disponible
# ✓ Vérifier que "Rebase and merge" est l'option par défaut
```

---

## 8. Anti-Régression : Contrôle CI

Ajouter un job optionnel dans la CI pour vérifier l'absence de merge commits :

```yaml
name: Validate No Merge Commits

on:
  pull_request:
    branches: [main]

jobs:
  check-merge-commits:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Check for merge commits
        run: |
          MERGE_COMMITS=$(git log --oneline main..HEAD --grep="^Merge" || echo "")
          if [ -n "$MERGE_COMMITS" ]; then
            echo "❌ Merge commits detected:"
            echo "$MERGE_COMMITS"
            exit 1
          fi
          echo "✓ No merge commits found"
```

---

## 9. Politique de Relance (Workflow Futur)

Pour intégrer `staging` → `main` sans merge commit :

**Scénario** : Un correctif critique existe sur `staging` et doit aller en `main`.

```bash
# ❌ NE PAS FAIRE (ce qui a déclenché le bypass)
git checkout main
git merge --no-ff staging

# ✅ À LA PLACE
git checkout -b chore/cherry-pick-fix
git cherry-pick <commit-id-depuis-staging>
git push origin chore/cherry-pick-fix
# → Créer une PR vers main via GitHub UI
# → Fusionner en "Rebase and merge"
```

---

## 10. Checklist de Suivi Mensuel

**À faire une fois par mois** (5 minutes) :

- [ ] Vérifier qu'aucun bypass de branche protection n'a eu lieu

  ```bash
  git log --all --format="%H %s" | grep -i "merge commit" | head -5
  ```

- [ ] Vérifier que les règles sont toujours en place via UI
- [ ] Revoir les accès maintainer (Settings → Collaborators)
- [ ] Documenter tout changement de gouvernance dans ce fichier

---

## Références

- [GitHub Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- [AGENTS.md > Git Workflow](../../AGENTS.md#règles-de-workflow-git)
