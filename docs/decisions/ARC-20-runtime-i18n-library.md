---
status: active
owner: platform
last_reviewed: 2026-07-27
source_of_truth: true
---

# ARC-20 - Bibliothèque runtime i18n client

## Table des matières

- [ARC-20 - Bibliothèque runtime i18n client](#arc-20-bibliotheque-runtime-i18n-client)
  - [1. Contexte](#1-contexte)
  - [2. Décision](#2-decision)
  - [3. Comparaison résumée](#3-comparaison-resumee)
  - [4. Stratégie SSR, prerender et hydratation](#4-strategie-ssr-prerender-et-hydratation)
  - [5. Stratégie ICU](#5-strategie-icu)
  - [6. Frontière PrimeNG](#6-frontiere-primeng)
  - [7. Politique des clés manquantes](#7-politique-des-cles-manquantes)
  - [8. Rollback](#8-rollback)
  - [9. Références](#9-references)

| Champ          | Valeur                            |
| -------------- | --------------------------------- |
| **Statut**     | Acceptée                          |
| **Date**       | 2026-07-27                        |
| **Auteurs**    | Équipe KRAAK                      |
| **Dépendance** | ARC-19                            |
| **Portée**     | Angular web, Ionic Angular mobile |

## 1. Contexte

ARC-19 retient une internationalisation runtime partagée entre le web Angular et
le mobile Ionic Angular, protégée par un adaptateur applicatif KRAAK. La PR 2
doit choisir la bibliothèque runtime sans extraire les contenus applicatifs
existants, sans modifier les routes publiques, sans toucher au SEO et sans
changer Render.

Le workspace client utilise Angular 21.2.11, PrimeNG 21.1.5, Ionic Angular
8.6.0 et un rendu web SSR/prerender. Le choix doit donc prioriser une API
standalone actuelle, un chargement initial déterministe pour le serveur, une
réactivité runtime et une frontière propre avec PrimeNG.

## 2. Décision

KRAAK retient `@ngx-translate/core` en version majeure 18 comme bibliothèque
runtime de traduction client.

La dépendance installée pour le prototype est exactement
`@ngx-translate/core@18.0.0`. Le loader HTTP `@ngx-translate/http-loader` n'est
pas installé, car le prototype charge les petits catalogues JSON par imports
statiques afin de garder le rendu serveur synchrone et sans requête initiale.

La bibliothèque reste masquée par l'adaptateur Angular KRAAK exposé depuis
`apps/client/projects/shared/i18n`. Les applications web et mobile consomment
cet adaptateur, pas `TranslateService` directement.

## 3. Comparaison résumée

| Critère                        | `@ngx-translate/core@18.0.0`                                  | `@jsverse/transloco@8.4.0`                                           |
| ------------------------------ | ------------------------------------------------------------- | -------------------------------------------------------------------- |
| Compatibilité Angular courante | Peer `@angular/common` et `@angular/core` `>=18`              | Peer `@angular/core` `>=16.0.0`                                      |
| Standalone                     | API `provideTranslateService` native                          | API `provideTransloco` native                                        |
| Réactivité                     | État de langue et chargement exposés en signals               | API signal et rendu runtime documentés                               |
| SSR/prerender                  | Documentation v18 explicite pour SSR et catalogues préchargés | Documentation SSR officielle marquée comme obsolète                  |
| Hydratation                    | Même langue et mêmes messages préchargés évitent le flash     | Possible avec loader adapté, mais preuve documentaire moins actuelle |
| Catalogues statiques           | `setTranslation` avec imports JSON avant rendu                | Possible via loader custom ou préchargement                          |
| Catalogues lazy                | Loader custom et services enfants                             | Points forts avec scopes et lazy loading                             |
| ICU plural/select              | Extension documentée via compiler MessageFormat tiers         | Extension officielle `@jsverse/transloco-messageformat`              |
| PrimeNG                        | Intégration simple via effet applicatif et `setTranslation`   | Intégration simple via service applicatif                            |
| Ionic                          | Compatible car Angular runtime pur                            | Compatible car Angular runtime pur                                   |
| Clé manquante                  | `MissingTranslationHandler` et fallback `fr-CI`               | `missingHandler` et fallback configurables                           |
| Impact bundle                  | Une dépendance directe, pas de loader HTTP                    | Une dépendance directe, plus plugin si ICU immédiat                  |
| Organisation long terme        | Adéquat avec namespaces KRAAK et futurs loaders               | Plus fort pour scopes first-party                                    |

Transloco reste une alternative crédible, notamment pour des catalogues scopes
et son plugin MessageFormat officiel. Il n'est pas retenu pour cette étape, car
la documentation SSR actuelle disponible dans le site officiel est signalée
comme obsolète alors que le web KRAAK dépend déjà de SSR/prerender.

## 4. Stratégie SSR, prerender et hydratation

Le prototype importe statiquement les catalogues JSON `fr-CI` et `en-GB` dans
le bundle client. L'adaptateur enregistre le catalogue source et de repli
`fr-CI` avant le rendu, puis sélectionne `fr-CI` au bootstrap.

Cette stratégie garantit :

- un rendu serveur synchronement traduit en français ;
- la même locale initiale côté client ;
- aucune requête HTTP initiale de catalogue ;
- aucun flash de clé non traduite au premier rendu ;
- une voie future vers des loaders lazy par namespace quand les catalogues
  seront extraits.

## 5. Stratégie ICU

Le prototype ne compile pas encore les messages ICU au runtime. Il contient des
entrées de preuve `plural` et `select` dans le namespace prototype, et le
contrôle `i18n:check` vérifie leur structure et leurs variables.

Le chemin d'extension retenu est le slot `compiler` de ngx-translate avec un
compiler MessageFormat compatible. La documentation officielle de ngx-translate
référence le support de plugins de message formatting par `TranslateCompiler`.
L'installation d'un compiler ICU est différée à la PR qui exercera réellement
les pluriels/selects dans l'interface.

## 6. Frontière PrimeNG

PrimeNG reste une dépendance web uniquement. Le bridge
`provideKraakPrimeNgI18nBridge()` lit la section `primeng` des catalogues KRAAK
et appelle `PrimeNG.setTranslation()` au bootstrap puis à chaque changement de
locale.

Les textes KRAAK restent hors de PrimeNG. Le mobile ne reçoit pas de bridge
équivalent, car Ionic n'expose pas aujourd'hui de table globale comparable dans
l'usage détecté.

## 7. Politique des clés manquantes

Le fallback applicatif reste `fr-CI`. Si une clé est absente de la locale active
mais présente en `fr-CI`, ngx-translate sert la valeur française. Si une clé est
absente de toutes les locales chargées, le `MissingTranslationHandler` KRAAK
journalise un avertissement court et retourne une valeur déterministe
`[missing:<key>]`.

La validation de catalogues échoue si les catalogues supportés n'ont pas la même
structure, contiennent des valeurs vides ou utilisent des variables
d'interpolation divergentes.

## 8. Rollback

Rollback technique exact de cette étape :

```bash
git restore docs/README.md docs/decisions/README.md docs/decisions/ARC-20-runtime-i18n-library.md package.json apps/client/package.json pnpm-lock.yaml scripts/check-i18n-catalogs.mjs apps/client/projects/shared/i18n apps/client/projects/web/src/app/app.config.ts apps/client/projects/web/src/app/i18n-runtime-adapter.spec.ts apps/client/projects/mobile/src/app/app.config.ts apps/client/projects/mobile/src/app/i18n-runtime-adapter.spec.ts
```

Si la dépendance doit être retirée après installation locale :

```bash
pnpm --filter @kraak/client remove @ngx-translate/core
```

## 9. Références

- Documentation ngx-translate installation et compatibilité :
  <https://ngx-translate.org/getting-started/installation/>
- Migration ngx-translate v18 et support Angular :
  <https://ngx-translate.org/getting-started/migration-guide/>
- Configuration ngx-translate standalone :
  <https://ngx-translate.org/reference/configuration/>
- SSR et prerender ngx-translate :
  <https://ngx-translate.org/recipes/ssr-and-prerender/>
- Plugins ngx-translate et MessageFormat :
  <https://ngx-translate.org/resources/plugins/>
- Documentation Transloco :
  <https://jsverse.gitbook.io/transloco/getting-started/installation>
- Configuration Transloco :
  <https://jsverse.gitbook.io/transloco/getting-started/config-options>
- MessageFormat Transloco :
  <https://jsverse.gitbook.io/transloco/plugins-and-extensions/message-format>
