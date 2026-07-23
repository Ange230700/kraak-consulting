---
status: reference
owner: platform
last_reviewed: 2026-07-23
source_of_truth: false
---

<!-- docs\decisions\ARC-11-consolidation-hebergement-web-projet-unique.md -->

# ARC-11 — Consolidation de l'hebergement web sur un service unique

- **Statut** : Remplacee
- **Date** : 2026-05-03
- **Remplace** : aspects d'ARC-08 et ARC-09 sur la duplication des cibles web
- **Remplacee par** : ARC-16 (hebergement web Render uniquement)

---

## 1 · Contexte

Cette decision a formalise une etape intermediaire de consolidation de
l'hebergement web, pour reduire la duplication des configurations et simplifier
la gestion des environnements de validation et de production.

## 2 · Decision historique

- Une cible d'hebergement web unique par depot.
- Variables d'environnement alignees par environnement (`staging` et
  `production`).
- Deploiement de production pilote par workflow de release, pas par push direct
  sur branche de production.

## 3 · Statut actuel

Cette decision n'est plus la reference active. Les regles d'hebergement web
actuelles sont decrites dans ARC-16.
