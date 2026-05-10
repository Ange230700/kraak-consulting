# Backlog Produit MVP KRAAK - Epics, Issues Et Milestones

- Projet : KRAAK (MVP web + base mobile)
- Depot : <https://github.com/Ange230700/kraak-group>
- Project board : voir le board actif documenté dans `docs/runbooks/GITHUB_PROJECT_BOARD.md`
- Mise a jour : 10 avril 2026

---

## Cadre Du Backlog

Ce backlog couvre le MVP avec 13 epics, des issues détaillées, des priorités et
des dépendances explicites.

Ce document reste la source de verite **metier** du MVP. Pour le pilotage
quotidien a deux, la source de verite **opérationnelle** devient :

- `docs/runbooks/GITHUB_PROJECT_BOARD.md` pour les vues, champs et règles board
- `docs/specs/github_project_import_parallel_duo.csv` pour la projection
  `Lane / Surface / Coupling / Wave`

Échelle de priorité appliquée à toutes les issues :

- `P0` : bloquant MVP / pilot release
- `P1` : essentiel mais non bloquant immédiat
- `P2` : utile, post-pilot possible si nécessaire

Règle de dépendances :

- `none` : aucune dépendance
- liste d'IDs : issue(s) à terminer avant démarrage

---

## Règles De Découpage Pour Travail A Deux

Objectif : réduire les blocages entre collaborateurs sans changer le scope MVP.

Règles à appliquer dans le GitHub Project :

- une tâche active = **une surface principale** (`web`, `mobile`, `api`,
  `shared`, `qa`, `ops`)
- une tâche active = **un résultat observable** et **une validation**
  principal(e)
- ne pas garder une meme issue pour `web + mobile` ou `api + UI` quand un
  handoff explicite suffit
- les contrats et endpoints partages servent de **point de passage court**, pas
  de zone de travail longue
- les tests transverses doivent être découpés par surface ou par parcours, puis
  regroupes seulement au niveau du reporting

Lanes recommandées :

| Lane                              | Portée principale                                 | Type de travail                  |
| --------------------------------- | ------------------------------------------------- | -------------------------------- |
| `Lane A - Web public`             | site vitrine, conversion, SEO, contact web        | plutôt indépendant               |
| `Lane B - Platform & participant` | packages, API, mobile, auth, parcours participant | plutôt séquentiel mais concentré |
| `Shared handoff`                  | contrats, conventions, quality gates, release     | court, explicite, limité         |

Issues a re-découper au niveau board si elles redeviennent bloquantes :

- `WEB-01` : piloter en sous-tranches `Accueil`, `A propos`, `Services`,
  `Programmes`, `Contact`
- `AUT-04` : séparer la garde web et la garde mobile si les deux surfaces
  avancent en parallèle
- `QAT-02` : séparer couverture composants `web` et `mobile`
- `QAT-03` : suivre les tests d'intégration API par module critique
- `QAT-04` : suivre les E2E par parcours (`auth`, `dashboard`, `programmes`,
  `ressources`, `support`)

Principe de pilotage :

- garder les IDs backlog actuels pour la cohérence du MVP
- utiliser les champs board `Lane`, `Surface`, `Coupling` et `Wave` pour
  resynchroniser le travail réel sans renuméroter tout le backlog

---

## Milestones

| Milestone                           | Intent                                            | Exit criteria                                                           |
| ----------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------- |
| `M1 - Architecture locked`          | architecture validée et tracée                    | toutes les issues `ARC-*` en `done`                                     |
| `M2 - Workspace bootstrapped`       | socle de dev opérationnel                         | toutes les issues `SET-*` + `LIB-01` + `LIB-02` en `done`               |
| `M3 - Mobile shell ready`           | shell mobile navigable et installable             | toutes les issues `MOB-*` en `done`                                     |
| `M4 - Auth ready`                   | authentification stable web/mobile/api            | toutes les issues `AUT-*` en `done`                                     |
| `M5 - Core participant flows ready` | parcours coeur participant utilisables            | toutes les issues `DSH-*`, `PRG-*`, `RES-*`, `ANN-*`, `SUP-*` en `done` |
| `M6 - QA ready`                     | couverture de test et stabilisation pre-lancement | toutes les issues `QAT-*` en `done`                                     |
| `M7 - Pilot release ready`          | déploiement pilote et runbooks opérationnels      | toutes les issues `DEP-*` en `done`                                     |

