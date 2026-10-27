---
status: active
owner: platform
last_reviewed: 2026-10-27
source_of_truth: true
---

# ARC-22 — Production unique et branche main

## Table des matières

- [ARC-22 — Production unique et branche main](#arc-22-production-unique-et-branche-main)
  - [Décision](#decision)
  - [Conditions de retrait](#conditions-de-retrait)
  - [État d’exécution](#etat-dexecution)

## Décision

À la demande explicite du propriétaire dans #733, `main` redevient la branche
GitHub par défaut et la seule branche permanente cible. Les branches courtes
partent de `main` et y reviennent par PR, avec rebase, protections et contrôles
requis. Les tags SemVer issus de `main` conservent le déploiement contrôlé.

La CI, les E2E et les tests SQL utilisent des services locaux éphémères.
Le Blueprint ne déclare que le web et l’API de production. Aucun environnement
payant de remplacement n’est créé.

Cette décision remplace le modèle de branches d’ARC-08 et ARC-09 ainsi que les
instructions contradictoires de prévalidation distante dans les anciens runbooks.
Le principe de release par tag d’ARC-07 est conservé.

## Conditions de retrait

La configuration cible n’autorise pas à elle seule une suppression. Avant tout
retrait : inventaire avec identifiants et références effectives, sauvegarde
durable vérifiée, comparaison du code, du schéma, des données, d’Auth et de
Storage, puis validation production indépendante.

Les éléments uniques dont la propriété ou la destination est indéterminée sont
préservés. Ni l’historique de migrations ni les données de production ne sont
écrasés pour faire correspondre artificiellement les environnements.

## État d’exécution

Le [registre de transition](../operations/PRODUCTION_ONLY_TRANSITION.md) distingue
les actions vérifiées des étapes bloquées. Tant que les barrières de
préservation ou de production échouent, conserver la branche et les ressources
historiques nécessaires à la reprise.
