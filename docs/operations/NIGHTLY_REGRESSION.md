---
status: active
owner: platform
last_reviewed: 2026-07-23
source_of_truth: true
---

# Nightly Regression

## Table des matières

- [Nightly Regression](#nightly-regression)
  - [Objectif](#objectif)
  - [Déclenchement](#declenchement)
  - [Workflow](#workflow)
  - [Règles d'usage](#regles-dusage)

Ce runbook décrit le workflow nocturne de régression pour la collection Newman `api-user-journey`.

Voir aussi : [`CLI_TOOLS`](CLI_TOOLS.md),
[`QAT-05_REGRESSION_2026-04-30`](../archive/pilot-2026-04/QAT-05_REGRESSION_2026-04-30.md).

## Objectif

Garder un signal de régression strict sur l'API staging sans alourdir la CI principale des pull requests.

## Déclenchement

- Exécution automatique chaque nuit à `02:00 UTC`
- Déclenchement manuel via `workflow_dispatch`

## Workflow

Fichier: [.github/workflows/nightly-regression.yml](../../.github/workflows/nightly-regression.yml)

Le job exécute la collection Newman en mode strict contre `https://kraak-api-staging.onrender.com` via le script:

```bash
pnpm test:api:journey:strict:staging
```

La collection source est versionnée dans
[`apps/api/test/collections/api-user-journey.collection.json`](../../apps/api/test/collections/api-user-journey.collection.json).
Newman est épinglé dans les dépendances de développement racine et installé par
`pnpm-lock.yaml`; les scripts utilisent `pnpm exec` sans téléchargement à la
volée. Le rapport JSON est un artefact généré sous
`test-results/postman/`, et n'est jamais utilisé comme entrée.

## Règles d'usage

- La CI principale garde uniquement les vérifications rapides et les tests non bloquants.
- Le nightly regression sert à détecter les écarts nominaux sur Auth et les régressions API plus tardives.
- Les échecs du workflow nocturne doivent être investigués avant la prochaine fenêtre de livraison.
