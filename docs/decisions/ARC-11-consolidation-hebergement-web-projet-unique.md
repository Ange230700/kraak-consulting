---
status: reference
owner: platform
last_reviewed: 2026-07-23
source_of_truth: false
---

<!-- docs\decisions\ARC-11-consolidation-hebergement-web-projet-unique.md -->

# ARC-11 — Consolidation de l'hébergement web sur un service unique

- **Statut** : Remplacée
- **Date** : 2026-05-03
- **Remplace** : aspects d'ARC-08 et ARC-09 sur la duplication des cibles web
- **Remplacée par** : ARC-16 (hébergement web Render uniquement)

---

## 1 · Contexte

Cette décision a formalisé une étape intermédiaire de consolidation de
l'hébergement web, pour réduire la duplication des configurations et simplifier
la gestion des environnements de validation et de production.

## 2 · Décision historique

- Une cible d'hébergement web unique par dépôt.
- Variables d'environnement alignées par environnement (`staging` et
  `production`).
- Déploiement de production piloté par workflow de release, pas par push direct
  sur branche de production.

## 3 · Statut actuel

Cette décision n'est plus la référence active. Les règles d'hébergement web
actuelles sont décrites dans ARC-16.
