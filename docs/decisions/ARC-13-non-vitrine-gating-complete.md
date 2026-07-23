---
status: active
owner: platform
last_reviewed: 2026-07-23
source_of_truth: true
---

<!-- docs\decisions\ARC-13-non-vitrine-gating-complete.md -->

# ARC-13 - Gating des routes non vitrines côté web

**Date :** 2026-05-14  
**Statut :** Appliqué

## Décision

Les routes d'authentification et d'espace participant ne doivent pas être
publiées en production par défaut. Le gating repose sur deux niveaux :

1. **Compilation** : remplacement du module `participant-area.routes.ts` en production
2. **Runtime** : vérification `canMatch` via `isParticipantAreaEnabled()`

## Source de vérité

Le flag d'environnement `enableParticipantArea` est défini dans les fichiers :

- `environment.local.ts` : `true`
- `environment.staging.ts` : `true`
- `environment.production.ts` : `false`

Le helper `isParticipantAreaEnabled()` utilise ensuite :

1. la valeur runtime injectée dans `globalThis.__KRAAK_RUNTIME_CONFIG__`
2. sinon la valeur du fichier d'environnement

Ce fallback permet :

- un build prod qui exclut les routes par défaut
- un override runtime explicite si nécessaire

## Routes concernées

- `/connexion`
- `/inscription`
- `/mot-de-passe-oublie`
- `/participant/**`

## Mise en œuvre

### 1. Remplacement du module de routes au build

Le fichier `participant-area.routes.ts` est remplacé en production par
`participant-area.prod.routes.ts` via `fileReplacements`.

La variante production exporte :

- `participantAreaRoutes = []`
- `participantAreaCanMatch = () => false`

Le build production n'importe donc plus les `loadComponent()` des pages auth et
participant.

### 2. Inclusion conditionnelle dans `buildRoutes()`

`buildRoutes()` n'ajoute `participantAreaRoutes` que si
`includeParticipantArea` est vrai.

La constante exportée `routes` suit la valeur de
`environment.enableParticipantArea`.

### 3. Verrou runtime complémentaire

Chaque route auth/participant porte aussi :

- `canMatch: [participantAreaCanMatch]`

Ainsi, même dans un build non production, un override runtime peut encore
désactiver l'accès.

### 4. Navigation cohérente

Le wrapper `participant-nav-cta.component.ts` est remplacé en production par
`participant-nav-cta.prod.component.ts`.

Le lien réel reste porté par `participant-nav-cta-link.component.ts`, importé
uniquement hors production par le wrapper standard.

La navigation lit donc toujours le même helper `isParticipantAreaEnabled()`
hors production, sans livrer un lien caché dans le bundle vitrine.

### 5. Prerender limité aux pages publiques

Le prerender SSR ne cible plus `**`. Il est restreint aux pages marketing
publiques afin d'éviter de générer des artefacts statiques pour des routes non
vitrines.

## Conséquences

- En production, les routes auth/participant ne sont plus dans la table de
  routes par défaut.
- Le manifest de prerender ne doit plus contenir les pages
  `/connexion`, `/inscription`, `/mot-de-passe-oublie` ni
  `/participant/dashboard`.
- Le CTA `Espace participant` n'est plus livré dans le bundle production.
- En local et en staging, le flux participant reste disponible pour les tests.

## Validation attendue

1. `pnpm.cmd --dir apps/client ng test web --watch=false --include=projects/web/src/app/app.routes.spec.ts`
2. `pnpm.cmd --dir apps/client ng build web --configuration production`
3. Vérifier dans `apps/client/dist/web/prerendered-routes.json` l'absence des
   routes auth/participant.
