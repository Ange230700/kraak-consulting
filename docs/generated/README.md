---
status: active
owner: platform
last_reviewed: 2026-07-23
source_of_truth: true
---

# Artefacts générés

## Table des matières

- [Artefacts générés](#artefacts-generes)
  - [Contenu](#contenu)

Ce dossier regroupe les documents produits par automatisation ou import externe.
Ils ne doivent pas être modifiés manuellement sauf si le générateur ou la source
d'origine change dans le même passage.

## Contenu

| Chemin      | Statut      | Source                                               |
| ----------- | ----------- | ---------------------------------------------------- |
| `primeng/`  | `generated` | Documentation PrimeNG importée pour référence locale |
| `planning/` | `generated` | Snapshots reproductibles du GitHub Project #6        |
| `evidence/` | `generated` | Sorties de checks, audits et validations             |

Les sorties brutes volumineuses des audits de dépendances sont publiées comme
artefacts GitHub Actions. Le dépôt conserve uniquement les résumés lisibles qui
servent de preuve documentaire.
