# ARC-12 - Retrait des sections de prévisualisation du bundle de production

**Date :** 2026-05-14  
**Statut :** Appliqué

## Décision

Les sections de prévisualisation du site vitrine ne doivent plus être seulement
masquées en production. Elles doivent être **retirées du graphe de build
production** afin d'éviter d'embarquer :

- des logos partenaires factices
- des chiffres d'impact indicatifs
- des témoignages de démonstration
- la grille d'équipe de prévisualisation

## Mise en œuvre

Les pages vitrine importent désormais des wrappers dédiés :

- `HomePreviewSections`
- `AboutPreviewSections`

En local et en staging, ces wrappers rendent les composants de prévisualisation
réels.

En production, Angular remplace ces wrappers via `fileReplacements` dans
`apps/client/angular.json` :

- `home-preview-sections.component.ts`
- `about-preview-sections.component.ts`

par leurs variantes de production :

- `home-preview-sections.prod.component.ts`
- `about-preview-sections.prod.component.ts`

Ces variantes sont volontairement vides. Les composants de prévisualisation ne
sont donc plus importés par les pages dans le build production.

## Composants concernés

- Accueil :
  - `kraak-fading-partners`
  - `kraak-impact-stats`
  - `kraak-testimonials`
- À propos :
  - `kraak-team-grid`

## Conséquences

- Les sections restent visibles en local et en staging pour les revues produit.
- Les chaînes factices n'ont plus vocation à apparaître dans les chunks
  production.
- Le comportement ne dépend plus d'un simple `@if` runtime dans les pages.

## Validation attendue

1. `pnpm.cmd --dir apps/client ng build web --configuration production`
2. Vérifier dans `apps/client/dist/web` l'absence de chaînes de prévisualisation
   comme `Savannah Nguyen`, `Aïcha K.`, `1M+` ou `Prévisualisation`.
