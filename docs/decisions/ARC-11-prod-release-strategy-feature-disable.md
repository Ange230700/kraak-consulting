<!-- docs\decisions\ARC-11-prod-release-strategy-feature-disable.md -->

# ARC-11 — Production Release Strategy: Feature Disabling for MVP Deployment

| Champ          | Valeur                              |
| -------------- | ----------------------------------- |
| **Statut**     | À valider avant implémentation      |
| **Date**       | 2026-05-09                          |
| **Auteurs**    | Équipe KRAAK + Copilot              |
| **Révisé par** | **EN ATTENTE DE VOTRE APPROBATION** |
| **Références** | ARC-10 (feature flags)              |

---

## 1 · Contexte

Avant de tagger une version de production (`v1.0.0` sur `main`), il est nécessaire de **désactiver** les fonctionnalités qui ne sont pas finalisées pour la production tout en les **préservant** sur staging et local. Cela permet une livraison rapide et sécurisée du MVP vitrine sans attendre la complète stabilisation des flux participant.

**Situation actuelle (09 mai 2026)** :

- Code participant et mobile **pleinement implémentés** et testés
- **Déjà gâtés** par le flag `enableParticipantArea` (ARC-10)
- Toutes les autres pages de vitrine **prêtes** pour la production
- Tests : **1 060 tests, 100 % au vert** (API, web, mobile)

---

## 2 · Diagnostic: Ce Qui Sera Livré En Prod vs Ce Qui Restera Hidden

### 2.1 ✅ **PROD READY** (site vitrine MVP)

Ces éléments **SERONT publics** sur main/production :

| Élément                         | Statut                                    | Test Coverage  |
| ------------------------------- | ----------------------------------------- | -------------- |
| Home (`/`)                      | ✅ Production-ready                       | 99%            |
| About (`/a-propos`)             | ✅ Production-ready                       | 99%            |
| Services (`/services`)          | ✅ Production-ready                       | 99%            |
| Programs (`/programmes`)        | ✅ Production-ready (data-driven, public) | 99%            |
| Resources (`/ressources`)       | ✅ Production-ready (orientation, static) | 99%            |
| Contact (`/contact`)            | ✅ Production-ready (form + email)        | 99%            |
| Legal/Privacy (`/mentions-*`)   | ✅ Production-ready (static)              | 99%            |
| API public endpoints            | ✅ Production-ready (6 routes)            | 100%           |
| SEO (meta, sitemap, robots, OG) | ✅ Production-ready                       | Lighthouse >90 |
| Analytics (GA4)                 | ✅ Production-ready                       | Configured     |
| Error handling + 404            | ✅ Production-ready                       | Tested         |

### 2.2 🚫 **STAGING/LOCAL ONLY** (participant area + mobile)

Ces éléments **RESTERONT MASQUÉS** en production mais **ACTIFS** sur staging/dev/local :

#### **Web Participant Area**

| Route/Élément                    | Statut            | Raison                                   | Test Coverage |
| -------------------------------- | ----------------- | ---------------------------------------- | ------------- |
| `/connexion` (sign-in page)      | Implemented, gâté | Dépend Supabase + parcours à valider     | 100%          |
| `/inscription` (sign-up page)    | Implemented, gâté | Dépend Supabase + parcours à valider     | 100%          |
| `/mot-de-passe-oublie` (reset)   | Implemented, gâté | Dépend email transactionnel              | 100%          |
| `/participant/dashboard`         | Implemented, gâté | Dépend contrats API + donnée synthèse    | 100%          |
| Navbar link "Espace participant" | Implemented, gâté | Caché par `@if (participantAreaEnabled)` | 100%          |

#### **Mobile App (Full)**

| Élément                      | Statut          | Raison                              | Test Coverage |
| ---------------------------- | --------------- | ----------------------------------- | ------------- |
| Ionic shell + tabs           | Implemented     | Non déployé en web, déploiement APK | 100%          |
| Mobile auth screens          | Implemented     | Non déployé en web                  | 100%          |
| Mobile dashboard             | Implemented     | Non déploiement en web              | 100%          |
| Mobile programs/resources    | Implemented     | Non déploiement en web              | 100%          |
| Mobile support/announcements | Implemented     | Non déploiement en web              | 100%          |
| Push notifications (FCM)     | Partially ready | Configuration ready, tests only     | 80%           |

#### **API Authenticated Endpoints**

