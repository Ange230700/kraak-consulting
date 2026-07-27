---
status: active
owner: platform
last_reviewed: 2026-07-23
source_of_truth: true
---

# Architecture API

## Table des matières

- [Architecture API](#architecture-api)
  - [Contrat courant](#contrat-courant)
  - [Structure minimale](#structure-minimale)
  - [Sources liées](#sources-liees)

L'API KRAAK est l'application NestJS située dans `apps/api`.

## Contrat courant

- Framework : NestJS.
- Documentation : Swagger/OpenAPI exposé à `/api-docs`.
- Contrats : DTO et types partagés via `packages/contracts` lorsque le partage
  web/mobile/API est utile.
- Validation : validation explicite sans `class-validator` par défaut.
- Données, auth et stockage : Supabase.
- ORM : aucun ORM par défaut ; toute introduction doit être décidée et
  documentée avant ajout.

## Structure minimale

Chaque module exposant une route doit garder :

- `<name>.module.ts`
- `<name>.controller.ts`
- `<name>.controller.spec.ts`
- `<name>.service.ts`
- `<name>.service.spec.ts`

Tout payload d'entrée complexe ajoute `<name>.dto.ts` et
`<name>.dto.spec.ts`.

## Sources liées

- [`DATA_MODEL.md`](DATA_MODEL.md) pour le modèle de données.
- [`../engineering/SHARED_PACKAGES.md`](../engineering/SHARED_PACKAGES.md) pour
  les packages partagés.
- [`../operations/SUPABASE_AUTH.md`](../operations/SUPABASE_AUTH.md) pour la
  configuration Supabase Auth.
