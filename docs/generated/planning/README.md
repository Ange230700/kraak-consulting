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

Ce dossier contient les exports reproductibles issus du GitHub Project #6. Le
board GitHub live reste la source opérationnelle de vérité ; ces fichiers sont
des snapshots techniques de comparaison et d'import.

## Fichiers

- `github_project_planning_current.csv` : snapshot courant des champs stables
  `Priority`, `Lane`, `Surface`, `Coupling`, `Wave` et `Effort`.

## Régénération

Ne pas modifier le CSV à la main. Le régénérer depuis le Project live :

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