---

## Epic 1 - Architecture (`ARC`)

Objectif : figer les choix techniques et les contrats de base.
Milestone cible : `M1 - Architecture locked`

| Issue ID | Tache                                                                                       | Priorité | Dépendances        |
| -------- | ------------------------------------------------------------------------------------------- | -------- | ------------------ |
| `ARC-01` | Valider architecture cible web/mobile/api avec scope MVP                                    | `P0`     | `none`             |
| `ARC-02` | Définir conventions repo (naming, structure, quality gates)                                 | `P0`     | `ARC-01`           |
| `ARC-03` | Définir stratégie de rendu web (SEO/prerender)                                              | `P0`     | `ARC-01`           |
| `ARC-04` | Définir modèles de donnees MVP (participant, programme, ressource, annonce, ticket support) | `P0`     | `ARC-01`           |
| `ARC-05` | Documenter ADRs et critères anti-scope-creep                                                | `P1`     | `ARC-02`, `ARC-04` |

---

## Epic 2 - Workspace Setup (`SET`)

Objectif : rendre le workspace buildable, testable et automatisable.
Milestone cible : `M2 - Workspace bootstrapped`

| Issue ID | Tache                                                                                              | Priorité | Dépendances                  |
| -------- | -------------------------------------------------------------------------------------------------- | -------- | ---------------------------- |
| `SET-01` | Initialiser workspace Angular monorepo (`apps/client/projects/web`, `apps/client/projects/mobile`) | `P0`     | `ARC-02`                     |
| `SET-02` | Initialiser `apps/api` NestJS et wiring de base                                                    | `P0`     | `ARC-02`                     |
| `SET-03` | Configurer quality gates (lint, format, typecheck)                                                 | `P0`     | `SET-01`, `SET-02`           |
| `SET-04` | Configurer test runners unitaires + integration                                                    | `P0`     | `SET-01`, `SET-02`           |
| `SET-05` | Configurer Playwright E2E et smoke pipeline                                                        | `P0`     | `SET-01`, `SET-04`           |
| `SET-06` | Configurer CI GitHub Actions multi-apps                                                            | `P0`     | `SET-03`, `SET-04`, `SET-05` |
| `SET-07` | Mettre en place variables d'environnement et runbook local dev                                     | `P1`     | `SET-02`                     |

---

## Epic 3 - Shared Libraries (`LIB`)

Objectif : factoriser les contrats et la logique transverse sans sur-ingénierie.
Milestone cible : `M2 - Workspace bootstrapped`

| Issue ID | Tache                                                           | Priorité | Dépendances        |
| -------- | --------------------------------------------------------------- | -------- | ------------------ |
| `LIB-01` | Créer `packages/contracts` (DTO, schema validation, versioning) | `P0`     | `ARC-04`, `SET-02` |
| `LIB-02` | Créer `packages/domain` (règles metier pures MVP)               | `P0`     | `ARC-04`, `LIB-01` |
| `LIB-03` | Créer `packages/api-client` (typed client web/mobile vers API)  | `P1`     | `LIB-01`, `SET-02` |
| `LIB-04` | Ajouter tests unitaires libs + guideline de publication interne | `P1`     | `LIB-02`, `LIB-03` |

---

## Epic 4 - Website (`WEB`)

Objectif : livrer le site vitrine MVP oriente conversion.
Milestone cible : `M5 - Core participant flows ready`

