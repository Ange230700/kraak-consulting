---
status: historical
owner: platform
archived_on: 2026-07-23
---

# Archive planning historique

## Table des matières

- [Archive planning historique](#archive-planning-historique)
  - [Pourquoi ces documents sont archivés](#pourquoi-ces-documents-sont-archives)
  - [Date d'archivage](#date-darchivage)
  - [Documents actifs de remplacement](#documents-actifs-de-remplacement)
  - [Suppression ultérieure](#suppression-ulterieure)

## Pourquoi ces documents sont archivés

Ce dossier conserve les anciens artefacts de planification : backlog initial,
exports CSV, inventaires et notes de setup historiques. Le pilotage courant se
fait désormais depuis GitHub Project #6 et les documents actifs de
planification.

## Date d'archivage

23 juillet 2026.

## Documents actifs de remplacement

- [`../../planning/GITHUB_PROJECT.md`](../../planning/GITHUB_PROJECT.md) pour le
  pilotage GitHub Project actif.
- [`../../generated/planning/github_project_planning_current.csv`](../../generated/planning/github_project_planning_current.csv)
  pour le snapshot courant reproductible.
- [`../../product/MVP_SCOPE.md`](../../product/MVP_SCOPE.md) pour le périmètre
  produit MVP.
- [`../../engineering/CONTRIBUTION_WORKFLOW.md`](../../engineering/CONTRIBUTION_WORKFLOW.md)
  pour le workflow de contribution actif.

## Suppression ultérieure

Ne pas supprimer par défaut. Ces fichiers peuvent être supprimés plus tard
uniquement après confirmation que le Project live, les issues GitHub et les docs
actives suffisent pour reconstituer le contexte de planification.

Les anciens packs de création d'issues GitHub ont été supprimés le 23 juillet
2026 : les templates actifs vivent dans `.github/ISSUE_TEMPLATE/`, les issues
live portent le contenu opérationnel, et l'historique Git reste suffisant pour
récupérer les anciens blocs si besoin.
