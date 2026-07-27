---
status: reference
owner: platform
last_reviewed: 2026-07-23
source_of_truth: false
---

# Matrice De Propriété Par Fonctionnalité

## Table des matières

- [Matrice De Propriété Par Fonctionnalité](#matrice-de-propriete-par-fonctionnalite)
  - [Convention De Lecture](#convention-de-lecture)
  - [Matrice Par Fonctionnalité](#matrice-par-fonctionnalite)
    - [1. Auth (AUT)](#1-auth-aut)
    - [2. Onboarding](#2-onboarding)
    - [3. Dashboard (DSH)](#3-dashboard-dsh)
    - [4. Programs (PRG)](#4-programs-prg)
    - [5. Resources (RES)](#5-resources-res)
    - [6. Announcements (ANN)](#6-announcements-ann)
    - [7. Support (SUP)](#7-support-sup)
    - [8. Billing](#8-billing)
  - [Vue Synthétique — Répertoires Par Surface](#vue-synthetique-repertoires-par-surface)
    - [apps/client/projects/web/src/app/features/](#appsclientprojectswebsrcappfeatures)
    - [apps/client/projects/mobile/src/app/features/](#appsclientprojectsmobilesrcappfeatures)
    - [packages/](#packages)
    - [apps/api/src/ (modules NestJS)](#appsapisrc-modules-nestjs)
  - [Règle De Décision : Web Vs Mobile Vs Shared](#regle-de-decision-web-vs-mobile-vs-shared)

> Référence : backlog (`docs/planning/GITHUB_PROJECT.md`), modèle produit
> (`docs/architecture/DATA_MODEL.md`), MVP mobile (`docs/product/MOBILE_MVP.md`),
> architecture (`ARCHITECTURE.md`).
> État actuel : `packages/tokens` est déjà utilisé ; `packages/contracts/`,
> `packages/domain/` et `packages/api-client/` sont encore des squelettes de
> répertoires à compléter quand le partage de logique deviendra concret.

---

## Convention De Lecture

| Symbole | Signification                           |
| ------- | --------------------------------------- |
| **P0**  | indispensable pour le pilote MVP        |
| **P1**  | essentiel mais reportable si nécessaire |
| —       | hors périmètre MVP pour cette surface   |
| ❌      | explicitement hors MVP toutes surfaces  |

Surfaces cibles :

| Surface            | Chemin                                                            | Rôle                                       |
| ------------------ | ----------------------------------------------------------------- | ------------------------------------------ |
| **web**            | `apps/client/projects/web/src/app/features/`                      | vitrine publique + zone participant (P1)   |
| **mobile**         | `apps/client/projects/mobile/src/app/features/`                   | app participant authentifiée               |
| **shared (local)** | `apps/client/projects/*/src/app/shared/`                          | composants/pipes/services UI réutilisables |
| **packages/**      | `packages/contracts/`, `packages/domain/`, `packages/api-client/` | contrats, logique métier, client typé      |
| **api**            | `apps/api/src/`                                                   | backend NestJS (modules)                   |

---

## Matrice Par Fonctionnalité

### 1. Auth (`AUT`)

| Couche                  | Placement                       | Priorité | Contenu concret                                                  |
| ----------------------- | ------------------------------- | -------- | ---------------------------------------------------------------- |
| **mobile**              | `mobile/…/features/auth/`       | P0       | écrans login, signup, reset ; service auth ; guard mobile        |
| **web**                 | `web/…/features/auth/`          | P0       | guard routes protégées, redirect login, page login minimale      |
| **shared (local)**      | `*/shared/auth/`                | P0       | auth interceptor HTTP, token storage helper (si duplicable)      |
| **packages/contracts**  | `packages/contracts/src/auth/`  | P0       | DTOs `LoginRequest`, `AuthResponse`, `TokenPayload`, rôles enum  |
| **packages/api-client** | `packages/api-client/src/auth/` | P1       | `AuthClient` typé (login, refresh, logout)                       |
| **api**                 | `apps/api/src/auth/`            | P0       | module NestJS : Supabase Auth wiring, session, guards, role RBAC |

### 2. Onboarding

| Couche        | Placement                       | Priorité | Contenu concret                                           |
| ------------- | ------------------------------- | -------- | --------------------------------------------------------- |
| **mobile**    | `mobile/…/features/onboarding/` | P0       | écran bienvenue post-première-connexion, carousel info    |
| **web**       | —                               | —        | pas de flux onboarding sur le site vitrine MVP            |
| **packages/** | —                               | —        | aucun contrat partagé nécessaire (UI-only)                |
| **api**       | —                               | —        | flag `hasCompletedOnboarding` géré via profil participant |

### 3. Dashboard (`DSH`)

| Couche                  | Placement                            | Priorité | Contenu concret                                                    |
| ----------------------- | ------------------------------------ | -------- | ------------------------------------------------------------------ |
| **mobile**              | `mobile/…/features/dashboard/`       | P0       | accueil participant : cartes programme, rappels, annonces récentes |
| **web**                 | `web/…/features/dashboard/`          | P1       | vue participant web (miroir simplifié du mobile)                   |
| **shared (local)**      | `*/shared/dashboard/`                | P1       | composants cartes programme/stats si partageables                  |
| **packages/contracts**  | `packages/contracts/src/dashboard/`  | P0       | DTO `DashboardAggregate` (programmes, sessions à venir, annonces)  |
| **packages/api-client** | `packages/api-client/src/dashboard/` | P1       | `DashboardClient.getAggregate()`                                   |
| **api**                 | `apps/api/src/dashboard/`            | P0       | endpoint agrégé `/dashboard` par participant                       |

Contrat API MVP stabilisé pour DSH-02 :

- endpoint : `GET /dashboard` (Bearer token requis)
- réponse : `DashboardAggregateDto` avec `programs`, `upcomingSessions`, `recentAnnouncements`

### 4. Programs (`PRG`)

| Couche                  | Placement                           | Priorité | Contenu concret                                                           |
| ----------------------- | ----------------------------------- | -------- | ------------------------------------------------------------------------- |
| **mobile**              | `mobile/…/features/programs/`       | P0       | liste programmes suivis, détail programme, sessions à venir               |
| **web**                 | `web/…/features/programs/`          | P0       | vitrine publique : catalogue programmes, détail public                    |
| **shared (local)**      | `*/shared/programs/`                | P1       | composant carte programme si même rendu web/mobile                        |
| **packages/contracts**  | `packages/contracts/src/programs/`  | P0       | DTOs `ProgramSummary`, `ProgramDetail`, `CohortSummary`, `SessionSummary` |
| **packages/domain**     | `packages/domain/src/programs/`     | P0       | règles de progression, statuts, visibilité par rôle                       |
| **packages/api-client** | `packages/api-client/src/programs/` | P1       | `ProgramClient.list()`, `.detail(slug)`                                   |
| **api**                 | `apps/api/src/programs/`            | P0       | endpoints liste/detail programmes, cohortes, sessions                     |

### 5. Resources (`RES`)

| Couche                  | Placement                            | Priorité | Contenu concret                                                 |
| ----------------------- | ------------------------------------ | -------- | --------------------------------------------------------------- |
| **mobile**              | `mobile/…/features/resources/`       | P0       | écran recherche/filtre, détail ressource, aperçu/téléchargement |
| **web**                 | `web/…/features/resources/`          | P1       | consultation ressources côté web participant (si activé)        |
| **packages/contracts**  | `packages/contracts/src/resources/`  | P0       | DTOs `ResourceSummary`, `ResourceDetail`, enum `ResourceType`   |
| **packages/api-client** | `packages/api-client/src/resources/` | P1       | `ResourceClient.list(filters)`, `.detail(id)`                   |
| **api**                 | `apps/api/src/resources/`            | P0       | endpoints liste/filtre/detail ressources                        |

### 6. Announcements (`ANN`)

| Couche                  | Placement                                | Priorité | Contenu concret                                             |
| ----------------------- | ---------------------------------------- | -------- | ----------------------------------------------------------- |
| **mobile**              | `mobile/…/features/announcements/`       | P0       | feed annonces, détail, marquage lu                          |
| **web**                 | `web/…/features/announcements/`          | P1       | fil annonces participant web (si zone authentifiée activée) |
| **packages/contracts**  | `packages/contracts/src/announcements/`  | P0       | DTOs `AnnouncementSummary`, `AnnouncementDetail`            |
| **packages/api-client** | `packages/api-client/src/announcements/` | P1       | `AnnouncementClient.feed()`, `.detail(id)`                  |
| **api**                 | `apps/api/src/announcements/`            | P0       | endpoints feed/detail annonces + push trigger               |

### 7. Support (`SUP`)

| Couche                  | Placement                          | Priorité | Contenu concret                                              |
| ----------------------- | ---------------------------------- | -------- | ------------------------------------------------------------ |
| **mobile**              | `mobile/…/features/support/`       | P0       | formulaire support authentifié, liste tickets, détail        |
| **web**                 | `web/…/features/contact/`          | P0       | formulaire contact public (existe déjà)                      |
| **web**                 | `web/…/features/support/`          | P1       | espace suivi tickets participant web (si zone auth activée)  |
| **packages/contracts**  | `packages/contracts/src/support/`  | P0       | DTOs `SupportRequest`, `ContactForm`, enum `SupportCategory` |
| **packages/api-client** | `packages/api-client/src/support/` | P1       | `SupportClient.create()`, `.list()`, `.detail(id)`           |
| **api**                 | `apps/api/src/support/`            | P0       | endpoint contact/support + envoi email transactionnel        |

### 8. Billing

| Couche     | Placement | Priorité | Contenu concret                    |
| ---------- | --------- | -------- | ---------------------------------- |
| **toutes** | —         | ❌       | **explicitement hors MVP** (V1.1+) |

> Billing couvre paiements, abonnements, tunnels commerciaux. Ces fonctionnalités
> sont listées comme hors périmètre dans le brief MVP et `AGENTS.md`. Aucun
> dossier ne doit être créé avant une décision produit explicite.

---

## Vue Synthétique — Répertoires Par Surface

### `apps/client/projects/web/src/app/features/`

| Dossier          | Priorité | Rôle                                    |
| ---------------- | -------- | --------------------------------------- |
| `home/`          | P0       | page d'accueil vitrine                  |
| `about/`         | P0       | page à propos                           |
| `services/`      | P0       | page services                           |
| `programs/`      | P0       | catalogue programmes (vitrine publique) |
| `contact/`       | P0       | formulaire contact public               |
| `auth/`          | P0       | guard, redirect, login page minimale    |
| `dashboard/`     | P1       | tableau de bord participant web         |
| `resources/`     | P1       | consultation ressources participant web |
| `announcements/` | P1       | fil annonces participant web            |
| `support/`       | P1       | suivi tickets support participant web   |

### `apps/client/projects/mobile/src/app/features/`

| Dossier          | Priorité | Rôle                               |
| ---------------- | -------- | ---------------------------------- |
| `auth/`          | P0       | login, signup, reset               |
| `onboarding/`    | P0       | bienvenue post-première-connexion  |
| `dashboard/`     | P0       | accueil participant                |
| `programs/`      | P0       | liste/détail programmes + sessions |
| `resources/`     | P0       | liste/filtre/détail ressources     |
| `announcements/` | P0       | feed annonces                      |
| `support/`       | P0       | formulaire + suivi support         |

### `packages/`

| Dossier           | Priorité | Rôle                                                   |
| ----------------- | -------- | ------------------------------------------------------ |
| `contracts/src/`  | P0       | DTOs, enums, schemas de validation, versioning         |
| `domain/src/`     | P0       | règles métier pures (progression, visibilité, statuts) |
| `api-client/src/` | P1       | client HTTP typé web/mobile → API                      |

Sous-dossiers prévus dans `packages/contracts/src/` :
`auth/`, `dashboard/`, `programs/`, `resources/`, `announcements/`, `support/`

Sous-dossiers prévus dans `packages/domain/src/` :
`programs/`, `enrollment/`, `visibility/`

### `apps/api/src/` (modules NestJS)

| Module           | Priorité | Rôle                                   |
| ---------------- | -------- | -------------------------------------- |
| `auth/`          | P0       | Supabase Auth, session, guards, RBAC   |
| `dashboard/`     | P0       | endpoint agrégé participant            |
| `programs/`      | P0       | CRUD programmes, cohortes, sessions    |
| `resources/`     | P0       | CRUD ressources                        |
| `announcements/` | P0       | CRUD annonces + trigger notifications  |
| `support/`       | P0       | contact/support + email transactionnel |

---

## Règle De Décision : Web Vs Mobile Vs Shared

1. **Mobile-first** pour tout flux authentifié participant (auth, dashboard,
   programmes, ressources, annonces, support, onboarding).
2. **Web = vitrine** en priorité P0 (accueil, à propos, services, programmes
   publics, contact).
3. **Web authentifié** (dashboard, ressources, annonces, support côté
   participant) est P1 — les dossiers existent mais l'implémentation est
   différée.
4. **`packages/*`** contient uniquement ce qui est consommé par au moins 2
   surfaces (web + mobile, ou mobile + api). Ne pas y mettre de logique
   mono-surface.
5. **`shared/` local** (dans chaque projet Angular) contient les composants UI
   et services réutilisables à l'intérieur d'un même projet. La mutualisation
   cross-projet passe par `packages/*`.
6. **Billing** : aucun dossier, aucun contrat, aucun module tant qu'il n'y a pas
   de décision produit explicite pour le V1.1+.