| Issue ID | Tache                                                                     | Priorité | Dépendances        |
| -------- | ------------------------------------------------------------------------- | -------- | ------------------ |
| `WEB-01` | Implementer pages core (Accueil, A propos, Services, Programmes, Contact) | `P0`     | `SET-01`, `ARC-03` |
| `WEB-02` | Intégrer formulaires de contact et CTA conversion                         | `P0`     | `WEB-01`, `SUP-01` |
| `WEB-03` | Ajouter SEO technique (meta, sitemap, robots, Open Graph)                 | `P0`     | `WEB-01`           |
| `WEB-04` | Ajouter analytics web (PostHog/GA)                                        | `P1`     | `WEB-01`           |
| `WEB-05` | Optimiser accessibilité/performance (objectif Lighthouse > 90)            | `P1`     | `WEB-01`, `WEB-03` |

---

## Epic 5 - Mobile Shell (`MOB`)

Objectif : fournir l'ossature mobile Ionic/Capacitor prête pour les modules.
Milestone cible : `M3 - Mobile shell ready`

| Issue ID | Tache                                                            | Priorité | Dépendances        |
| -------- | ---------------------------------------------------------------- | -------- | ------------------ |
| `MOB-01` | Initialiser app Ionic Angular dans `apps/client/projects/mobile` | `P0`     | `SET-01`           |
| `MOB-02` | Mettre en place navigation shell (tabs/stack) et layout de base  | `P0`     | `MOB-01`           |
| `MOB-03` | Intégrer theming, design tokens et composants UI de base         | `P1`     | `MOB-01`, `LIB-01` |
| `MOB-04` | Configurer Capacitor (Android/iOS) et builds debug               | `P0`     | `MOB-01`           |
| `MOB-05` | Ajouter service notifications push stub (FCM wiring initial)     | `P1`     | `MOB-04`, `SET-02` |

---

## Epic 6 - Auth (`AUT`)

Objectif : offrir une authentification sécurisée et cohérente web/mobile.
Milestone cible : `M4 - Auth ready`

| Issue ID | Tache                                                  | Priorité | Dépendances        |
| -------- | ------------------------------------------------------ | -------- | ------------------ |
| `AUT-01` | Configurer Supabase Auth (providers, policies de base) | `P0`     | `ARC-04`, `SET-02` |
| `AUT-02` | Implementer endpoints API auth/session (NestJS)        | `P0`     | `AUT-01`, `LIB-01` |
| `AUT-03` | Implementer écrans login/signup/reset mobile           | `P0`     | `MOB-02`, `AUT-02` |
| `AUT-04` | Implementer garde routes protégées web/mobile          | `P0`     | `AUT-02`, `LIB-03` |
| `AUT-05` | Ajouter gestion role participant/admin minimal         | `P1`     | `AUT-02`, `ARC-04` |

---

## Epic 7 - Dashboard (`DSH`)

Objectif : page d'accueil participant avec synthèse des éléments utiles.
Milestone cible : `M5 - Core participant flows ready`

| Issue ID | Tache                                                            | Priorité | Dépendances                  |
| -------- | ---------------------------------------------------------------- | -------- | ---------------------------- |
| `DSH-01` | Définir contenu dashboard MVP (cartes, rappels, dernières actus) | `P0`     | `ARC-04`                     |
| `DSH-02` | Exposer endpoint dashboard aggregate côté API                    | `P0`     | `SET-02`, `LIB-01`, `AUT-02` |
| `DSH-03` | Implémenter vue dashboard mobile                                 | `P0`     | `MOB-02`, `AUT-04`, `DSH-02` |
| `DSH-04` | Implémenter vue dashboard web participant (si activée MVP)       | `P1`     | `WEB-01`, `AUT-04`, `DSH-02` |

---

## Epic 8 - Programs (`PRG`)

Objectif : permettre consultation et suivi simple des programmes.
Milestone cible : `M5 - Core participant flows ready`

