---
status: active
owner: platform
last_reviewed: 2026-07-23
source_of_truth: true
---

<!-- ARCHITECTURE.md -->

# Architecture KRAAK

## Table des matières

- [Architecture KRAAK](#architecture-kraak)
  - [Décision globale](#decision-globale)
  - [Stack active](#stack-active)
  - [Garde-fous](#garde-fous)
  - [Sources de décision](#sources-de-decision)

Ce fichier est la synthèse d'architecture active du dépôt. Les détails
d'onboarding sont dans [`docs/architecture/OVERVIEW.md`](docs/architecture/OVERVIEW.md)
et les raisons des choix sont dans [`docs/decisions/`](docs/decisions/).

## Décision globale

KRAAK est un monorepo `pnpm` composé de :

- `apps/client` : workspace Angular commun ;
- `apps/client/projects/web` : site vitrine Angular avec PrimeNG, PrimeIcons et
  Tailwind CSS ;
- `apps/client/projects/mobile` : application Ionic Angular avec Capacitor ;
- `apps/api` : API NestJS ;
- `packages/tokens`, `packages/contracts`, `packages/domain`,
  `packages/api-client` : packages partagés ;
- `supabase/migrations` : migrations PostgreSQL/Supabase versionnées.

## Stack active

| Surface              | Choix actif                                           | Source détaillée                                                     |
| -------------------- | ----------------------------------------------------- | -------------------------------------------------------------------- |
| Web                  | Angular, PrimeNG, PrimeIcons, Tailwind CSS, prerender | [`docs/architecture/WEB.md`](docs/architecture/WEB.md)               |
| Mobile               | Ionic Angular, Capacitor, Android-first               | [`docs/architecture/MOBILE.md`](docs/architecture/MOBILE.md)         |
| API                  | NestJS, Swagger/OpenAPI à `/api-docs`                 | [`docs/architecture/API.md`](docs/architecture/API.md)               |
| Données/Auth/Storage | Supabase                                              | [`docs/architecture/DATA_MODEL.md`](docs/architecture/DATA_MODEL.md) |
| Déploiement          | Render web + API, Supabase par environnement          | [`docs/architecture/DEPLOYMENT.md`](docs/architecture/DEPLOYMENT.md) |

## Garde-fous

- Ne pas introduire d'ORM par défaut. Toute décision d'ORM doit être documentée
  dans `ARCHITECTURE.md` et `docs/decisions/` avant ajout.
- Ne pas ajouter de nouvelle pile frontend hors Angular sans ADR accepté.
- Ne pas déplacer une procédure opérationnelle dans l'architecture : les gestes
  d'exploitation vivent dans [`docs/operations/`](docs/operations/).
- Ne pas maintenir de descriptions parallèles du modèle de données : la source
  active est [`docs/architecture/DATA_MODEL.md`](docs/architecture/DATA_MODEL.md).

## Sources de décision

- [`ARC-01`](docs/decisions/ARC-01-architecture-cible-mvp.md) : architecture
  cible MVP.
- [`ARC-02`](docs/decisions/ARC-02-conventions-repo.md) : conventions dépôt.
- [`ARC-03`](docs/decisions/ARC-03-seo-prerender-strategy.md) : stratégie SEO et
  prerender.
- [`ARC-04`](docs/decisions/ARC-04-modeles-donnees-mvp.md) : modèles de données
  MVP.
- [`ARC-07`](docs/decisions/ARC-07-prod-release-tag-based.md) et
  [`ARC-09`](docs/decisions/ARC-09-inversion-main-staging.md) : release et
  branches.
- [`ARC-14`](docs/decisions/ARC-14-freeze-surface-vitrine-publique.md) et
  [`ARC-15`](docs/decisions/ARC-15-positionnement-page-ressources-vitrine.md) :
  surface vitrine publique.
- [`ARC-16`](docs/decisions/ARC-16-render-only-web-hosting.md) : hébergement web
  Render.
