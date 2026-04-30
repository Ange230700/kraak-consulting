# DEP-07 - Go/No-Go Pilote et Publication Release Pilote

Date: 2026-04-30  
Issue: #124  
Epic: DEP

## Objectif

Consolider les preuves des dépendances DEP-02, DEP-03, DEP-04 et DEP-06,
exécuter le go/no-go officiel du pilote KRAAK, et publier la release pilote
avec les artefacts Git et la documentation associée.

## Dépendances

| Dépendance | Description                               | Statut        |
| ---------- | ----------------------------------------- | ------------- |
| DEP-02     | Pipeline déploiement web (Vercel)         | ✅ Satisfaite |
| DEP-03     | Pipeline déploiement API (Render)         | ✅ Satisfaite |
| DEP-04     | Distribution mobile test (APK/TestFlight) | ✅ Satisfaite |
| DEP-06     | Runbook incident + rollback + checklist   | ✅ Satisfaite |

## Portée DEP-07

Cette tâche couvre :

- consolidation formelle des preuves de toutes les dépendances
- exécution du go/no-go structuré avec critères d'acceptation explicites
- tag Git de la release pilote
- documentation de la release pilote publiée
- enregistrement de la décision go/no-go

Cette tâche ne couvre pas :

- passage en production publique (hors MVP pilot)
- automatisation du déploiement multi-région
- communication externe (marketing, SEO de lancement)

---

## 1. Consolidation Des Dépendances

### 1.1 DEP-02 — Pipeline déploiement web (Vercel)

**Statut** : ✅ Go

Preuves :

- site vitrine KRAAK déployé et accessible : `https://kraak-group.vercel.app`
- pipeline CI/CD Vercel actif (déploiements automatiques sur `main`)
- toutes les routes critiques répondent avec HTTP 200 :
  - `/` (Accueil)
  - `/services`
  - `/programmes`
  - `/contact`
- workflow `Observability` vérifie la home toutes les 15 minutes

### 1.2 DEP-03 — Pipeline déploiement API (Render)

**Statut** : ✅ Go

Preuves :

- API KRAAK déployée et accessible : `https://kraak-api.onrender.com`
- `GET /health` renvoie un payload enrichi :
  ```json
  {
    "status": "ok",
    "service": "kraak-api",
    "environment": "production",
    "timestamp": "<timestamp>",
    "version": "pilot-2026-04-30",
    "uptimeSeconds": "<uptime>"
  }
  ```
- `render.yaml` configure `healthCheckPath: /health`
- workflow `Observability` vérifie `/health` toutes les 15 minutes
- tests unitaires contrat santé : 2 suites, 4 tests passés

### 1.3 DEP-04 — Distribution mobile test (APK/TestFlight)

**Statut** : ✅ Go

Preuves :

- runbook de distribution interne livré : `docs/runbooks/DEP-04_MOBILE_TEST_DISTRIBUTION_2026-04-30.md`
- build Android debug validé (`pnpm build:debug:android`) : succès
- sync Capacitor Android terminé sans erreur
- job CI Android APK présent dans `.github/workflows/ci.yml` (job `android-debug`)
- suite E2E parcours cœur participant : 2 tests, 2 passés (QAT-04 satisfaite)
- evidence : `docs/runbooks/evidence/DEP-04_mobile-test-distribution-evidence_2026-04-30.md`

### 1.4 DEP-06 — Runbook incident + rollback + checklist

**Statut** : ✅ Go

Preuves :

- runbook livré : `docs/runbooks/DEP-06_INCIDENT_ROLLBACK_PILOT_CHECKLIST_2026-04-30.md`
- procédures d'incident documentées (détection, diagnostic, mitigation)
- procédures de rollback documentées pour Vercel (web) et Render (API)
- checklist complète de lancement pilot incluse
- evidence : `docs/runbooks/evidence/DEP-06_incident-rollback-pilot-evidence_2026-04-30.md`

---

## 2. Grille Go/No-Go Pilote

### Critères impératifs (P0 — tous requis pour GO)

| #   | Critère                                                                | Statut | Source de preuve |
| --- | ---------------------------------------------------------------------- | ------ | ---------------- |
| 1   | Site web pilote accessible et HTTP 200 sur toutes les routes critiques | ✅ GO  | DEP-02 / QAT-06  |
| 2   | API pilote accessible et `GET /health` opérationnel                    | ✅ GO  | DEP-03 / DEP-05  |
| 3   | Zéro violation `critical` ou `serious` d'accessibilité                 | ✅ GO  | QAT-06 evidence  |
| 4   | Suite E2E parcours cœur participant verte                              | ✅ GO  | DEP-04 / QAT-04  |
| 5   | Runbook incident + rollback disponible                                 | ✅ GO  | DEP-06           |
| 6   | Workflow observabilité actif (alerte toutes les 15 min)                | ✅ GO  | DEP-05           |
| 7   | Distribution mobile test (APK) préparée                                | ✅ GO  | DEP-04           |
| 8   | Tests unitaires critiques API passés (QAT-03)                          | ✅ GO  | QAT-03 evidence  |
| 9   | Tests de régression passés (QAT-05)                                    | ✅ GO  | QAT-05 evidence  |

### Critères de performance (P1 — non bloquants mais surveiller)

| #   | Critère                                                 | Statut        | Remarque                                      |
| --- | ------------------------------------------------------- | ------------- | --------------------------------------------- |
| 1   | Budget de taille mobile respecté                        | ⚠️ Surveiller | `703.79 kB` vs budget `600 kB` — non bloquant |
| 2   | Score performance Lighthouse > 70 sur toutes les routes | ✅            | Vérifié QAT-06                                |

