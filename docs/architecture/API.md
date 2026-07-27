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
  - [Internationalisation cible](#internationalisation-cible)
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

## Internationalisation cible

L'API exposera progressivement des codes d'erreur machine-readable stables,
associés aux statuts HTTP. Les clients web et mobile traduiront ces codes en
messages visibles dans leur propre catalogue. Les messages de debug resteront
séparés, courts et sans données sensibles.

Les e-mails et notifications rendus côté serveur appartiendront à des templates
localisés côté API. Leur locale cible viendra du choix explicite, du profil
utilisateur ou du contexte de requête, puis retombera sur `fr-CI`.

Cette PR ne modifie aucun contrôleur, aucune route, aucun DTO et aucune réponse
API.

## Sources liées

- [`DATA_MODEL.md`](DATA_MODEL.md) pour le modèle de données.
- [`../engineering/SHARED_PACKAGES.md`](../engineering/SHARED_PACKAGES.md) pour
  les packages partagés.
- [`../operations/SUPABASE_AUTH.md`](../operations/SUPABASE_AUTH.md) pour la
  configuration Supabase Auth.
- [`../decisions/ARC-19-i18n-localization-strategy.md`](../decisions/ARC-19-i18n-localization-strategy.md)
  pour la stratégie d'internationalisation français / anglais.
