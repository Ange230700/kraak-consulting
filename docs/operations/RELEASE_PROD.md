---
status: active
owner: platform
last_reviewed: 2026-07-23
source_of_truth: true
---

# RELEASE_PROD — Procédure de release production

> Document de référence pour livrer une version en production. Toute release
> prod **doit** suivre cette procédure, sans exception.

Voir aussi : [`ARC-07-prod-release-tag-based`](../decisions/ARC-07-prod-release-tag-based.md),
[`STAGING_VALIDATION`](STAGING_VALIDATION.md),
[`INCIDENT_ROLLBACK`](INCIDENT_ROLLBACK.md),
[`DEPLOYMENT`](DEPLOYMENT.md).

## Principes

- **Tag SemVer = seul déclencheur prod.** Un push sur `main` ne déploie rien
  automatiquement ; le déclencheur staging est la branche longue `staging`,
  avancée par PR de travail depuis les branches courtes (cf.
  [`ARC-08`](../decisions/ARC-08-staging-environment.md) et
  [`STAGING_VALIDATION`](STAGING_VALIDATION.md)).
- **Approbation humaine obligatoire** via le GitHub Environment `production`.
- **Aucun secret prod** dans le repo, ni en local. Tout passe par GitHub
  Secrets, Render Env.
- **Rollback = re-deploy d'un tag antérieur.** Jamais de `git push --force` ni
  `git tag -f`.

## Pré-requis (à provisionner une seule fois)

### 1. GitHub Environment `production`

Dans `Settings → Environments → New environment` :

