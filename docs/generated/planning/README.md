---
status: active
owner: platform
last_reviewed: 2026-07-23
source_of_truth: true
---

# Snapshots de planification générés

## Table des matières

- [Snapshots de planification générés](#snapshots-de-planification-generes)
  - [Fichiers](#fichiers)
  - [Régénération](#regeneration)

Ce dossier contient les exports reproductibles des GitHub Projects. Le board
GitHub live (Project #8) reste la source opérationnelle de vérité ; ces fichiers
sont des snapshots techniques de comparaison et d'import.

## Fichiers

- `github_project_planning_current.csv` : dernier snapshot des champs stables
  `Priority`, `Lane`, `Surface`, `Coupling`, `Wave` et `Effort`, exporté depuis
  le Project #6 désormais fermé. Il sera régénéré depuis le Project #8 après
  le réalignement du contrat de champs de l'audit (#742).

## Régénération

Ne pas modifier le CSV à la main. Après #742, le régénérer depuis le Project
live :

```bash
bash scripts/github-project-awareness.sh \
  --owner Ange230700 \
  --repo Ange230700/kraak-consulting \
  --current-wave "Wave 5 - Release" \
  --export-current docs/generated/planning/github_project_planning_current.csv
```

Pour vérifier le snapshot sans l'écraser :

```bash
bash scripts/github-project-awareness.sh \
  --owner Ange230700 \
  --repo Ange230700/kraak-consulting \
  --current-wave "Wave 5 - Release" \
  --check-current
```
