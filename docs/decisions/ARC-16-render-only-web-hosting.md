---
status: active
owner: platform
last_reviewed: 2026-07-23
source_of_truth: true
---

<!-- docs\decisions\ARC-16-render-only-web-hosting.md -->

# ARC-16 — Render uniquement pour l'hébergement web

## Table des matières

- [ARC-16 — Render uniquement pour l'hébergement web](#arc-16-render-uniquement-pour-lhebergement-web)
  - [1 · Décision](#1-decision)
  - [2 · Contraintes](#2-contraintes)
  - [3 · Règles opérationnelles](#3-regles-operationnelles)
  - [4 · Conséquences](#4-consequences)

- **Statut** : Acceptée
- **Date** : 2026-07-02
- **Portée** : hébergement web staging + production, workflows CI/CD, docs, tests
- **Remplace** : la partie hébergement web d'ARC-09 et ARC-11

---

## 1 · Décision

Render devient l'unique cible active d'hébergement web pour les environnements
`staging` et `production`.

Le dépôt ne contient plus de configuration, workflow, variable, URL,
assertion de test ou runbook reliés à un autre hébergeur web.

## 2 · Contraintes

- Le déploiement externe legacy déjà en ligne est traité comme un fallback
  figé hors dépôt.
- Cette décision ne prescrit aucune action de suppression côté dashboard.
- Aucun outillage CLI de l'ancien hébergeur n'est nécessaire dans le dépôt.

## 3 · Règles opérationnelles

- `render.yaml` est la source de vérité pour les services web:
  - `kraak-web-staging` sur `staging`, `autoDeploy: true`,
    `staticPublishPath: public`
  - `kraak-web-prod` sur `main`, `autoDeploy: false`,
    `staticPublishPath: public`, sous-domaine Render activé
- Le workflow de release production déploie:
  - `kraak-api-prod`
  - `kraak-web-prod`
- Les checks d'observabilité web pointent sur les URLs Render.

## 4 · Conséquences

- Simplification de l'exploitation: une seule plateforme web active.
- Réduction du risque de divergence de configuration entre fournisseurs.
- Historique conservé via les ADR précédents, mais non normatif pour
  l'hébergement web actif.