| Issue ID | Tache                                                   | Priorité | Dépendances                            |
| -------- | ------------------------------------------------------- | -------- | -------------------------------------- |
| `PRG-01` | Définir modèle programme/cohorte/statut progression MVP | `P0`     | `ARC-04`                               |
| `PRG-02` | Implémenter endpoints liste/detail programmes           | `P0`     | `SET-02`, `LIB-01`, `AUT-02`, `PRG-01` |
| `PRG-03` | Implémenter écran mobile liste + détail programme       | `P0`     | `MOB-02`, `PRG-02`                     |
| `PRG-04` | Implémenter marquage de progression minimale            | `P1`     | `PRG-02`, `LIB-02`                     |
| `PRG-05` | Ajouter scenarii de test Given/When/Then programmes     | `P1`     | `PRG-03`, `PRG-04`, `QAT-01`           |

---

## Epic 9 - Resources (`RES`)

Objectif : offrir un accès simple à des ressources utiles aux participants.
Milestone cible : `M5 - Core participant flows ready`

| Issue ID | Tache                                                    | Priorité | Dépendances                            |
| -------- | -------------------------------------------------------- | -------- | -------------------------------------- |
| `RES-01` | Définir taxonomie ressources (type, thème, audience)     | `P0`     | `ARC-04`                               |
| `RES-02` | Implémenter endpoints ressources (liste, filtre, détail) | `P0`     | `SET-02`, `LIB-01`, `AUT-02`, `RES-01` |
| `RES-03` | Implémenter écran mobile ressources (recherche/filtre)   | `P0`     | `MOB-02`, `RES-02`                     |
| `RES-04` | Implémenter tracking consultation ressources             | `P1`     | `RES-02`, `WEB-04`                     |

---

## Epic 10 - Announcements (`ANN`)

Objectif : diffuser annonces et mises à jour importantes.
Milestone cible : `M5 - Core participant flows ready`

| Issue ID | Tache                                                | Priorité | Dépendances                            |
| -------- | ---------------------------------------------------- | -------- | -------------------------------------- |
| `ANN-01` | Définir format annonce et règles de publication MVP  | `P0`     | `ARC-04`                               |
| `ANN-02` | Implémenter endpoints annonces (feed + détail)       | `P0`     | `SET-02`, `LIB-01`, `AUT-02`, `ANN-01` |
| `ANN-03` | Implémenter flux annonces dans mobile dashboard/feed | `P0`     | `MOB-02`, `DSH-02`, `ANN-02`           |
| `ANN-04` | Ajouter notification push pour annonce prioritaire   | `P1`     | `MOB-05`, `ANN-02`                     |

---

## Epic 11 - Support (`SUP`)

Objectif : mettre en place un canal de support simple et fiable.
Milestone cible : `M5 - Core participant flows ready`

| Issue ID | Tache                                                        | Priorité | Dépendances                  |
| -------- | ------------------------------------------------------------ | -------- | ---------------------------- |
| `SUP-01` | Implémenter endpoint contact/support (API + validation)      | `P0`     | `SET-02`, `LIB-01`           |
| `SUP-02` | Intégrer formulaire support dans mobile                      | `P0`     | `MOB-02`, `SUP-01`, `AUT-04` |
| `SUP-03` | Intégrer formulaire contact site web                         | `P0`     | `WEB-01`, `SUP-01`           |
| `SUP-04` | Configurer envoi email transactionnel (Resend ou équivalent) | `P1`     | `SUP-01`                     |
| `SUP-05` | Ajouter suivi et statut basique des demandes support         | `P1`     | `SUP-01`, `AUT-05`           |

---

## Epic 12 - QA (`QAT`)

Objectif : vérifier la conformité fonctionnelle, qualité et robustesse du MVP.
Milestone cible : `M6 - QA ready`