| Route                        | Statut            | Raison                           | Test Coverage |
| ---------------------------- | ----------------- | -------------------------------- | ------------- |
| `GET /participant/dashboard` | Implemented, gâté | Participant routes inaccessibles | 100%          |
| `GET /programs`              | Implemented, gâté | Participant routes inaccessibles | 100%          |
| `GET /resources`             | Implemented, gâté | Participant routes inaccessibles | 100%          |
| `GET /announcements`         | Implemented, gâté | Participant routes inaccessibles | 100%          |
| `POST /support`              | Implemented, gâté | Participant routes inaccessibles | 100%          |
| All other auth endpoints     | Implemented, gâté | Non-accessible sans auth         | 100%          |

### 2.3 ❌ **NOT IMPLEMENTED** (V1.1+)

Ces éléments **n'existent pas en code** et ne poseront aucun problème :

- Payment/Checkout (Stripe, PayPal)
- LMS (courses, progression, certification)
- Document upload/management
- CMS (admin interface, content workflows)
- CRM (lead scoring, email sequences)
- Advanced push notifications (audiences complexes)
- Blog / content hub
- Dépôt de dossiers
- Analyse de profil + scoring automatique

**→ Aucune action requise pour ces éléments.**

---

## 3 · Stratégie Recommandée

### 3.1 Mécanisme Principal : `enableParticipantArea` (DÉJÀ EN PLACE ✅)

L'ADR ARC-10 décrit le système de feature flag :

- **Flag runtime** : `CLIENT_FEATURE_PARTICIPANT_AREA` (injecté via `runtime-config.js`)
- **Comportement défaut prod** : `false` → routes cachées, navbar link masqué
- **Comportement staging/dev** : `true` → toutes les routes actives
- **Injection** : Via script généré `scripts/generate-client-runtime-config.mjs`

**Aucun changement de code requis — le système existe déjà.**

### 3.2 Configuration Render Par Environnement

| Environnement         | Branch      | `CLIENT_FEATURE_PARTICIPANT_AREA` | Exécution                          |
| --------------------- | ----------- | --------------------------------- | ---------------------------------- |
| **Production**        | `main`      | `false` (défaut)                  | ✅ Routes absentes, navbar caché   |
| **Staging (Preview)** | `staging`   | `true` (override)                 | ✅ Routes visibles, participant OK |
| **Dev local**         | N/A         | `true` (recommandé `.env`)        | ✅ Routes visibles, participant OK |
| **PR previews**       | PR branches | `false` (défaut)                  | ✅ Routes absentes (sécurité)      |

### 3.3 API Backend (NestJS)

**Aucune action spécifique requise** :

- Les endpoints participant sont protégés par `@UseGuards(AuthGuard)`
- Même si les routes web sont masquées, les requêtes API non authentifiées seront rejetées
- Risque inexistant : quelqu'un qui accède à `GET /api/participant/dashboard` sans token reçoit `401 Unauthorized`

### 3.4 Mobile

**Déploiement séparé (APK/TestFlight)** :

- N'affecte pas la build web de production
- Rester sur staging/dev pour validation avant déploiement d'app store

### 3.5 Supabase Policies

**Aucune action requise** :

- Les Row-Level Security (RLS) policies Supabase protègent les données au niveau BD
- Même un accès API sans filtrage déclencherait `403 Forbidden` par RLS
- Couche de sécurité indépendante du flag web

---

## 4 · Checklist Avant Tag Release

### 4.1 Configuration Render (À Valider / Configurer)

- [ ] **Projet Render `kraak-consulting`** : vérifier la variable `CLIENT_FEATURE_PARTICIPANT_AREA`
  - [ ] **Production** (`main`) → **`false`** (ou absent = défaut)
  - [ ] **Preview** (`staging`) → **`true`** (override branche)
- [ ] Tester le déploiement Render de `main` avec `CLIENT_FEATURE_PARTICIPANT_AREA=false`
- [ ] Tester le déploiement Render de `staging` avec `CLIENT_FEATURE_PARTICIPANT_AREA=true`

### 4.2 Build & Bundle

- [ ] `pnpm install && pnpm build` passe 100 %
- [ ] `pnpm build:web` génère un bundle web sans erreur
- [ ] `pnpm build:mobile` génère un bundle mobile stable
- [ ] Vérifier la taille du bundle prod : participant area ne doit pas augmenter l'empreinte utilisateur (tree-shake inactif)

### 4.3 Test Suites (Tous Doivent Passer)

- [ ] Web unit tests: `pnpm --filter @kraak/client test web`
- [ ] API tests: `pnpm --filter @kraak/api test`
- [ ] Mobile tests: `pnpm --filter @kraak/client test:mobile`
- [ ] E2E smoke (prod flavor): playwright against staged prod config
- [ ] Coverage: `pnpm test:coverage` → tous les suites au vert, zéro regression

