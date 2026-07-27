---
status: reference
owner: platform
last_reviewed: 2026-07-23
source_of_truth: false
---

# ARC-08 — Environnement de staging stable et branche longue `staging`

## Table des matières

- [ARC-08 — Environnement de staging stable et branche longue staging](#arc-08-environnement-de-staging-stable-et-branche-longue-staging)
  - [1 · Contexte](#1-contexte)
  - [2 · Décision](#2-decision)
    - [2.1 Exception explicite à ARC-02](#21-exception-explicite-a-arc-02)
    - [2.2 Flux complet de promotion](#22-flux-complet-de-promotion)
    - [2.3 Périmètre couvert par cette décision](#23-perimetre-couvert-par-cette-decision)
    - [2.4 Ce que cette décision ne change pas](#24-ce-que-cette-decision-ne-change-pas)
  - [3 · Justification](#3-justification)
  - [4 · Implémentation](#4-implementation)
    - [4.1 Création initiale de la branche](#41-creation-initiale-de-la-branche)
    - [4.2 Protection GitHub de staging](#42-protection-github-de-staging)
    - [4.3 Configuration Render](#43-configuration-render)
    - [4.4 Configuration Render (UI)](#44-configuration-render-ui)
    - [4.5 Promotion staging-first](#45-promotion-staging-first)
    - [4.6 Rollback staging](#46-rollback-staging)
  - [5 · Conséquences](#5-consequences)
  - [6 · Conditions de levée / révision](#6-conditions-de-levee-revision)
  - [7 · Références](#7-references)

> ⚠️ **Mise à jour 2026-05-03** : les sections « 2.1 Exception à ARC-02 »
> et « 2.2 Flux complet de promotion » sont **remplacées par
> [ARC-09](./ARC-09-inversion-main-staging.md)**. Dans le modèle actuel,
> `staging` est la branche d'intégration (toutes les PR la ciblent) et
> `main` n'avance que par PR de release depuis `staging`. Le reste de cette
> ADR (motivations, choix Render/Supabase, runbook) reste applicable.

| Champ           | Valeur                                                                                    |
| --------------- | ----------------------------------------------------------------------------------------- |
| **Statut**      | Acceptée (partiellement remplacée par ARC-09)                                             |
| **Date**        | 2026-05-03                                                                                |
| **Auteurs**     | Équipe KRAAK                                                                              |
| **Dépendances** | ARC-02 (workflow Git), ARC-07 (release prod par tag)                                      |
| **Liée à**      | `docs/operations/STAGING_VALIDATION.md`, `docs/operations/RELEASE_PROD.md`, `render.yaml` |

---

## 1 · Contexte

Avant de livrer en production, KRAAK doit valider chaque incrément du MVP dans
un environnement **prod-like exposé sur Internet**, branché à des services
réels (Supabase, Resend, Render, Render), mais **isolé des données de
production**.

L'environnement staging existait déjà partiellement :

- `apps/api/.env.staging`, `apps/client/.env.staging`, `supabase/.env.staging` ;
- service Render `kraak-api-staging` (`autoDeploy: true`, branche `main`) ;
- projet Render staging avec preview branch `main` (URL stable
  `https://kraak-web-staging.onrender.com`).

Avec ARC-07, la prod a été figée sur un déclenchement par **tag SemVer**. Le
flux tel quel devient :

```text
push main ──► staging (auto)
tag v*   ──► prod    (review GitHub Environment)
```

Ce flux fonctionne mais souffre d'une faiblesse opérationnelle : **`main` et
staging sont collés**. Tout merge sur `main` part immédiatement en staging,
même si le mainteneur souhaitait d'abord rassembler plusieurs PR avant
d'exposer une vague de changements à validation. Cela rend impossible :

- la stabilisation d'un staging sur un commit donné pendant une revue manuelle
  qui dure plus de quelques minutes ;
- le retour rapide à un état staging connu sans `revert` sur `main` ;
- la séparation entre « code mergé » et « code exposé pour validation
  pré-prod ».

L'enjeu : introduire un point de contrôle explicite entre `main` et le
déploiement staging, **sans réintroduire un modèle GitFlow lourd**.

---

## 2 · Décision

KRAAK introduit une **branche longue `staging`** comme **unique source de
déploiement de l'environnement staging**, avec les contraintes suivantes :

1. `main` reste la seule branche de **développement** permanente (ARC-02
   conservé).
2. `staging` est une branche **technique de déploiement**, pas une branche de
   travail : aucune PR ne la cible directement, aucun commit n'y est créé en
   propre.
3. `staging` n'avance **que par fast-forward depuis `main`**. Aucun merge
   commit, aucun rebase non trivial, aucun cherry-pick n'y est autorisé.
4. Pousser sur `staging` déclenche le déploiement staging (Render Render
   Supabase migrations).
5. Le **tag SemVer** créé depuis `main` (ou depuis le commit pointé par
   `staging`) reste le seul déclencheur prod (ARC-07 inchangé).

### 2.1 Exception explicite à ARC-02

ARC-02 stipule que `main` est la seule branche permanente. Cette ADR
**autorise une exception strictement bornée** :

| Aspect                        | Règle                                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------------- |
| Branches permanentes          | `main` (développement) + `staging` (déploiement)                                                        |
| Branches de travail           | Toujours courtes (`feat/*`, `fix/*`, ...) et toujours mergées dans `main`                               |
| PR ciblant `staging`          | **Interdites**                                                                                          |
| Commits directs sur `staging` | **Interdits**                                                                                           |
| Avance de `staging`           | `git fast-forward` depuis un commit de `main` uniquement                                                |
| Reset arrière de `staging`    | Autorisé pour rollback staging (`git reset --hard` + `git push --force-with-lease`) ; jamais sur `main` |
| Protection GitHub             | `staging` protégée : push restreint aux mainteneurs, status checks requis                               |

### 2.2 Flux complet de promotion

```text
feat/* ──► PR ──► main (rebase only, ARC-02)
                   │
                   └─► fast-forward ──► staging ──► déploiement staging
                                                       │
                                                       ▼
                                                 validation manuelle + E2E
                                                       │
                                                       ▼
                                          tag v*.*.* depuis main ──► prod (ARC-07)
```

### 2.3 Périmètre couvert par cette décision

| Bloc                | Décision                                                                                  |
| ------------------- | ----------------------------------------------------------------------------------------- |
| Render (API)        | `kraak-api-staging` suit la branche `staging` (`autoDeploy: true`, `branch: staging`)     |
| Render (web)        | Projet Render staging configure « Production Branch = `staging` » dans son dashboard      |
| Supabase            | Projet Supabase **`kraak-staging`** distinct de `kraak-prod` (déjà acté ARC-07)           |
| Migrations Supabase | `supabase db push` staging déclenché manuellement avant le fast-forward staging si schéma |
| Branch protection   | `staging` protégée GitHub : pas de push direct, pas de force-push hors rollback contrôlé  |
| Workflow Git        | Aucun PR ne cible `staging` ; promotion par script `pnpm staging:promote` (cf. runbook)   |
| Runbook             | `docs/operations/STAGING_VALIDATION.md` documente la procédure et les rollbacks staging   |
| ARC-07              | Inchangé : prod toujours par tag SemVer, jamais par push `staging` ni `main`              |

### 2.4 Ce que cette décision **ne change pas**

- Le workflow de développement quotidien : PR sur `main`, rebase, fast-forward
  merge, suppression de la branche courte (ARC-02).
- La stratégie de release prod par tag SemVer (ARC-07).
- L'isolation des projets Supabase prod / staging (ARC-07).
- La politique de secrets (jamais en repo, injection par hébergeur).

---

## 3 · Justification

| Critère                                | Long-lived `staging` | Staging = `main` (statu quo) | Branche `release/*` éphémère |
| -------------------------------------- | -------------------- | ---------------------------- | ---------------------------- |
| Découplage merge / déploiement staging | ✅                   | ❌                           | ⚠️ partiel                   |
| Rollback staging sans toucher `main`   | ✅ (reset staging)   | ❌ (revert main)             | ⚠️ (jeter la branche)        |
| Stabilité d'un commit en validation    | ✅                   | ❌                           | ✅                           |
| Surcoût de workflow                    | Faible (1 branche)   | Nul                          | Moyen (création/cleanup)     |
| Compatibilité ARC-07 (prod par tag)    | ✅                   | ✅                           | ✅                           |
| Risque de dérive vers GitFlow          | Faible               | Nul                          | Moyen                        |

L'option retenue maximise le découplage avec le coût de workflow le plus bas
(une seule branche permanente supplémentaire, sans logique de merge complexe).

---

## 4 · Implémentation

### 4.1 Création initiale de la branche

Une seule fois, depuis `main` à jour :

```bash
git checkout main
git pull --rebase
git checkout -b staging
git push -u origin staging
```

### 4.2 Protection GitHub de `staging`

Dans `Settings → Branches → Add branch protection rule` :

- Branch name pattern : `staging`
- Restrict who can push : mainteneurs uniquement
- Require linear history : ✅
- Allow force pushes : « Specify who can force push » → mainteneurs uniquement
  (nécessaire pour la procédure de rollback staging documentée)
- Required status checks : mêmes que `main` (CI verte sur le commit promu)

### 4.3 Configuration Render

`render.yaml` met à jour `kraak-api-staging` :

- `branch: staging`
- `autoDeploy: true` (inchangé)

Le service `kraak-api-prod` reste sur `autoDeploy: false` (déclenché par le
workflow `release-prod.yml` sur tag).

### 4.4 Configuration Render (UI)

Sur le projet Render staging :

- `Settings → Git → Production Branch` : `staging`
- `Settings → Git → Ignored Build Step` : conserver le comportement existant
  défini par `render.yaml`.

Sur le projet Render prod :

- `Production Branch` : `(none)` (inchangé, ARC-07).

### 4.5 Promotion staging-first

Cette ADR est remplacée, pour le sens de promotion, par
[`ARC-09`](./ARC-09-inversion-main-staging.md). Le flux actif part de branches
courtes vers `staging`, puis utilise une PR de release de `staging` vers `main`
quand la préproduction est validée.

Aucun workflow ne doit synchroniser `staging` depuis `main`. Si un correctif est
nécessaire après une release, il doit repartir d'une branche courte créée depuis
`staging`, puis suivre le workflow Git standard.

### 4.6 Rollback staging

Pour repointer staging sur un commit antérieur validé (ex. après détection d'un
bug en pré-prod) :

```bash
git checkout staging
git fetch origin
git reset --hard <sha-commit-staging-stable>
git push --force-with-lease origin staging
```

Render staging redéploient automatiquement le commit pointé.

---

## 5 · Conséquences

Positives :

- Découplage clair entre « code mergé » (`main`) et « code exposé en
  pré-prod » (`staging`).
- Possibilité de stabiliser staging sur un commit pendant toute la durée
  d'une validation manuelle / E2E, sans bloquer les merges sur `main`.
- Rollback staging trivial sans réécriture d'historique sur `main`.
- ARC-07 conservé intégralement : aucun impact sur la procédure prod.

Négatives / à surveiller :

- Une étape de release contrôlée reste nécessaire entre la validation staging et
  la production.
- Risque de désynchronisation : `main` peut être en retard sur `staging` tant
  qu'une release n'est pas prête ; il faut accepter cette latence et la
  documenter.
- Risque de tentation de commit direct sur `staging` : la protection GitHub +
  cette ADR doivent l'interdire explicitement.
- L'exception à ARC-02 doit rester strictement bornée : si une seconde
  branche permanente est demandée, elle nécessitera une nouvelle ADR.

---

## 6 · Conditions de levée / révision

Cette décision est révisable si :

1. Le volume de promotions staging dépasse plusieurs fast-forward par jour et
   justifie une automatisation par GitHub Action déclenchée sur `main`.
2. KRAAK introduit un environnement supplémentaire (par ex. `qa`, `demo`)
   nécessitant une matrice de branches plus riche.
3. Un outil tiers (Render) impose un autre modèle de promotion qui
   rendrait la branche `staging` redondante.

---

## 7 · Références

- [ARC-02 — Conventions dépôt et workflow Git](./ARC-02-conventions-repo.md)
- [ARC-07 — Stratégie de release production basée sur les tags](./ARC-07-prod-release-tag-based.md)
- [Runbook — Promotion staging](../operations/STAGING_VALIDATION.md)
- [Runbook — Release prod](../operations/RELEASE_PROD.md)
- [Runbook — Variables d'environnement](../operations/ENVIRONMENTS.md)
- [`render.yaml`](../../render.yaml)