---

## 3. Décision Go/No-Go

**Date de décision** : 2026-04-30

**Décision** : ✅ **GO**

**Périmètre du pilote** :

- Surface web : `https://kraak-group.vercel.app` (routes `/`, `/services`, `/programmes`, `/contact`)
- Surface API : `https://kraak-api.onrender.com` (endpoints de contact, health)
- Surface mobile : APK debug disponible pour distribution interne (TestFlight iOS en préparation)

**Conditions du pilote** :

- pilote interne uniquement (équipe KRAAK + testeurs invités)
- durée cible : 2 à 4 semaines
- kanban de suivi des retours : GitHub Project KRAAK MVP

**Points de vigilance** :

- surveiller le budget de taille du bundle mobile (703 kB > budget 600 kB)
- activer l'alerte observabilité dès le premier déploiement pilot
- tenir le runbook DEP-06 à portée en cas d'incident

---

## 4. Publication Release Pilote

### 4.1 Tag Git de release

La release pilote est matérialisée par le tag Git `pilot-2026-04-30` posé sur
le commit de merge de DEP-07 dans `main`.

Commande utilisée :

```bash
git tag -a pilot-2026-04-30 -m "Release pilote KRAAK — 2026-04-30

Go/No-Go : GO
Périmètre : web (Vercel) + API (Render) + mobile debug (APK)
Commit : HEAD
"
git push origin pilot-2026-04-30
```

### 4.2 Périmètre de la release pilote

#### Web — `https://kraak-group.vercel.app`

Pages déployées :

| Route         | Statut  |
| ------------- | ------- |
| `/`           | ✅ Live |
| `/services`   | ✅ Live |
| `/programmes` | ✅ Live |
| `/contact`    | ✅ Live |
| `/a-propos`   | ✅ Live |

Fonctionnalités opérationnelles :

- présentation de l'identité et de la mission KRAAK
- présentation des services (Formation, Gestion de projet, Conseil en immigration)
- présentation des programmes / offres
- formulaire de contact fonctionnel (Resend + Supabase)
- SEO de base (metadata, Open Graph, sitemap, robots.txt)
- analytics (Google Analytics via `gtag`)
- accessibilité : zéro violation `critical` ou `serious`

#### API — `https://kraak-api.onrender.com`

Endpoints actifs :

| Endpoint    | Méthode | Statut  |
| ----------- | ------- | ------- |
| `/health`   | GET     | ✅ Live |
| `/contact`  | POST    | ✅ Live |
| `/api-docs` | GET     | ✅ Live |

Fonctionnalités opérationnelles :

- santé de l'API exposée avec métadonnées d'exploitation
- soumission de formulaire de contact avec envoi d'email (Resend)
- documentation OpenAPI / Swagger disponible à `/api-docs`
- observabilité et alerting actifs (workflow GitHub Actions toutes les 15 min)

#### Mobile — Distribution interne

- APK Android debug : généré par CI (job `android-debug`, artefact `debug-apk`)
- iOS : procédure TestFlight documentée dans `docs/runbooks/DEP-04_MOBILE_TEST_DISTRIBUTION_2026-04-30.md`

### 4.3 Notes de release

**Version** : `pilot-2026-04-30`  
**Type** : Pilot interne (non public)  
**Stack** : Angular 19 + PrimeNG + Tailwind CSS (web) / NestJS (API) / Ionic + Capacitor (mobile)

Changements inclus dans le pilote :

- site vitrine KRAAK complet (5 pages principales)
- API de contact opérationnelle avec validation et envoi d'email
- application mobile debug disponible (Android APK / iOS TestFlight)
- suite de tests complète (unitaires, intégration, E2E, accessibilité, performance)
- observabilité et alerting activés
- runbooks opérationnels complets (incident, rollback, distribution mobile)

---

## 5. Checklist Finale De Release

### Avant la publication (pré-release)

- [x] Tous les critères P0 du go/no-go verts
- [x] Tag `pilot-2026-04-30` posé sur `main`
- [x] Runbook DEP-06 accessible à l'équipe
- [x] Workflow observabilité actif sur `main`
- [x] Documentation API Swagger à jour (`/api-docs`)

### Immédiatement après le GO

- [x] Notifier l'équipe pilote (URL web + URL API + APK)
- [x] Ouvrir le kanban de collecte des retours pilot
- [x] Activer la surveillance observabilité (confirmer workflow actif)
- [x] Documenter la décision dans GitHub Project KRAAK MVP

### Suivi post-release

- [ ] Vérification de santé H+1 (web + API)
- [ ] Premier retour pilote collecté sous 48h
- [ ] Bilan pilote J+14 planifié

---

## 6. Références

| Document                                                                      | Rôle                                    |
| ----------------------------------------------------------------------------- | --------------------------------------- |
| `docs/runbooks/DEP-04_MOBILE_TEST_DISTRIBUTION_2026-04-30.md`                 | Distribution APK + TestFlight           |
| `docs/runbooks/DEP-05_OBSERVABILITY_ALERTING_2026-04-30.md`                   | Observabilité et alerting               |
| `docs/runbooks/DEP-06_INCIDENT_ROLLBACK_PILOT_CHECKLIST_2026-04-30.md`        | Incident, rollback, checklist pilot     |
| `docs/runbooks/evidence/DEP-07_go-no-go-pilot-release-evidence_2026-04-30.md` | Evidence de validation DEP-07           |
| `docs/runbooks/ENVIRONMENT_VARIABLES.md`                                      | Variables d'environnement et URLs pilot |
| `.github/workflows/observability.yml`                                         | Workflow observabilité automatisé       |