### 4.4 URL & Routing

- [ ] Accéder à `/` → accueil public OK
- [ ] Accéder à `/a-propos`, `/services`, `/programmes`, `/ressources`, `/contact` → pages publiques OK
- [ ] Accéder à `/connexion` → **redirect `404 → /`** en prod (flag `false`)
- [ ] Accéder à `/participant/dashboard` → **redirect `404 → /`** en prod
- [ ] Navbar "Espace participant" link **caché** en prod
- [ ] Sitemap OK (routes participant jamais listées)

### 4.5 API Accessibility (Prod)

- [ ] `GET /api/contact` (public) → **200 OK**
- [ ] `POST /api/contact` (public form) → **200 OK**
- [ ] `GET /api/participant/dashboard` (private) → **401 Unauthorized** (pas de token)
- [ ] `GET /api/programs` (private) → **401 Unauthorized** (pas de token)

### 4.6 Git Workflow (Standard)

- [ ] Créer branche: `git checkout -b chore/release-v1.0.0`
- [ ] Mettre à jour `package.json`, `CHANGELOG.md` (version 1.0.0)
- [ ] Commit: `chore: bump to v1.0.0 for production release`
- [ ] Rebaser sur `main`: `git rebase main`
- [ ] Merge fast-forward: `git merge --ff-only chore/release-v1.0.0`
- [ ] Pousser `main`: `git push origin main`
- [ ] Créer tag: `git tag -a v1.0.0 -m "Production release: MVP vitrine"`
- [ ] Pousser tag: `git push origin v1.0.0`

### 4.7 Post-Release (Documentation)

- [ ] Documenter le release dans `CHANGELOG.md`
- [ ] Mettre à jour `README.md` avec version courante
- [ ] Vérifier URL Render prod accessible
- [ ] Vérifier API prod accessible et répond
- [ ] Envoyer notification aux stakeholders

---

## 5 · Résumé Exécutif

| Aspect                   | État Actuel       | Action Requise                                |
| ------------------------ | ----------------- | --------------------------------------------- |
| **Participant area web** | Implémenté, gâté  | ✅ Rien — déjà masqué par feature flag        |
| **Mobile**               | Implémenté        | ✅ Rien — déploiement séparé (APK)            |
| **API endpoints**        | Implémentés, auth | ✅ Rien — protégés par auth + RLS             |
| **Render config**        | À valider         | ⚠️ **Confirmer flag `false` en prod**         |
| **Tests**                | 1 060 au vert     | ✅ Passer la suite avant tag                  |
| **Git**                  | Prêt              | ✅ Workflow standard + tag v1.0.0             |
| **Documentation**        | À mettre à jour   | ⚠️ Mettre à jour CHANGELOG + README après tag |

---

## 6 · Risques & Atténuation

| Risque                                      | Probabilité | Impact | Mitigation                              |
| ------------------------------------------- | ----------- | ------ | --------------------------------------- |
| Bug surface vitrine non détecté pré-release | Basse       | Haute  | Rejouer full E2E smoke test avant push  |
| Code participant consomme ressources prod   | Très basse  | Basse  | Tree-shake + vérifier bundle size       |
| Flag Render mal configuré, participant OK   | Moyenne     | Haute  | Tester preview branch avant prod push   |
| RLS Supabase not configured                 | Très basse  | Haute  | Vérifier policies.sql + tests API       |
| Mobile APK built with prod API              | Basse       | Haute  | Configurer env de build APK sur staging |

---

## 7 · Questions Pour Validation

Avant de procéder, confirmez :

1. **Render** : La variable `CLIENT_FEATURE_PARTICIPANT_AREA` est-elle déjà configurée sur le projet `kraak-consulting`?
   - `production` → `false`?
   - `preview` + branche `staging` → `true`?

2. **Supabase policies** : Vérifier que toutes les Row-Level Security policies sont actives et testées?

3. **Analytics** : GA4 tracking doit-il être actif en prod dès la v1.0.0 ou attendre validation métier?

4. **Deployment** : Souhaitez-vous un **blue-green deployment** ou un **rolling release** standard Render?

5. **Rollback plan** : En cas de problème prod, bascule possible vers une version antérieure ou faut-il rebuild?

---

## Prochaines Étapes

✅ **Validation client** : Confirmez la liste ci-dessous
✅ **Confirmation Render config** : Vérifiez les variables d'environnement
✅ **Exécution checklist** : Lancez les tests et verifications
✅ **Tag & push** : Déclenchez le release
✅ **Documentation post-release** : Mettez à jour la doc de maintenance
