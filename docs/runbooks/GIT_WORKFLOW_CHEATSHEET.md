---
layout: cheatsheet
title: Git Workflow Cheatsheet
description: Quick reference for KRAAK development workflow
---

# GIT WORKFLOW — Cheat Sheet

> Commandes et étapes rapides pour développer dans KRAAK.

## 🚀 Première fois (Setup)

```bash
# Cloner
git clone https://github.com/Ange230700/kraak-consulting.git
cd kraak-consulting

# Configurer git (rebase-only + fast-forward)
# Sur macOS/Linux:
./scripts/setup-git-config.sh

# Sur Windows PowerShell:
.\scripts\setup-git-config.ps1

# Installer dépendances
pnpm install
```

## 📝 Feature workflow (par tâche)

```bash
# 1. Récupérer main à jour
git checkout main
git pull --rebase

# 2. Créer branche courte
git checkout -b feat/my-feature
# Noms: feat/*, fix/*, chore/*, docs/*, test/*, etc.

# 3. Éditer + committer
pnpm lint:fix && pnpm format
git add .
git commit -m "feat: add new feature"

# 4. Créer changeset (AVANT de pousser)
pnpm changeset
# Sélectionner packages + version type + description

git add .changeset/
git commit -m "chore: add changeset"

# 5. Pousser + PR
git push -u origin feat/my-feature
# → Ouvrir PR sur GitHub vers main

# 6. Attendre CI + revue
# → Merge (fast-forward)
```

## 📦 Changesets

```bash
# Créer changeset interactif
pnpm changeset

# Voir les changesets en attente
ls -la .changeset/

# Version bump (test local)
pnpm changesets:version

# Publish (test local)
pnpm changesets:publish
```

## 📊 Branches & status

```bash
# État local
git status

# Voir l'historique
git log --oneline -10
git log --oneline --decorate --graph

# Voir les branches
git branch -a

# Voir les tags
git tag -l | tail -20

# Récupérer dernière version main
git fetch origin main
git rebase origin/main
```

## 🔄 Promotion (automatique)

```bash
# Après que version PR soit mergée vers main:

# 1. promote-to-main.yml s'exécute
#    → main → staging (fast-forward)
#    → Render + Vercel redéploient automatiquement

# 2. publish-release.yml crée tags
#    → git tag v1.2.3
#    → release-prod.yml déploie en prod

# Vérifier
git fetch --tags
git log --oneline --decorate | head -20
```

## 🆘 Troubleshooting

### "Merge conflict"

```bash
# Rebaser sur main
git fetch origin main
git rebase origin/main
git push --force-with-lease origin feat/my-feature
```

### "Besoin d'amender le dernier commit"

```bash
git add .
git commit --amend --no-edit
git push --force-with-lease origin feat/my-feature
```

### "Oublié un fichier dans le commit"

```bash
git add <file>
git commit --amend --no-edit
git push --force-with-lease origin feat/my-feature
```

### "Annuler le dernier commit local (pas encore pushé)"

```bash
git reset HEAD~1
```

### "Annuler un push (danger! utiliser avec soin)"

```bash
# Si le commit n'a pas encore été mergé
git reset --hard origin/main
git push --force-with-lease origin feat/my-feature
```

## 📚 Links

- [Git Workflow Complet](GIT_WORKFLOW_COMPLETE.md) — Guide détaillé
- [Changesets Guide](CHANGESETS.md) — Gestion des versions
- [Staging Promotion](STAGING_PROMOTION.md) — Deploy staging
- [Release Production](RELEASE_PROD.md) — Deploy production

## 🎯 Résumé ultra-rapide

```bash
git checkout -b feat/x          # 1. Feature branch
# ... edit ...
pnpm lint:fix && pnpm format    # 2. Lint + format
git commit -m "feat: ..."       # 3. Commit
pnpm changeset                  # 4. Changeset
git commit -m "chore: ..."      # 5. Commit changeset
git push -u origin feat/x       # 6. Push + PR
# ... approve + merge ...
# → Automatique: version PR → tags → deploy
```
