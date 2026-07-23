---
status: active
owner: platform
last_reviewed: 2026-07-23
source_of_truth: true
---

# ARC-05 — Critères anti-scope-creep et cadrage ADR

| Champ          | Valeur         |
| -------------- | -------------- |
| **Statut**     | Acceptée       |
| **Date**       | 2025-07-18     |
| **Auteurs**    | Équipe KRAAK   |
| **Dépendance** | ARC-02, ARC-04 |
| **Liée à**     | ARC-01, ARC-03 |

---

## 1 · Contexte

Le projet KRAAK est porté par une équipe restreinte avec un périmètre MVP
clairement défini. Le risque principal est la **dérive de périmètre**
(scope creep) : ajout progressif de fonctionnalités, d'abstractions ou
d'infrastructure qui ne servent pas directement le MVP.

Les assistants IA amplifient ce risque en proposant par défaut des solutions
complètes, des abstractions préventives, ou des refactors non demandés.

Cet ADR formalise les critères de filtrage qui protègent le périmètre MVP et
définit le processus de documentation des décisions d'architecture.

---

## 2 · Décision

### 2.1 Périmètre MVP — Ce qui est inclus

Le MVP couvre strictement :

1. **Site vitrine** — accueil, à propos, services, programmes/offres, contact
2. **Présentation structurée** — KRAAK, vision, mission, valeurs
3. **Pôles de services** — Formation, Gestion de projet, Conseil en immigration
4. **Parcours de conversion** — prise de contact, demande d'information, demande
   d'accompagnement
5. **SEO de base** — prerendering, metadata, Open Graph, sitemap, robots
6. **Accessibilité de base** — conformité minimale WCAG
7. **Réassurance** — approche, différenciation, preuves sociales (espaces
   réservés si contenu non disponible)
8. **Ton KRAAK** — humain, exigeant, tourné vers l'impact, l'autonomie et le
   leadership de service

### 2.2 Périmètre MVP — Ce qui est explicitement exclu (V1.1+)

| Fonctionnalité exclue                     | Raison                            |
| ----------------------------------------- | --------------------------------- |
| Portail participant avec espace personnel | Complexité auth + UI hors MVP     |
| Tableau de bord apprenant / progression   | LMS complet = V1.1+               |
| Paiement en ligne / abonnements           | Tunnel commercial = V1.1+         |
| LMS complet / e-learning riche            | Infrastructure lourde = V1.1+     |
| CMS éditorial avancé                      | Workflows publication = V1.1+     |
| CRM avancé / scoring de leads             | Automatisations marketing = V1.1+ |
| Blog / média à volume élevé               | Architecture éditoriale = V1.1+   |
| Import / analyse de profils               | Logique plateforme métier = V1.1+ |
| Application mobile dédiée                 | MVP web-first, mobile = V1.1+     |
| ORM                                       | Décision ARC-01, sauf ADR dédié   |

### 2.3 Critères de filtrage anti-scope-creep

Avant d'implémenter un changement, vérifier ces 7 critères :

| #   | Critère                                                             | Action si non satisfait            |
| --- | ------------------------------------------------------------------- | ---------------------------------- |
| 1   | Le changement sert-il un objectif MVP listé en §2.1 ?               | Refuser ou reporter en V1.1+       |
| 2   | Le changement est-il le plus petit incrément viable ?               | Réduire la portée                  |
| 3   | Le changement introduit-il de l'infrastructure « au cas où » ?      | Retirer l'infrastructure           |
| 4   | Le changement ajoute-t-il une abstraction pour un seul usage ?      | Inliner                            |
| 5   | Le changement fait-il glisser un item V1.1+ dans le MVP ?           | Refuser sauf demande explicite     |
| 6   | Le changement ajoute-t-il un fichier `.scss`/`.css` par composant ? | Refuser (règle ARC-01)             |
| 7   | Le changement modifie-t-il l'architecture sans ADR ?                | Exiger un ADR avant implémentation |

### 2.4 Processus ADR

#### Quand créer un ADR

- Toute décision qui modifie les choix techniques fondamentaux (stack, BaaS,
  déploiement, schéma de données, stratégie SEO).
- Toute introduction d'outil ou bibliothèque structurante.
- Tout changement de convention affectant le workflow de développement.
- Tout rejet ou report explicite d'une approche alternative.

#### Format obligatoire

Chaque ADR suit la structure :

1. **En-tête** : `# ARC-XX — Titre court`
2. **Métadonnées** : tableau Statut / Date / Auteurs / Dépendance / Liée à
3. **Contexte** : problème ou besoin à l'origine de la décision
4. **Décision** : choix retenu, décrit de manière opérationnelle
5. **Justification** : comparaison avec les alternatives, critères de sélection
6. **Implémentation** : fichiers, configurations, contraintes concrètes
7. **Alternatives considérées** : options évaluées et raisons du rejet
8. **Limites et évolutions** : points non couverts, évolutions prévues
9. **Références** : liens internes et externes