| Issue ID | Tache                                                         | Priorité | Dépendances                                                |
| -------- | ------------------------------------------------------------- | -------- | ---------------------------------------------------------- |
| `QAT-01` | Définir matrice de couverture (page, composant, comportement) | `P0`     | `SET-04`, `SET-05`                                         |
| `QAT-02` | Écrire tests unitaires composants critiques web/mobile        | `P0`     | `QAT-01`, `WEB-01`, `MOB-02`                               |
| `QAT-03` | Écrire tests integration API modules critiques                | `P0`     | `QAT-01`, `AUT-02`, `PRG-02`, `RES-02`, `ANN-02`, `SUP-01` |
| `QAT-04` | Écrire E2E Given/When/Then pour parcours coeur participant    | `P0`     | `QAT-01`, `AUT-03`, `DSH-03`, `PRG-03`, `RES-03`, `SUP-02` |
| `QAT-05` | Réaliser campagne regression et corriger blockers             | `P0`     | `QAT-02`, `QAT-03`, `QAT-04`                               |
| `QAT-06` | Réaliser checks accessibilité/performance pre-pilot           | `P1`     | `QAT-05`, `WEB-05`                                         |

Référence QAT-01 : `docs/specs/qa_coverage_matrix.md`

---

## Epic 13 - Deployment (`DEP`)

Objectif : préparer et exécuter un lancement pilote maîtrise.
Milestone cible : `M7 - Pilot release ready`

| Issue ID | Tache                                                      | Priorité | Dépendances                            |
| -------- | ---------------------------------------------------------- | -------- | -------------------------------------- |
| `DEP-01` | Configurer environnements (dev/staging/pilot)              | `P0`     | `SET-07`                               |
| `DEP-02` | Mettre en place pipeline déploiement web                   | `P0`     | `SET-06`, `WEB-05`                     |
| `DEP-03` | Mettre en place pipeline déploiement API                   | `P0`     | `SET-06`, `QAT-03`                     |
| `DEP-04` | Preparer distribution mobile test (APK/TestFlight interne) | `P0`     | `MOB-04`, `QAT-04`                     |
| `DEP-05` | Finaliser observabilité et alerting minimum                | `P1`     | `DEP-02`, `DEP-03`                     |
| `DEP-06` | Rédiger runbook incident + rollback + pilot checklist      | `P0`     | `DEP-01`, `DEP-05`, `QAT-06`           |
| `DEP-07` | Executer go/no-go pilote et publier release pilote         | `P0`     | `DEP-02`, `DEP-03`, `DEP-04`, `DEP-06` |

---

## Vue Dépendances Entre Epics

| Epic  | Dépendances amont                               |
| ----- | ----------------------------------------------- |
| `ARC` | none                                            |
| `SET` | `ARC`                                           |
| `LIB` | `ARC`, `SET`                                    |
| `MOB` | `SET`, `LIB`                                    |
| `AUT` | `SET`, `LIB`, `MOB`                             |
| `WEB` | `SET`, `SUP` (pour formulaires relies API)      |
| `DSH` | `AUT`, `MOB`, `LIB`                             |
| `PRG` | `AUT`, `MOB`, `LIB`                             |
| `RES` | `AUT`, `MOB`, `LIB`                             |
| `ANN` | `AUT`, `MOB`, `DSH`                             |
| `SUP` | `SET`, `LIB`, `AUT`                             |
| `QAT` | `WEB`, `AUT`, `DSH`, `PRG`, `RES`, `ANN`, `SUP` |
| `DEP` | `QAT`, `WEB`, `MOB`, `SET`                      |

---

## Definition Of Done Par Milestone

- `M1 - Architecture locked` : documents d'architecture valides, conventions fixées, modèles MVP traces.
- `M2 - Workspace bootstrapped` : monorepo fonctionnel, quality gates actifs, CI verte.
- `M3 - Mobile shell ready` : app mobile lançable, navigation de base, build debug valide.
- `M4 - Auth ready` : login/session/protection routes opérationnelles et testées.
- `M5 - Core participant flows ready` : dashboard, programmes, ressources, annonces, support utilisables sur shell mobile (+ web selon scope).
- `M6 - QA ready` : couverture minimales unitaires/integration/E2E atteinte, blockers corrigés.
- `M7 - Pilot release ready` : runbooks, pipelines, observabilité et release pilote valides.

---

## Sequence Recommandée

