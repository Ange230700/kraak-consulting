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

Le [registre de transition](../operations/PRODUCTION_ONLY_TRANSITION.md) et
l'[inventaire daté](../generated/PRODUCTION_ONLY_INVENTORY_2026-10-27.md)
consignent l'avancement et les preuves. La configuration production-only est
fusionnée dans `main`, mais le retrait opérationnel reste bloqué. La branche
distante `staging`, les services Render staging et le projet Supabase staging
sont conservés ; la fusion d'une configuration cible ne vaut pas suppression
des ressources existantes ni validation de production. Une seule preview
Supabase vide créée pour la PR #735 a été supprimée après vérification.
Ne retirer aucune ressource racine avant la sauvegarde restaurable, la décision
sur les données uniques et la validation indépendante de la production.
