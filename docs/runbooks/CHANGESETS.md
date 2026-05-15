# CHANGESETS — Gestion des versions et releases

> Guide pratique pour gérer les versions du monorepo KRAAK avec
> [changesets](https://github.com/changesets/changesets).

## Vue d'ensemble

Changesets automatise le versioning sémantique et la création de tags pour le
monorepo. Le flux complet est :

1. **Développeur** : Ajoute un changeset à `.changeset/*.md` dans la feature branch
2. **Feature branch mergée** : Code merged vers `main` avec changeset
3. **CI (changesets.yml)** : Sur push vers `main`, crée une **PR de version**
4. **Mainteneur** : Revue et merge la PR de version vers `main`
5. **CI (promote-to-main.yml)** : Promotion automatique `main → staging` (fast-forward)
6. **Staging deployment** : Push vers staging déclenche Render + Vercel
7. **CI (publish-release.yml)** : Crée tags SemVer (`v*.*.\*)
8. **CI (release-prod.yml)** : Tag SemVer déclenche déploiement production

Voir aussi :

- [`GIT_WORKFLOW_COMPLETE.md`](GIT_WORKFLOW_COMPLETE.md) — Workflow Git complet
- [`ARC-07-prod-release-tag-based`](../decisions/ARC-07-prod-release-tag-based.md)
- [`RELEASE_PROD.md`](RELEASE_PROD.md)
- [`STAGING_PROMOTION.md`](STAGING_PROMOTION.md)

---

## 1. Ajouter un changeset (développeur)

### Créer un changeset

**Avant de merger vers `main`**, créez un changeset qui documente votre
changement :

```bash
pnpm changeset
```

Ceci ouvre une CLI interactive qui demande :

1. **Quels packages changer ?** (sélectionner avec `SPC` / `ENT`)
   - `@kraak/api`
   - `@kraak/client`
   - `@kraak/contracts`
   - `@kraak/domain`
   - `@kraak/api-client`
   - `@kraak/tokens`

2. **Quel type de version ?**
   - `patch` = bugfix (0.0.X)
   - `minor` = nouvelle feature (0.X.0)
   - `major` = breaking change (X.0.0)

3. **Brève description** (ex: "Add user authentication flow")

Le changeset crée un fichier `.changeset/<hash>.md` contenant les détails.

### Exemple

```bash
$ pnpm changeset
? Which packages would you like to include?
 ◉ @kraak/api
 ◉ @kraak/client
 ◯ @kraak/contracts

? What kind of change is this? (Use arrow keys)
❯ patch
  minor
  major

? Describe what you changed
> Add email verification flow to auth module

✔ Changelog entry added
```

### Committer le changeset

```bash
git add .changeset/
git commit -m "chore: add changeset for email verification feature"
```

**Attention** : Oubliez le changeset ? Pas de problème — vous pouvez l'ajouter
dans une branche ultérieure avant merge vers `main`. Changesets attendra
tous les changesets avant de bumper.

---

## 2. Fusion vers `main` (workflow changesets.yml)

Quand vous mergez vers `main` :

1. **changesets.yml** détecte le push et exécute :
   - `changeset version` : calcule les nouvelles versions SemVer
   - Crée/met à jour un **CHANGELOG.md** à la racine
   - Bumpe les versions dans `package.json` / `packages/*/package.json`
   - Génère une **PR de version** (ex: "chore: bump versions and update
     changelogs")

2. **PR de version** :
   - Affiche un diff des changements : quels packages, quelles versions
   - Titre standardisé : `chore: bump versions and update changelogs`
   - Cible : `main` (reste sur `main`)

3. **Mainteneur** :
   - Revise la PR pour s'assurer que les bumps sont corrects
   - Merge vers `main` (👉 cela déclenche la promotion vers `staging`)

---

## 3. Promotion `main` → `staging` et publication (promote-to-main.yml + publish-release.yml)

Une fois la PR de version mergée vers `main`, deux workflows s'exécutent en séquence :

### Étape 1 — promote-to-main.yml

1. Détecte que version PR a été mergée vers `main`
2. Rebase et fast-forward `staging` sur `main`
3. Push `staging` → déclenche déploiement Render + Vercel

### Étape 2 — publish-release.yml

1. Détecte le commit de version sur `main`
2. Exécute `changeset publish`
3. **Crée les tags SemVer** (ex: `v1.2.3`)
4. Pousse les tags vers GitHub

### Étape 3 — release-prod.yml

1. Est déclenché automatiquement par les tags `v*`
2. Lance la build, tests, déploiements prod
3. Voir [`RELEASE_PROD.md`](RELEASE_PROD.md)

---

## 4. Workflows GitHub

### changesets.yml

```yaml
Trigger: push vers main (ou workflow_dispatch)
Branches: main
Actions: • Installe les dépendances
  • changesets/action@v1 crée/met à jour la PR de version
  • Bumpe automatiquement les versions
  • Génère CHANGELOG.md
```

### promote-to-main.yml

```yaml
Trigger: PR fermée vers main avec titre "chore: bump versions..."
Branches: main → staging
Actions:
  • Rebase staging sur main
  • Fast-forward staging
  • Pousse staging → déclenche déploiements (Render + Vercel)
```

### publish-release.yml

```yaml
Trigger: push vers main avec commit "chore: bump versions..."
Branches: main
Actions:
  • Exécute changeset publish (crée les tags SemVer)
  • Pousse les tags
  • release-prod.yml est déclenché par les tags
```

---

## 5. Configuration changesets

Fichier : `.changeset/config.json`

```json
{
  "baseBranch": "main",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "access": "restricted",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

- **baseBranch** : `main` (changesets compare main → branche courante)
- **commit** : `false` (GitHub Actions gère le commit)
- **access** : `restricted` (packages privés)
- **updateInternalDependencies** : `patch` (dépendances internes → patch bump)

---

## 6. Troubleshooting

### "Changeset file not found"

- Vous n'avez pas exécuté `pnpm changeset` avant de merger
- **Solution** : Créez le changeset dans une branche et amendez le commit, ou
  créez une PR séparée

### "Version PR ne s'ouvre pas"

- changesets.yml a échoué. Vérifier la sortie du workflow :
  - GitHub Actions → changesets.yml → Vérifier les logs
  - Généralement, c'est une erreur `pnpm install` ou de permissions

### "Tags ne sont pas créés après merge sur main"

- publish-release.yml a échoué. Vérifier :
  - Le commit sur `main` doit contenir `"chore: bump versions..."`
  - Logs du workflow publish-release.yml → `Publish` job
  - Permission `contents: write` vérifiée ? (oui, dans config)

### "Comment faire un bump manuel ?"

Pour tester ou forcer un bump en dehors du flux normal :

```bash
# Locally
pnpm changeset version
pnpm changeset publish

# Ou via workflow_dispatch
# GitHub Actions → changesets.yml → "Run workflow" → workflow_dispatch
```

---

## 7. Bonnes pratiques

✅ **Faites**

- Créer un changeset **avant de merger vers main**
- Une ligne concise dans le changeset : "Add auth email flow"
- Reclasser les changesets si un autre PR ajoute des changesets avant vôtre
- Attendre que promote-to-main.yml promeuve staging automatiquement après version PR merge

❌ **Ne faites pas**

- Pusher directement sur `main` ou `staging` (protection branch l'empêchera)
- Oublier le changeset (ralentit la release)
- Modifier `.changeset/config.json` ou les tags manuellement
- Combiner plusieurs features majeures en un seul changeset (= un changeset par
  feature cohérente)
- Faire un fast-forward manuel de staging vers main (c'est automatisé par promote-to-main.yml)

---

## 8. Exemple complet de workflow

```bash
# 1. Branche feature
git checkout -b feat/user-profile

# 2. Implémenter le feature
# ... edit files ...

# 3. Commit
git add .
git commit -m "feat: add user profile page"

# 4. Créer le changeset (avant de pousser)
pnpm changeset
# Sélectionner @kraak/client (minor)
# Description: "Add user profile page with avatar upload"

# 5. Commit du changeset
git add .changeset/
git commit -m "chore: add changeset for user profile feature"

# 6. Pousser et ouvrir PR vers main
git push -u origin feat/user-profile
# ... Ouvrir PR via GitHub UI ...

# 7. PR est mergée vers main
# → changesets.yml s'exécute, crée PR de version

# 8. Reviewer approuve la PR de version et merge vers main
# → promote-to-main.yml promeut main → staging (fast-forward)
# → Push staging déclenche déploiement Render + Vercel
# → publish-release.yml crée les tags (v1.1.0, etc.)
# → release-prod.yml déploie en prod (avec approbation)
```

---

## 9. Pour aller plus loin

- [Changesets documentation](https://github.com/changesets/changesets)
- [Semantic Versioning](https://semver.org)
- [`GIT_WORKFLOW_COMPLETE.md`](GIT_WORKFLOW_COMPLETE.md) — Workflow Git complet
- `docs/decisions/ARC-07-prod-release-tag-based.md`
