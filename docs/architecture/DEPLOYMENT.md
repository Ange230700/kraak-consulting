---
status: active
owner: platform
last_reviewed: 2026-10-27
source_of_truth: true
---

# Architecture de déploiement

## Table des matières

- [Architecture de déploiement](#architecture-de-deploiement)
  - [Topologie cible](#topologie-cible)
  - [Transition et sécurité](#transition-et-securite)
  - [Sources](#sources)

## Topologie cible

- Une seule branche permanente : `main`, protégée et alimentée par PR.
- Web Angular prerender : Render `kraak-web-prod`.
- API NestJS : Render `kraak-api-prod`.
- Données, Auth et Storage : Supabase de production.
- Développement : Angular, NestJS et Supabase locaux.
- Validation : CI, navigateurs Playwright et PostgreSQL éphémères.

Aucun service payant de remplacement ni environnement distant permanent de test
n’est introduit. Le Blueprint ne déclare que les deux services de production,
sur `main`, avec `autoDeploy: false`. Les tags SemVer accessibles depuis `main`
restent nécessaires aux déploiements contrôlés.

Le build web publie les arbres localisés `/fr/` et `/en/`, leurs assets, le
sitemap, les directives robots et les redirections historiques dans `public`.

## Transition et sécurité

La topologie cible ne prouve pas la suppression des anciennes ressources.
L’[état vérifié de la transition](../operations/PRODUCTION_ONLY_TRANSITION.md)
distingue la configuration du dépôt des déploiements et suppressions réellement
constatés. Ne jamais supprimer une base contenant des données uniques sur la
seule foi d’une modification du Blueprint.

## Sources

- [Décision production unique](../decisions/ARC-22-production-only-main.md).
- [Variables d’environnement](../operations/ENVIRONMENTS.md).
- [Déploiement](../operations/DEPLOYMENT.md).
- [Release et rollback](../operations/RELEASE_PROD.md).
