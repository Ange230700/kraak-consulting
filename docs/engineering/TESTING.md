---
status: active
owner: platform
last_reviewed: 2026-10-25
source_of_truth: true
---

# Tests et couverture MVP

## Table des matières

- [Tests et couverture MVP](#tests-et-couverture-mvp)
  - [1) Objectif](#1-objectif)
  - [2) Preconditions (dépendances)](#2-preconditions-dependances)
  - [3) Definition de done coverage (minimum)](#3-definition-de-done-coverage-minimum)
    - [Seuils exécutables locaux et CI](#seuils-executables-locaux-et-ci)
  - [4) Matrice de couverture cible](#4-matrice-de-couverture-cible)
  - [5) Scénarios critiques prioritaires](#5-scenarios-critiques-prioritaires)
  - [6) Mapping vers les suites existantes (état au 30/04/2026)](#6-mapping-vers-les-suites-existantes-etat-au-30042026)
  - [7) Evidence de validation QAT-01](#7-evidence-de-validation-qat-01)
  - [8) Utilisation opérationnelle pour les prochaines tâches](#8-utilisation-operationnelle-pour-les-prochaines-taches)

Mise à jour: 25 octobre 2026
Portée: MVP KRAAK (web public, web participant, mobile participant, API support)

## 1) Objectif

Définir une matrice de couverture de test exploitable par:

- QAT-02 (tests unitaires/composants)
- QAT-03 (tests integration API)
- QAT-04 (tests E2E Given/When/Then)

La matrice impose 3 vues de couverture pour chaque flux critique:

- Page: une preuve de rendu/navigation sur la page cible
- Composant: une preuve unitaire/composant sur les blocs critiques
- Comportement: un scénario orienté utilisateur en Given/When/Then

## 2) Preconditions (dépendances)

QAT-01 dépend de SET-04 et SET-05.

Evidence SET-04 (runners unitaires + integration):

- `apps/api/jest.config.ts` actif pour les specs API NestJS
- scripts root disponibles: `test:api`, `test:unit`, `test:workspace`
- specs présentes sur web/mobile/API (fichiers `*.spec.ts`)

Evidence SET-05 (Playwright E2E + smoke):

- `apps/client/playwright.config.ts` configure sur `apps/client/tests/e2e`
- script root `test:e2e` et script client `e2e`
- scénarios smoke/BDD présents dans `apps/client/tests/e2e/*.spec.ts`

## 3) Definition de done coverage (minimum)

Une fonctionnalité est considérée couverte si les 3 conditions sont vraies:

1. Couverture page:
   - 1 test qui valide la route/page principale
   - 1 assertion de contenu visible critique (titre, CTA, état vide/erreur)
2. Couverture composant:
   - 1 spec pour chaque composant critique de la page
   - assertions sur inputs/outputs (ou interaction UI equivalent)
3. Couverture comportement:
   - 1 scénario Given/When/Then testant le parcours utilisateur principal
   - 1 scénario Given/When/Then sur le cas d'échec prioritaire

### Seuils exécutables locaux et CI

`pnpm check` est le contrat commun des hooks Husky et du job CI `Quality gate`.
`pnpm check:full` ajoute les builds, les E2E et l'analyse SonarCloud bloquante.
`pnpm coverage` (alias de `pnpm test:coverage`) mesure toutes les surfaces et
retourne un échec si une seule n'atteint pas ses seuils. Les surfaces de couverture
continuent à être mesurées après un échec pour conserver un diagnostic complet.

| Surface                          | Outil                 | Sources                                                | Rapports                             |
| -------------------------------- | --------------------- | ------------------------------------------------------ | ------------------------------------ |
| Scripts et configurations racine | c8 + Node test runner | `scripts/**/*.mjs` et configurations JS/CJS/MJS racine | `coverage/`                          |
| API, unités et intégration       | Jest                  | `apps/api/src/**/*.ts`                                 | `apps/api/coverage/`                 |
| Web et mobile                    | Vitest via Angular    | `apps/client/projects/{web,mobile}/src/**/*.ts`        | `apps/client/coverage/{web,mobile}/` |
| Packages partagés                | Vitest                | `packages/*/src/**/*.ts`                               | `packages/*/coverage/`               |

Pour chaque fichier exécutable, **instructions, branches, fonctions et lignes
doivent toutes atteindre 100 %**, pas seulement une moyenne globale. Les
sources non importées par les tests sont incluses. Les tests et déclarations
TypeScript ne sont pas des sources à couvrir ; les fichiers de types sans code
exécutable n'ajoutent pas artificiellement de lignes à la mesure. Les templates,
CSS et migrations SQL ne relèvent pas de cette mesure JavaScript/TypeScript ;
leurs validations dédiées restent nécessaires.

Les rapports LCOV et `coverage-summary.json` sont générés pour chaque surface,
et conservés comme artefacts Actions lorsqu'ils existent, même si un seuil
échoue. Les tests des scripts sont découverts par les motifs
`scripts/**/*.test.mjs` et `scripts/**/*.spec.mjs`, sous-répertoires inclus.
Les runners Node et Vitest Angular limitent l'exécution à quatre fichiers en parallèle pour éviter la
saturation des sous-processus natifs sur les machines partagées, sans réduire
le nombre de tests ni les seuils de couverture.
Les trois scénarios du générateur d'icônes exécutent réellement `sharp` dans un
processus Node dédié, hors du canal de sérialisation V8 du runner, qui présente
des erreurs intermittentes avec cette dépendance native sous Windows. Le runner
vérifie le code de sortie et les trois résultats ; c8 collecte aussi la couverture
de ce processus.
Jest compile l'API avec les métadonnées TypeScript complètes
(`isolatedModules: false`) : les branches mesurées correspondent au code exécuté
et non aux gardes de types ajoutées par une transpilation isolée des décorateurs
NestJS.
L'alias TypeScript de l'API vers les contrats est relatif au `baseUrl` racine,
et pointe sur les sources pour fonctionner aussi sans packages précompilés.
Les tests des outils Windows utilisent un environnement système de fixture.
Le processus des scénarios d'icônes sélectionne explicitement le reporter TAP
pour conserver le même contrat de résultat entre versions de Node.

Les tests Angular web et mobile utilisent explicitement la configuration de
build `test`, sans `fileReplacements`. Ils exécutent ainsi les véritables modules
`environment.ts`, local, staging et production au lieu de remplacer le module
par défaut pendant la compilation. Le module par défaut conserve la configuration
locale ; les configurations des builds déployés restent inchangées.
Les scénarios de démarrage SSR disposent d'un délai de 60 secondes pour charger
à froid le graphe Angular serveur sur une machine partagée. Les autres tests
conservent leur délai de 15 secondes ; aucune assertion ni exigence de couverture
n'est retirée.

Sonar utilise les huit rapports LCOV, y compris celui de c8, sans exclusion
manuelle de services, contrôleurs, pages ou scripts pour améliorer les chiffres.
Lancer `pnpm coverage`, puis `pnpm sonar` pour publier une mesure locale à jour.
Le scanner attend le résultat serveur avec `sonar.qualitygate.wait=true` :
un Quality Gate refusé bloque la commande. `SONAR_TOKEN` provient de
`.env.local` ou de l'environnement ; en Actions, il provient du secret du dépôt.
Les PR de forks exécutent les contrôles hors ligne, mais pas le scan authentifié.
Le Quality Gate distant et la désactivation de l'analyse automatique SonarCloud
doivent être configurés côté service ; le dépôt ne peut pas les imposer par un
fichier de propriétés.

Ces règles définissent une **exigence**, pas une attestation de couverture
actuellement atteinte. Une lacune existante doit être corrigée par de vrais tests,
jamais par une baisse de seuil, une exclusion métier ou un contournement de hook.
Tant que le contrôle bloque, ne pas fusionner et laisser le suivi ouvert.

## 4) Matrice de couverture cible

| Flux critique MVP                      | Page(s) cible(s)                           | Composants critiques                                    | Comportements critiques (Given/When/Then)                                          | Cible QAT-02 | Cible QAT-03                  | Cible QAT-04 |
| -------------------------------------- | ------------------------------------------ | ------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------ | ----------------------------- | ------------ |
| Site vitrine - accueil & conversion    | `/`                                        | Navbar, hero/CTA, footer                                | visiteur voit proposition de valeur et CTA contact                                 | Oui (web)    | Non                           | Oui (web)    |
| Site vitrine - programmes              | `/programmes`                              | cards programme, section parcours, CTA final            | visiteur comprend offres et rejoint contact                                        | Oui (web)    | Non                           | Oui (web)    |
| Site vitrine - contact                 | `/contact`                                 | formulaire contact, feedback succès/erreur              | envoi valide affiche confirmation; erreur affiche message actionnable              | Oui (web)    | Oui (support endpoint)        | Oui (web)    |
| Web participant - protection dashboard | `/participant` et `/participant/dashboard` | guard auth web, shell participant                       | visiteur non authentifié est redirige; utilisateur authentifié accède au dashboard | Oui (web)    | Oui (auth/session)            | Oui (web)    |
| Mobile - authentification              | `sign-in`, `sign-up`, `password-reset`     | pages auth, service auth, guard auth                    | participant se connecte; identifiants invalides affichent une erreur claire        | Oui (mobile) | Oui (auth/session)            | Oui (mobile) |
| Mobile - dashboard                     | `home` participant                         | cards dashboard, section annonces récentes              | participant voit ses informations utiles; session expirée relance flux auth        | Oui (mobile) | Oui (dashboard aggregate)     | Oui (mobile) |
| Mobile - programmes                    | liste + detail programme + detail session  | list item programme, detail session, service programmes | participant ouvre programme puis session; accès non autorise bloque                | Oui (mobile) | Oui (programs endpoints)      | Oui (mobile) |
| Mobile - ressources                    | liste + detail ressource                   | list item ressource, filtres, detail ressource          | participant filtre et ouvre ressource; état vide explicite si aucune ressource     | Oui (mobile) | Oui (resources endpoints)     | Oui (mobile) |
| Mobile - annonces                      | liste + detail annonce                     | cards annonce, detail annonce, service annonces         | participant lit annonces; marquage lu/non lu coherent                              | Oui (mobile) | Oui (announcements endpoints) | Oui (mobile) |
| Mobile - support                       | support page + support request page        | formulaire support, validation champs, service support  | participant soumet une demande; erreur reseau affiche une alternative claire       | Oui (mobile) | Oui (support endpoint)        | Oui (mobile) |

## 5) Scénarios critiques prioritaires

Liste des scénarios a traiter en priorité (base QAT-04):

1. Given un visiteur non authentifié, When il accède a une route participant, Then il est redirige vers un écran autorise.
2. Given un participant authentifié, When il ouvre son dashboard, Then ses informations essentielles sont visibles.
3. Given un participant sur la page ressources, When aucune ressource n'est disponible, Then un état vide lisible est affiche.
4. Given un participant tente une route non autorisée, When la vérification d'accès s'applique, Then aucune donnée sensible n'est exposée.
5. Given un utilisateur envoie le formulaire contact/support avec des données valides, When l'envoi aboutit, Then un message de confirmation est affiche.
6. Given une session expirée, When l'utilisateur relance une action protégée, Then le flux de reconnexion est déclenché de façon contrôlée.

## 6) Mapping vers les suites existantes (état au 30/04/2026)

| Surface              | Suites détectées                                                                                                        | État     |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------- |
| E2E web comportement | `apps/client/tests/e2e/*.spec.ts` (analytics, contact-form, design-system, participant-dashboard, programs, seo, smoke) | En place |
| Unit web             | `apps/client/projects/web/src/app/**/*.spec.ts`                                                                         | En place |
| Unit mobile          | `apps/client/projects/mobile/src/app/**/*.spec.ts`                                                                      | En place |
| Unit/integration API | `apps/api/src/**/*.spec.ts` via Jest                                                                                    | En place |

## 7) Evidence de validation QAT-01

Checks exécutés le 30/04/2026:

1. `pnpm test:workspace` -> 11/11 tests pass.
2. `pnpm --filter @kraak/client exec playwright test --list` -> 16 scénarios détectés dans 7 fichiers, avec titres Given/When/Then.

Résultat:

- Scope QAT-01 implémenté: Oui (matrice page/composant/comportement définie)
- Dependencies SET-04/SET-05 satisfaites: Oui (runners et suites vérifiés)
- Validation evidence ajoutée: Oui (checks listes ci-dessus)

## 8) Utilisation opérationnelle pour les prochaines tâches

- QAT-02: couvrir les composants critiques listés en colonne "Composants critiques".
- QAT-03: couvrir les endpoints associés pour auth, dashboard, programs, resources, announcements, support.
- QAT-04: aligner les scénarios E2E sur les 6 scénarios critiques prioritaires.
