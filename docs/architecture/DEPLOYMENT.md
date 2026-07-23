---
status: active
owner: platform
last_reviewed: 2026-07-23
source_of_truth: true
---

# Architecture de déploiement

KRAAK utilise Render pour le web et l'API, avec Supabase par environnement.

## Topologie courante

| Surface           | Staging             | Production          |
| ----------------- | ------------------- | ------------------- |
| Web               | `kraak-web-staging` | `kraak-web-prod`    |
| API               | `kraak-api-staging` | `kraak-api-prod`    |
| Base/Auth/Storage | Supabase staging    | Supabase production |

## Branches et déclencheurs

- `staging` est la branche d'intégration et déclenche la validation staging.
- `main` est la branche de release.
- La production est déclenchée par tag SemVer sur `main`.
- Les secrets et variables d'environnement restent hors dépôt.

## Sources liées

- [`../operations/DEPLOYMENT.md`](../operations/DEPLOYMENT.md) pour la procédure
  Render courante.
- [`../operations/STAGING_VALIDATION.md`](../operations/STAGING_VALIDATION.md)
  pour la validation staging.
- [`../operations/RELEASE_PROD.md`](../operations/RELEASE_PROD.md) pour la
  release production.
- [`../operations/ENVIRONMENTS.md`](../operations/ENVIRONMENTS.md) pour les
  variables d'environnement.
