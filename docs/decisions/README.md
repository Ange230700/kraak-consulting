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

| ID       | Titre                                                                          | Statut                                        | Date       |
| -------- | ------------------------------------------------------------------------------ | --------------------------------------------- | ---------- |
| `ARC-01` | Architecture cible MVP                                                         | Acceptée                                      | 2025-07-18 |
| `ARC-02` | Conventions dépôt et workflow Git                                              | Acceptée                                      | 2025-07-18 |
| `ARC-03` | Stratégie SEO et prerendering                                                  | Acceptée                                      | 2025-07-18 |
| `ARC-04` | Modèles de données MVP                                                         | Acceptée                                      | 2025-07-18 |
| `ARC-05` | Critères anti-scope-creep et cadrage ADR                                       | Acceptée                                      | 2025-07-18 |
| `ARC-06` | Gating natif notifications push mobile sur Firebase                            | Acceptée                                      | 2026-04-10 |
| `ARC-07` | Stratégie de release production basée sur les tags                             | Acceptée                                      | 2026-05-02 |
| `ARC-08` | Environnement staging et branche longue `staging`                              | Acceptée (partiellement remplacée par ARC-09) | 2026-05-03 |
| `ARC-09` | Inversion `main` ↔ `staging` (staging = intégration)                           | Acceptée (partiellement remplacée par ARC-11) | 2026-05-03 |
| `ARC-10` | Feature flag espace participant                                                | Acceptée                                      | 2026-05-01 |
| `ARC-11` | Consolidation des projets Vercel en un seul projet                             | Acceptée                                      | 2026-05-03 |
| `ARC-11` | Stratégie de release production avec désactivation des surfaces non finalisées | À valider avant implémentation                | 2026-05-09 |
| `ARC-12` | Retrait des sections de prévisualisation du bundle production                  | Appliquée                                     | 2026-05-14 |
| `ARC-13` | Gating des routes non vitrines côté web                                        | Appliquée                                     | 2026-05-14 |
| `ARC-14` | Gel de la surface vitrine publique                                             | Acceptée                                      | 2026-05-15 |
| `ARC-15` | Positionnement de la page `/ressources` dans la vitrine                        | Acceptée                                      | 2026-05-15 |