#### Convention de nommage

- Fichier : `docs/decisions/ARC-XX-titre-court.md`
- Numérotation : séquentielle (`ARC-01`, `ARC-02`, …)
- Langue : français (contenu), anglais (identifiants techniques)
- Statuts : `Proposée` → `Acceptée` → `Remplacée` | `Abandonnée`

#### Index

Le fichier `docs/decisions/README.md` maintient l'index à jour de tous les ADR.

---

## 3 · Justification

### 3.1 Pourquoi des critères formels

Sans filtre explicite, l'ajout de fonctionnalités « évidentes » ou
d'améliorations « gratuites » retarde le MVP sans apporter de valeur
utilisateur immédiate.

### 3.2 Pourquoi des ADR formels

| Critère                     | ADR formels  | Décisions orales | Commentaires code |
| --------------------------- | ------------ | ---------------- | ----------------- |
| Traçabilité                 | ✅ Complète  | ❌ Aucune        | ⚠️ Fragmentaire   |
| Contexte de la décision     | ✅ Documenté | ❌ Perdu         | ❌ Absent         |
| Alternatives évaluées       | ✅ Listées   | ❌ Oubliées      | ❌ Absentes       |
| Revue par l'équipe          | ✅ Possible  | ⚠️ Difficile     | ⚠️ Partielle      |
| Onboarding nouveaux membres | ✅ Rapide    | ❌ Long          | ⚠️ Moyen          |

---

## 4 · Implémentation

### 4.1 Arborescence

```mermaid
flowchart TD
    decisions["docs/decisions/"]
    decisions --> decisionsindex["README.md - Index des ADR"]
    decisions --> arc01["ARC-01-architecture-cible-mvp.md - Architecture globale"]
    decisions --> arc02["ARC-02-conventions-repo.md - Conventions dépôt et Git"]
    decisions --> arc03["ARC-03-seo-prerender-strategy.md - SEO et prerendering"]
    decisions --> arc04["ARC-04-modeles-donnees-mvp.md - Schéma de données MVP"]
    decisions --> arc05["ARC-05-criteres-anti-scope-creep.md - Ce document"]
```

### 4.2 Intégration dans le workflow

- **AGENTS.md** référence les critères anti-scope-creep comme non-négociables.
- Les assistants IA doivent vérifier les 7 critères du §2.3 avant chaque
  implémentation.
- Toute modification d'architecture doit être précédée d'un ADR (critère #7).
- L'index `docs/decisions/README.md` doit être mis à jour à chaque ajout d'ADR.

### 4.3 Checklist de validation avant merge

Pour chaque PR, vérifier :

- [ ] Le changement respecte les 7 critères anti-scope-creep
- [ ] Aucune fonctionnalité V1.1+ n'a glissé dans le MVP
- [ ] Si une décision d'architecture est prise, un ADR existe
- [ ] L'index ADR est à jour si un nouvel ADR a été ajouté

---

## 5 · Alternatives considérées

1. **Pas de garde-fou formel** — Rejeté : la dérive de périmètre est le risque
   n°1 avec une équipe restreinte et des assistants IA.
2. **Critères uniquement dans AGENTS.md** — Insuffisant : AGENTS.md définit le
   « comment » pour les assistants, mais les critères doivent aussi être
   accessibles aux contributeurs humains via un ADR dédié.
3. **ADR dans un wiki externe** — Rejeté : les ADR doivent vivre avec le code
   pour être versionnés et revus ensemble.
4. **MADR (Markdown Any Decision Records)** — Évalué mais format propre jugé
   plus adapté au contexte KRAAK (sections Implémentation et Limites plus
   détaillées).

---

## 6 · Limites et évolutions

- **Critères V1.1+** : les critères anti-scope-creep devront être révisés quand
  le périmètre V1.1+ sera activement développé.
- **Automatisation** : un linter ou une CI vérifiant la présence d'ADR pour
  certains types de changements pourrait être ajouté.
- **Gouvernance** : avec une équipe plus grande, un processus de revue formel
  des ADR (RFC) pourrait être instauré.
- **Archivage** : les ADR remplacés ne sont pas supprimés mais marqués
  `Remplacée` avec un lien vers le successeur.

---

## 7 · Références

- [AGENTS.md](../../AGENTS.md) — garde-fous du périmètre produit
- [docs/planning/GITHUB_PROJECT.md](../planning/GITHUB_PROJECT.md) — backlog MVP
- [ARC-01 — Architecture cible MVP](./ARC-01-architecture-cible-mvp.md)
- [ARC-02 — Conventions dépôt et workflow Git](./ARC-02-conventions-repo.md)
- [ARC-03 — Stratégie SEO et prerendering](./ARC-03-seo-prerender-strategy.md)
- [ARC-04 — Modèles de données MVP](./ARC-04-modeles-donnees-mvp.md)
- [Architectural Decision Records (ADR)](https://adr.github.io/)
