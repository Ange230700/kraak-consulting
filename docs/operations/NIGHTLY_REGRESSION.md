---
status: active
owner: platform
last_reviewed: 2026-10-27
source_of_truth: true
---

# Régression nocturne sans environnement permanent

## Table des matières

- [Régression nocturne sans environnement permanent](#regression-nocturne-sans-environnement-permanent)
  - [Exécution](#execution)
  - [Newman et production](#newman-et-production)

## Exécution

À `02:00 UTC`, les workflows [CI](../../.github/workflows/ci.yml) et
[Supabase Schema Tests](../../.github/workflows/supabase-schema-tests.yml)
exécutent les contrôles de code, couverture, builds, intégration et E2E, ainsi
que le rejeu des migrations et les assertions d’autorisation sur PostgreSQL
éphémère. Ils restent déclenchables manuellement.

Les mêmes contrôles sont exécutés sur les PR vers `main`. Aucun compte distant,
secret de test staging ou abonnement supplémentaire n’est requis.

## Newman et production

La collection [api-user-journey](../../apps/api/test/collections/api-user-journey.collection.json)
reste disponible avec les scripts `test:api:journey` et
`test:api:journey:strict` pour une API locale et des données jetables.
L’ancien runner staging et son workflow sont retirés.

Ne pas rediriger cette collection nocturne vers la production : elle contient
des opérations mutantes et des flux susceptibles d’envoyer des e-mails.
La surveillance de production reste assurée par
[Observability](../../.github/workflows/observability.yml), en lecture seule.
Un échec de surveillance ou de test reste à investiguer ; ne pas désactiver les
assertions pour le transformer en succès.