- Nom : `production`
- Required reviewers : au moins 1 (idéalement 2 mainteneurs distincts)
- Wait timer : 5 min (fenêtre d'annulation manuelle)
- Deployment branches and tags : restreindre aux tags matchant `v*`
- Secrets de l'environnement (jamais ailleurs) :
  - `RENDER_API_KEY`
  - `RENDER_PROD_SERVICE_ID`
  - `PROD_API_HEALTH_URL` (URL absolue vers `/health` du service prod)
  - `RENDER_PROD_WEB_SERVICE_ID`
  - `PROD_WEB_URL` (URL absolue de la home web prod)
  - `SUPABASE_ACCESS_TOKEN` (token CLI Supabase pour `link` + `db push`)
  - `SUPABASE_PROD_PROJECT_REF` (ref du projet Supabase prod, distinct de staging)
  - `SUPABASE_PROD_DB_PASSWORD` (mot de passe Postgres pour `db push`)

L'absence d'un seul de ces secrets fera échouer le workflow `release-prod` lors
des étapes migration ou smoke test.

### 2. Branch protection sur `main`

- Required pull request reviews avant merge (≥ 1)
- Required status checks (noms exacts tels que définis dans
  `.github/workflows/ci.yml`) :
  - `Format & Lint`
  - `Build`
  - `Tests unitaires`
  - `Workspace Checks`
- Linear history (rebase only — déjà aligné avec le workflow Git du repo)
- Restrict who can push : mainteneurs uniquement

### 3. Render — service prod

- Créer un service Render distinct `kraak-api-prod` (déclaré dans
  `render.yaml`).
- Branch : `main`.
- `autoDeploy: false` ⇒ Render ne déploie pas sur push `main`.
- Variables d'environnement prod renseignées via l'UI Render
  (jamais commitées), dont `NODE_ENV=production` et `APP_ENV=production`.
- Les déploiements prod sont déclenchés via API Render depuis le workflow
  `release-prod.yml`.

### 4. Render — projet web prod

- Production Branch : `main`.
- Auto-deploy désactivé.
- Publish directory : `public` (`staticPublishPath: public` dans `render.yaml`).
- Le sous-domaine Render `kraak-web-prod.onrender.com` doit rester activé tant
  que la validation de production exige un HTTP 200 sur cette URL.
- Les déploiements prod sont déclenchés via API Render depuis le workflow.
- Variables d'environnement prod renseignées via l'UI Render sur la cible
  `Production`.

### 5. Supabase — projet prod séparé

- Créer un projet Supabase **distinct** `kraak-prod` (jamais partagé avec
  staging).
- Appliquer les migrations via :

  ```bash
  pnpm supabase link --project-ref "$SUPABASE_PROD_PROJECT_REF"
  pnpm supabase db push
  ```

- Sauvegardes activées (point-in-time recovery selon plan).
- RLS et politiques validées en staging avant tout `db push` prod.

## Procédure de release (par version)

### Étape 1 — Pré-vol staging

- `main` est verte sur la CI.
- Le commit que l'on s'apprête à tagger est déployé en staging et fonctionne.
- La checklist [`DEP-07_GO_NO_GO_PILOT_RELEASE`](../archive/pilot-2026-04/DEP-07_GO_NO_GO_PILOT_RELEASE_2026-04-30.md)
  est exécutée et signée.

### Étape 2 — Tag SemVer

Depuis `main` à jour :

```bash
git checkout main
git pull --rebase
git tag -a v1.2.0 -m "Release v1.2.0 — résumé bref des changements"
git push origin v1.2.0
```

Règles SemVer dans ce repo :

- `MAJOR` (`v2.0.0`) : breaking change visible utilisateur ou contrat API
- `MINOR` (`v1.2.0`) : nouvelle fonctionnalité rétrocompatible
- `PATCH` (`v1.0.1`) : correction de bug rétrocompatible
- Pré-release autorisée : `v1.2.0-rc.1`, `v1.2.0-beta.1` (pas de promotion auto
  vers prod sans approbation explicite)

### Étape 3 — Workflow `release-prod`

Le push du tag déclenche `.github/workflows/release-prod.yml` :

1. Build et tests rejoués sur le commit tagué.
2. Le job `deploy-prod` attend l'approbation du GitHub Environment
   `production`.
3. Migrations Supabase prod appliquées (si présentes).
4. Déploiement Render prod via API.
5. Déploiement du web prod Render via API.
6. Smoke test prod (`/health`, page d'accueil web).

### Étape 4 — Validation post-deploy

- Vérifier `/health` de l'API prod (status `ok`, `environment=production`,
  `version` correspondant au tag).
- Vérifier la home web prod (HTTP 200, marque KRAAK visible).
- Vérifier les logs Render pour absence d'erreurs au démarrage.
- Marquer la GitHub Release associée au tag (`gh release create v1.2.0
--generate-notes`).

### Étape 5 — Clôture

- Mettre à jour les items GitHub Project liés en `Done` si non déjà fait.
- Annoncer la release dans le canal d'équipe (référence : tag + lien Release).
- Conserver l'historique : ne jamais supprimer un tag prod, même cassé
  (forward-fix uniquement).

## Rollback

Procédure d'urgence détaillée dans [`INCIDENT_ROLLBACK`](INCIDENT_ROLLBACK.md).

Synthèse :

- **Forward-fix préféré** : créer un tag patch (`v1.2.1`) à partir d'un commit
  correctif sur `main`.
- **Rollback strict** : re-déclencher manuellement le workflow `release-prod`
  sur un tag antérieur stable (`workflow_dispatch` avec `tag` en input — voir
  workflow).
- Les variables d'environnement prod ne sont **jamais** modifiées en
  rollback ; seul le code change.

## Politique de secrets

- `apps/api/.env.prod` est gitignoré et ne doit exister qu'à titre de test
  local ponctuel d'un ingénieur autorisé. Il **ne sert pas** à la prod réelle.
- Tous les secrets prod vivent dans :
  - GitHub Environment `production` (pour le workflow CI/CD)
  - Render Env (pour le runtime API)
  - Render Env (pour le runtime web)
- Toute rotation de secret se fait dans **les trois endroits** simultanément.

## Anti-patterns interdits

- ❌ Déployer prod sans tag (`workflow_dispatch` direct sans tag input
  vérifié).
- ❌ Pousser un commit directement sur `main` sans PR pour préparer une
  release.
- ❌ Réutiliser le projet Supabase staging pour des données prod.
- ❌ Copier `.env.prod` depuis le repo (il n'a pas vocation à contenir les
  vraies valeurs).
- ❌ `git tag -f` ou `git push --force` sur un tag prod.
- ❌ Désactiver l'environnement GitHub `production` ou ses required reviewers
  pour aller plus vite.

## Addendum dry-run pre-prod (PR-06)

Avant toute nouvelle vague fonctionnelle majeure (ex: routes protegees),
realiser un dry-run documente de la chaîne release prod.

### Procedure minimale de dry-run

1. Lister les workflows disponibles :

```bash
gh workflow list
```

1. Déclencher le workflow release prod en dry-run (si input dédié present) ou
   sur une reference de test non publiée.

```bash
gh workflow run release-prod.yml
gh run list --workflow release-prod.yml
```

1. Verifier et tracer les étapes critiques :

- preparation / build / tests
- gate d'approbation environment `production`
- migrations Supabase (ou skip explicite)
- déploiement Render (ou simulation explicite)
- smoke final

### Critères go/no-go de process

- aucune ambiguïté dans la sequence `tag -> validation -> déploiement`
- aucun secret manquant ou variable non résolue
- aucun trou de procedure non documente

Conserver la preuve dans les runbooks de deployment/evidence associes.
