---
status: active
owner: platform
last_reviewed: 2026-07-23
source_of_truth: true
---

# Nightly Regression

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

## Règles d'usage

- La CI principale garde uniquement les vérifications rapides et les tests non bloquants.
- Le nightly regression sert à détecter les écarts nominaux sur Auth et les régressions API plus tardives.
- Les échecs du workflow nocturne doivent être investigués avant la prochaine fenêtre de livraison.

## Défaut connu — 2026-07-22

Issue: [#618](https://github.com/Ange230700/kraak-consulting/issues/618)

Le workflow échoue avant d'exécuter les assertions HTTP parce que le script
`pnpm test:api:journey:strict:staging` cible
`test-results/postman/api-user-journey.collection.json`, alors que
`test-results/` est gitignoré et qu'aucune collection Newman source n'est
présente dans le dépôt.

Reproduction locale :

```bash
pnpm.cmd test:api:journey:strict:staging
```

Erreur observée :

```text
collection could not be loaded
unable to read data from file "test-results/postman/api-user-journey.collection.json"
ENOENT: no such file or directory
```

Le correctif attendu consiste à versionner la collection source dans un chemin
non ignoré ou à générer explicitement l'artefact avant l'exécution du workflow.