1. `M1` : clore `ARC-*`.
2. `M2` : clore `SET-*` et socle `LIB-*`.
3. `M3` : clore `MOB-*`.
4. `M4` : clore `AUT-*`.
5. `M5` : clore modules coeur participant (`DSH-*`, `PRG-*`, `RES-*`, `ANN-*`, `SUP-*`) + pages web MVP.
6. `M6` : clore `QAT-*`.
7. `M7` : clore `DEP-*` et lancer pilote.

---

## Notes D'Execution

- Respect strict du scope MVP (pas de glissement V1.1 sans validation explicite).
- TDD obligatoire : `RED -> GREEN -> REFACTOR` sur chaque feature/bug.
- E2E obligatoires sur parcours critiques avec formulation Given/When/Then.
- Politique de langue du depot : code en anglais, documentation/messages en français.

---

## Phase V1.1 — Hors MVP

> Ajouté après clôture du MVP (124 issues, toutes Done). Planifié sur GitHub Project #6.
> Mise à jour : mai 2026

### Cadre V1.1

Ce bloc couvre la phase post-MVP du produit KRAAK. Les 7 epics et 31 tâches V1.1
sont planifiés sur le même board (Project #6) avec les milestones M8, M9 et M10.

Nouvelles options Wave à ajouter manuellement dans les settings GitHub Project :

- `Wave 6 - Monétisation` → PAY + DOC + CMS basique
- `Wave 7 - Apprentissage` → LMS + progression avancée + certification + CRM
- `Wave 8 - Release V1.1` → QA2 + migrations DB + déploiement

---

### Milestones V1.1

| Milestone                      | Numéro GitHub | Périmètre                                 |
| ------------------------------ | ------------- | ----------------------------------------- |
| M8 - Paiement en ligne         | #14           | Stripe checkout, abonnements, factures    |
| M9 - Apprentissage (LMS + DOC) | #15           | LMS complet, documents participants, CMS  |
| M10 - Release V1.1             | #16           | CRM, QA2, migrations DB, déploiement V1.1 |

---

### Epics V1.1

#### [EPIC] [PAY] Paiement en ligne — #329 — M8 — P0

Intégration Stripe : checkout, abonnements, factures et reçus automatiques.

| ID     | Issue                                                         | Surface | Priorité |
| ------ | ------------------------------------------------------------- | ------- | -------- |
| PAY-01 | #336 Integrer Stripe (providers, webhooks, cles API)          | api     | P0       |
| PAY-02 | #337 Implementer checkout sessions (paiement unique)          | api     | P0       |
| PAY-03 | #338 Implementer abonnements et plans recurrents              | api     | P0       |
| PAY-04 | #339 Integrer UI paiement web (checkout et confirmation)      | web     | P0       |
| PAY-05 | #340 Integrer UI paiement mobile (checkout Stripe mobile)     | mobile  | P0       |
| PAY-06 | #341 Generer factures et recus automatiques (Stripe + Resend) | api     | P1       |

---

#### [EPIC] [LMS] Apprentissage et certification — #330 — M9 — P0

LMS léger : cours, modules, leçons, quiz, progression avancée, attestation PDF.

| ID     | Issue                                                                 | Surface | Priorité |
| ------ | --------------------------------------------------------------------- | ------- | -------- |
| LMS-01 | #342 Definir modele cours/module/lecon/quiz                           | shared  | P0       |
| LMS-02 | #343 Implementer endpoints contenu cours (liste, detail, progression) | api     | P0       |
| LMS-03 | #344 Implementer lecteur de contenu mobile                            | mobile  | P0       |
| LMS-04 | #345 Implementer suivi de progression avance                          | api     | P0       |
| LMS-05 | #346 Implementer logique de certification (attestation PDF)           | api     | P0       |
| LMS-06 | #347 Implementer espace apprenant web                                 | web     | P1       |

---

#### [EPIC] [DOC] Documents participants — #331 — M9 — P1

Upload/download sécurisé de documents via Supabase Storage avec RLS.

| ID     | Issue                                                         | Surface | Priorité |
| ------ | ------------------------------------------------------------- | ------- | -------- |
| DOC-01 | #348 Definir modele document (type, visibilite, proprietaire) | shared  | P1       |
| DOC-02 | #349 Implementer endpoints upload/download (Supabase Storage) | api     | P1       |
| DOC-03 | #350 Implementer espace documents mobile                      | mobile  | P1       |
| DOC-04 | #351 Implementer espace documents web                         | web     | P1       |

---

#### [EPIC] [CMS] Gestion de contenu admin — #332 — M9 — P1

Interface éditoriale admin : articles, catégories, tags, blog public web.

| ID     | Issue                                                           | Surface | Priorité |
| ------ | --------------------------------------------------------------- | ------- | -------- |
| CMS-01 | #352 Definir modele editorial (article, categorie, tag, auteur) | shared  | P1       |
| CMS-02 | #353 Implementer endpoints admin publication (CRUD articles)    | api     | P1       |
| CMS-03 | #354 Implementer blog/actualites web (liste, detail)            | web     | P1       |
| CMS-04 | #355 Implementer dashboard admin gestion programmes et contenus | web     | P1       |

---

#### [EPIC] [CRM] Relation client et marketing — #333 — M10 — P2

Enrichissement profil, vue admin participants, scoring, séquences email.

| ID     | Issue                                                                 | Surface | Priorité |
| ------ | --------------------------------------------------------------------- | ------- | -------- |
| CRM-01 | #356 Enrichir profil participant (competences, objectifs, historique) | api     | P2       |
| CRM-02 | #357 Implementer vue admin participants                               | web     | P2       |
| CRM-03 | #358 Implementer scoring et segmentation basique                      | api     | P2       |
| CRM-04 | #359 Configurer sequences email marketing (Resend)                    | api     | P2       |

---

#### [EPIC] [QA2] Qualité et couverture V1.1 — #334 — M10 — P0

Matrice couverture, tests unitaires, E2E et campagne régression V1.1.

| ID     | Issue                                                    | Surface | Priorité |
| ------ | -------------------------------------------------------- | ------- | -------- |
| QA2-01 | #360 Definir matrice couverture V1.1                     | shared  | P0       |
| QA2-02 | #361 Ecrire tests unitaires composants et services V1.1  | shared  | P0       |
| QA2-03 | #362 Ecrire tests E2E parcours paiement et apprentissage | qa      | P0       |
| QA2-04 | #363 Campagne regression V1.1 et correction des blockers | qa      | P0       |

---

#### [EPIC] [DEP2] Déploiement V1.1 — #335 — M10 — P0

Migrations DB, variables d'environnement V1.1, tag et déploiement staging/prod.

| ID      | Issue                                                                 | Surface | Priorité |
| ------- | --------------------------------------------------------------------- | ------- | -------- |
| DEP2-01 | #364 Migrer schema DB V1.1 (Supabase migrations)                      | shared  | P0       |
| DEP2-02 | #365 Configurer variables d'environnement V1.1 (Stripe, Storage, LMS) | ops     | P0       |
| DEP2-03 | #366 Executer release tag V1.1 et deploiement staging/prod            | ops     | P0       |

---

### Definition Of Done Par Milestone V1.1

- `M8 - Paiement en ligne` : flux paiement Stripe fonctionnel end-to-end (web + mobile), webhooks sécurisés, factures générées.
- `M9 - Apprentissage (LMS + DOC)` : LMS opérationnel (cours, progression, certification), documents uploadables/téléchargeables, CMS admin fonctionnel.
- `M10 - Release V1.1` : CRM basique disponible, couverture QA2 atteinte, migrations appliquées en prod, tag V1.1 poussé.

---

### Sequence Recommandée V1.1

1. `M8` : clore `PAY-*` (Stripe avant tout le reste).
2. `M9` : clore `LMS-*`, `DOC-*`, `CMS-*` en parallèle (handoff API → UI).
3. `M10` : clore `CRM-*`, puis `QA2-*`, puis `DEP2-*`.
