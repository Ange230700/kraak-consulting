> **Status:** Historical.
> This document does not define the current process.
> Active reference: [NIGHTLY_REGRESSION](../../operations/NIGHTLY_REGRESSION.md)

# QAT-05 - Campagne de regression

## Table des matières

- [QAT-05 - Campagne de regression](#qat-05-campagne-de-regression)
  - [Objectif](#objectif)
  - [Dépendances](#dependances)
  - [Commandes exécutées](#commandes-executees)
  - [Contrôle API Newman](#controle-api-newman)
  - [Résultats](#resultats)
  - [Blockers](#blockers)
  - [Conclusion](#conclusion)

Date: 2026-04-30
Scope: campagne de regression MVP (web, mobile, API, libs, E2E)
Issue: #116

## Objectif

Executer une campagne de regression complete et identifier les blockers critiques avant poursuite vers QAT-06.

## Dépendances

- QAT-02: couverture unitaire composants critiques
- QAT-03: couverture integration API modules critiques
- QAT-04: couverture E2E Given/When/Then parcours coeur participant

État constate pendant la campagne: satisfaites (les suites associées passent).

## Commandes exécutées

1. `pnpm typecheck`
2. `pnpm format:check`
3. `pnpm lint`
4. `pnpm test`

## Contrôle API Newman

Le dépôt expose désormais deux modes Newman pour la collection `api-user-journey` :

1. `pnpm test:api:journey` pour le mode CI-ready par défaut (`strictAuth=false`)
2. `pnpm test:api:journey:strict` pour le contrat nominal strict (`strictAuth=true`)
3. `pnpm test:api:journey:strict:staging` pour rejouer le strict sur l'API staging déployée

Le workflow nocturne dédié `Nightly Regression` exécute le job Newman strict contre `https://kraak-api-staging.onrender.com` afin de garder un signal de régression sans alourdir la CI principale.

## Résultats

- Typecheck: OK (web, mobile, api)
- Format check: OK
- Lint: OK
- Tests libs: OK
  - contracts: 151 passes
  - tokens: 27 passes
  - api-client: 35 passes
  - domain: 170 passes
- Tests API (Jest): 21 suites, 138 tests passes
- Tests client web (Vitest): 22 fichiers, 84 tests passes
- Tests client mobile (Vitest): 26 fichiers, 114 tests passes
- Tests E2E Playwright: 19 passes, 0 échec

## Blockers

Aucun blocker détecté pendant cette campagne.

## Conclusion

QAT-05 est valide pour le scope regression/correction blockers: la campagne est complete et verte, sans correction applicative nécessaire a cette date.
