---
status: active
owner: platform
last_reviewed: 2026-07-23
source_of_truth: true
---

<!-- docs\decisions\README.md -->

# Architecture Decision Records (ADR)

Ce répertoire centralise les décisions d'architecture formelles du projet
KRAAK.

## Convention

- Chaque ADR suit le format : `ARC-XX-titre-court.md`
- Langue : français pour le contenu, anglais pour les identifiants techniques
- Statuts possibles : `Proposée`, `Acceptée`, `Remplacée`, `Abandonnée`,
  `Appliquée`

## Index

| ADR                                                                  | Décision                                                                | Statut                                        | Date       |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------- | ---------- |
| [ARC-01](ARC-01-architecture-cible-mvp.md)                           | Architecture cible MVP                                                  | Acceptée                                      | 2025-07-18 |
| [ARC-02](ARC-02-conventions-repo.md)                                 | Conventions dépôt et workflow Git                                       | Acceptée                                      | 2025-07-18 |
| [ARC-03](ARC-03-seo-prerender-strategy.md)                           | Stratégie de rendu web (SEO / prerender)                                | Acceptée                                      | 2025-07-18 |
| [ARC-04](ARC-04-modeles-donnees-mvp.md)                              | Modèles de données MVP                                                  | Acceptée                                      | 2025-07-18 |
| [ARC-05](ARC-05-criteres-anti-scope-creep.md)                        | Critères anti-scope-creep et cadrage ADR                                | Acceptée                                      | 2025-07-18 |
| [ARC-06](ARC-06-gating-firebase-mobile-push.md)                      | Gating natif des notifications push mobile sur Firebase                 | Acceptée                                      | 2026-04-10 |
| [ARC-07](ARC-07-prod-release-tag-based.md)                           | Stratégie de release production basée sur les tags                      | Acceptée                                      | 2026-05-02 |
| [ARC-08](ARC-08-staging-environment.md)                              | Environnement de staging stable et branche longue `staging`             | Acceptée (partiellement remplacée par ARC-09) | 2026-05-03 |
| [ARC-09](ARC-09-inversion-main-staging.md)                           | Inversion `main` ↔ `staging` : staging devient la branche d'intégration | Acceptée                                      | 2026-05-03 |
| [ARC-10](ARC-10-feature-flag-participant-area.md)                    | Feature flag espace participant                                         | Acceptée                                      | 2026-05-01 |
| [ARC-11](ARC-11-consolidation-hebergement-web-projet-unique.md)      | Consolidation de l'hébergement web sur un service unique                | Remplacée par ARC-16                          | 2026-05-03 |
| [ARC-12](ARC-12-automatic-environment-detection-preview-sections.md) | Retrait des sections de prévisualisation du bundle de production        | Appliquée                                     | 2026-05-14 |
| [ARC-13](ARC-13-non-vitrine-gating-complete.md)                      | Gating des routes non vitrines côté web                                 | Appliquée                                     | 2026-05-14 |
| [ARC-14](ARC-14-freeze-surface-vitrine-publique.md)                  | Gel de la surface vitrine publique                                      | Acceptée                                      | 2026-05-15 |
| [ARC-15](ARC-15-positionnement-page-ressources-vitrine.md)           | Positionnement de la page `/ressources` dans la vitrine                 | Acceptée                                      | 2026-05-15 |
| [ARC-16](ARC-16-render-only-web-hosting.md)                          | Render uniquement pour l'hébergement web                                | Acceptée                                      | 2026-07-02 |
| [ARC-17](ARC-17-prod-release-strategy-feature-disable.md)            | Production Release Strategy: Feature Disabling for MVP Deployment       | À valider avant implémentation                | 2026-05-09 |
