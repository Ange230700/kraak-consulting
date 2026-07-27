---
status: active
owner: platform
last_reviewed: 2026-07-23
source_of_truth: true
---

# Architecture web

## Table des matières

- [Architecture web](#architecture-web)
  - [Contrat courant](#contrat-courant)
  - [Implémentation active](#implementation-active)
  - [Internationalisation cible](#internationalisation-cible)
  - [Sources liées](#sources-liees)

Le site web KRAAK est l'application Angular publique située dans
`apps/client/projects/web`.

## Contrat courant

- Framework : Angular.
- UI : PrimeNG, PrimeIcons et Tailwind CSS.
- Rendu : prerender Angular pour les routes vitrines publiques.
- Style : classes Tailwind et composants PrimeNG, sans `style` inline ni fichier
  CSS/SCSS par composant.
- Icônes : PrimeIcons pour les icônes UI.
- Surface publique gelée : `/`, `/a-propos`, `/services`, `/faq`,
  `/programmes`, `/ressources`, `/contact`, pages légales et pages d'erreur.
- Internationalisation : `fr-CI` restera la locale source et de repli, `en-GB`
  sera la première locale anglaise cible selon ARC-19.

## Implémentation active

- Routes publiques : [`../../apps/client/projects/web/src/app/app.routes.ts`](../../apps/client/projects/web/src/app/app.routes.ts).
- Prerender public : [`../../apps/client/projects/web/src/app/app.routes.server.ts`](../../apps/client/projects/web/src/app/app.routes.server.ts).
- Tests de surface : [`../../apps/client/projects/web/src/app/app.routes.spec.ts`](../../apps/client/projects/web/src/app/app.routes.spec.ts)
  et [`../../apps/client/projects/web/src/app/app.routes.server.spec.ts`](../../apps/client/projects/web/src/app/app.routes.server.spec.ts).
- Historique design : [`../archive/vitrine-design/`](../archive/vitrine-design/),
  à consulter uniquement comme archive.

## Internationalisation cible

Les routes publiques web utiliseront plus tard des chemins canoniques préfixés
par locale : `/fr/...` pour le français et `/en/...` pour l'anglais. La racine
`/` devra rediriger durablement vers `/fr/`, et les chemins publics français
existants devront rediriger vers leurs équivalents `/fr/...`.

Le prerender, les métadonnées SEO, les canonicals, les liens `hreflang`, les
entrées sitemap et l'attribut `<html lang>` devront être générés par locale. Les
routes d'authentification technique, notamment les callbacks et liens de
réinitialisation, devront rester compatibles avec Supabase Auth avant toute
localisation de chemin.

Cette PR ne modifie aucune route, aucun catalogue et aucun comportement web.

## Sources liées

- [`ARC-03`](../decisions/ARC-03-seo-prerender-strategy.md) pour la stratégie de
  prerender.
- [`ARC-14`](../decisions/ARC-14-freeze-surface-vitrine-publique.md) pour le gel
  de la surface vitrine.
- [`ARC-15`](../decisions/ARC-15-positionnement-page-ressources-vitrine.md) pour
  le positionnement de `/ressources`.
- [`../engineering/UI_COMPONENT_MAPPING.md`](../engineering/UI_COMPONENT_MAPPING.md)
  pour le mapping PrimeNG/Ionic.
- [`../engineering/UI_FEEDBACK.md`](../engineering/UI_FEEDBACK.md) pour les
  messages et toasts web.
- [`ARC-19`](../decisions/ARC-19-i18n-localization-strategy.md) pour la stratégie
  d'internationalisation français / anglais.
