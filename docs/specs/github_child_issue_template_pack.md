# Pack Templates Issues GitHub - Child Issues MVP KRAAK

> Note du 10 avril 2026 : ce pack reste utile pour créer une nouvelle issue a
> l'unite, mais il ne doit plus servir a recréer en masse une seconde famille
> d'issues pour le board MVP. Pour la remise a plat du project, utiliser
> `docs/runbooks/GITHUB_PROJECT_BOARD.md` et
> `docs/specs/github_project_import_parallel_duo.csv`.

Usage rapide :

1. Créer une nouvelle issue GitHub.
2. Copier-coller le bloc correspondant a l'ID.
3. Ajouter labels et milestone proposes.
4. Lier l'issue a son epic parent.

Convention :

- `type: task` pour tous les child issues (coherence bulk-create)
- `status: backlog` au démarrage
- dépendances sous forme d'IDs backlog

---

## Architecture (`ARC`) - Milestone `M1 - Architecture locked`

### ARC-01

```md
Title: [TASK][ARC-01] Valider architecture cible web/mobile/api avec scope MVP

Labels:

- type: task
- area: architecture
- epic: ARC
- priority: P0
- status: backlog

Milestone:

- M1 - Architecture locked

Body:

## Parent epic

ARC

## Description

Valider l'architecture cible et les limites du scope MVP.

## Dépendances

- none

## Critères d'acceptation

- [ ] Architecture cible confirmée
- [ ] Scope MVP valide
- [ ] Risques majeurs identifies
```

### ARC-02

```md
Title: [TASK][ARC-02] Définir conventions repo (naming, structure, quality gates)

Labels:

- type: task
- area: architecture
- epic: ARC
- priority: P0
- status: backlog

Milestone:

- M1 - Architecture locked

Body:

## Parent epic

ARC

## Description

Définir conventions de structure, nomenclature et qualité.

## Dépendances

- ARC-01

## Critères d'acceptation

- [ ] Conventions documentées
- [ ] Structure cible validée
- [ ] Quality gates définis
```

### ARC-03

```md
Title: [TASK][ARC-03] Définir stratégie de rendu web (SEO/prerender)

Labels:

- type: task
- area: architecture
- epic: ARC
- priority: P0
- status: backlog

Milestone:

- M1 - Architecture locked

Body:

## Parent epic

ARC

## Description

Fixer la stratégie de rendu web adaptée au SEO MVP.

## Dépendances

- ARC-01

## Critères d'acceptation

- [ ] Stratégie de rendu documentée
- [ ] Impacts SEO clarifiés
- [ ] Impacts build/deploy clarifiés
```

### ARC-04

```md
Title: [TASK][ARC-04] Définir modèles de données MVP

Labels:

- type: task
- area: architecture
- epic: ARC
- priority: P0
- status: backlog

Milestone:

- M1 - Architecture locked

Body:

## Parent epic

ARC

## Description

Définir les modèles participant, programme, ressource, annonce, support.

## Dépendances

- ARC-01

## Critères d'acceptation

- [ ] Modèles entités MVP définis
- [ ] Relations principales définies
- [ ] Hypothèses documentées
```

### ARC-05

```md
Title: [TASK][ARC-05] Documenter ADRs et critères anti-scope-creep

Labels:

- type: task
- area: architecture
- epic: ARC
- priority: P1
- status: backlog

Milestone:

- M1 - Architecture locked

Body:

## Parent epic

ARC

## Description

Documenter les décisions d'architecture et règles de protection MVP.

## Dépendances

- ARC-02
- ARC-04

## Critères d'acceptation

- [ ] ADRs rédigées
- [ ] Critères anti-scope-creep explicites
- [ ] Validation équipe obtenue
```

---

## Workspace Setup (`SET`) - Milestone `M2 - Workspace bootstrapped`

### SET-01

```md
Title: [TASK][SET-01] Initialiser workspace Angular monorepo (apps/client/projects/web, apps/client/projects/mobile)

Labels:

- type: task
- area: workspace
- epic: SET
- priority: P0
- status: backlog

Milestone:

- M2 - Workspace bootstrapped

Body:

## Parent epic

SET

## Description

Initialiser le monorepo Angular avec web et mobile.

## Dépendances

- ARC-02

## Critères d'acceptation

- [ ] apps/client/projects/web crée
- [ ] apps/client/projects/mobile crée
- [ ] build local passe
```

### SET-02

```md
Title: [TASK][SET-02] Initialiser apps/api NestJS et wiring de base

Labels:

- type: task
- area: workspace
- epic: SET
- priority: P0
- status: backlog

Milestone:

- M2 - Workspace bootstrapped

Body:

## Parent epic

SET

## Description

Initialiser le backend NestJS et son wiring minimal.

## Dépendances

- ARC-02

## Critères d'acceptation

- [ ] apps/api créée
- [ ] route health disponible
- [ ] lancement local valide
```

### SET-03

```md
Title: [TASK][SET-03] Configurer quality gates (lint, format, typecheck)

Labels:

- type: task
- area: workspace
- epic: SET
- priority: P0
- status: backlog

Milestone:

- M2 - Workspace bootstrapped

Body:

## Parent epic

SET

## Description

Configurer les contrôles qualité standard pour tout le workspace.

## Dépendances

- SET-01
- SET-02

## Critères d'acceptation

- [ ] lint opérationnel
- [ ] format opérationnel
- [ ] typecheck opérationnel
```

### SET-04

```md
Title: [TASK][SET-04] Configurer test runners unitaires + integration

Labels:

- type: task
- area: workspace
- epic: SET
- priority: P0
- status: backlog

Milestone:

- M2 - Workspace bootstrapped

Body:

## Parent epic

SET

## Description

Mettre en place les runners de tests unitaires et d'intégration.

## Dépendances

- SET-01
- SET-02

## Critères d'acceptation

- [ ] tests unitaires exécutables
- [ ] tests d'intégration exécutables
- [ ] scripts npm/pnpm documentés
```

### SET-05

```md
Title: [TASK][SET-05] Configurer Playwright E2E et smoke pipeline

Labels:

- type: task
- area: workspace
- epic: SET
- priority: P0
- status: backlog

Milestone:

- M2 - Workspace bootstrapped

Body:

## Parent epic

SET

## Description

Mettre en place Playwright avec scenario smoke initial.

## Dépendances

- SET-01
- SET-04

## Critères d'acceptation

- [ ] Playwright configuré
- [ ] scénario smoke actif
- [ ] exécution CI possible
```

### SET-06

```md
Title: [TASK][SET-06] Configurer CI GitHub Actions multi-apps

Labels:

- type: task
- area: workspace
- epic: SET
- priority: P0
- status: backlog

Milestone:

- M2 - Workspace bootstrapped

Body:

## Parent epic

SET

## Description

Mettre en place la CI pour web, mobile, api et libs.

## Dépendances

- SET-03
- SET-04
- SET-05

## Critères d'acceptation

- [ ] workflow CI en place
- [ ] checks bloquants actifs
- [ ] exécution PR validée
```

### SET-07

```md
Title: [TASK][SET-07] Mettre en place variables d'environnement et runbook local dev

Labels:

- type: task
- area: workspace
- epic: SET
- priority: P1
- status: backlog

Milestone:

- M2 - Workspace bootstrapped

Body:

## Parent epic

SET

## Description

Documenter et standardiser les variables d'environnement locales.

## Dépendances

- SET-02

## Critères d'acceptation

- [ ] fichier exemple env créé
- [ ] runbook local mis à jour
- [ ] variables critiques listées
```

---

## Shared Libraries (`LIB`) - Milestone `M2 - Workspace bootstrapped`

### LIB-01

```md
Title: [TASK][LIB-01] Créer packages/contracts (DTO, schema validation, versioning)

Labels:

- type: task
- area: shared-libs
- epic: LIB
- priority: P0
- status: backlog

Milestone:

- M2 - Workspace bootstrapped

Body:

## Parent epic

LIB

## Description

Créer les contrats types et schémas de validation partagés.

## Dépendances

- ARC-04
- SET-02

## Critères d'acceptation

- [ ] contrats de base définis
- [ ] validation schéma active
- [ ] versioning des contrats documenté
```

### LIB-02

```md
Title: [TASK][LIB-02] Créer packages/domain (règles métier pures MVP)

Labels:

- type: task
- area: shared-libs
- epic: LIB
- priority: P0
- status: backlog

Milestone:

- M2 - Workspace bootstrapped

Body:

## Parent epic

LIB

## Description

Centraliser les règles métier pures sans dépendance framework.

## Dépendances

- ARC-04
- LIB-01

## Critères d'acceptation

- [ ] fonctions métier pures créées
- [ ] tests unitaires passés
- [ ] usage dans apps possible
```

### LIB-03

```md
Title: [TASK][LIB-03] Créer packages/api-client (typed client web/mobile vers API)

Labels:

- type: task
- area: shared-libs
- epic: LIB
- priority: P1
- status: backlog

Milestone:

- M2 - Workspace bootstrapped

Body:

## Parent epic

LIB

## Description

Créer un client API type pour web et mobile.

## Dépendances

- LIB-01
- SET-02

## Critères d'acceptation

- [ ] client API type disponible
- [ ] gestion erreurs standardisée
- [ ] exemple d'utilisation ajouté
```

### LIB-04

```md
Title: [TASK][LIB-04] Ajouter tests unitaires libs + guideline de publication interne

Labels:

- type: task
- area: shared-libs
- epic: LIB
- priority: P1
- status: backlog

Milestone:

- M2 - Workspace bootstrapped

Body:

## Parent epic

LIB

## Description

Renforcer la fiabilité des libs et documenter leur publication interne.

## Dépendances

- LIB-02
- LIB-03

## Critères d'acceptation

- [ ] tests unitaires libs complets
- [ ] guide publication documente
- [ ] process de version clair
```

---

## Website (`WEB`) - Milestone `M5 - Core participant flows ready`

### WEB-01

```md
Title: [TASK][WEB-01] Implémenter pages core (Accueil, À propos, Services, Programmes, Contact)

Labels:

- type: task
- area: website
- epic: WEB
- priority: P0
- status: backlog

Milestone:

- M5 - Core participant flows ready

Body:

## Parent epic

WEB

## Description

Implémenter les pages publiques coeur du site MVP.

## Dépendances

- SET-01
- ARC-03

## Critères d'acceptation

- [ ] 5 pages MVP disponibles
- [ ] responsive mobile-first
- [ ] contenu coherent avec ton KRAAK
```

### WEB-02

```md
Title: [TASK][WEB-02] Intégrer formulaires de contact et CTA conversion

Labels:

- type: task
- area: website
- epic: WEB
- priority: P0
- status: backlog

Milestone:

- M5 - Core participant flows ready

Body:

## Parent epic

WEB

## Description

Ajouter les formulaires et CTA pour la conversion utile.

## Dépendances

- WEB-01
- SUP-01

## Critères d'acceptation

- [ ] formulaire contact intégré
- [ ] CTA clairs et fonctionnels
- [ ] validation utilisateur visible
```

### WEB-03

```md
Title: [TASK][WEB-03] Ajouter SEO technique (meta, sitemap, robots, Open Graph)

Labels:

- type: task
- area: website
- epic: WEB
- priority: P0
- status: backlog

Milestone:

- M5 - Core participant flows ready

Body:

## Parent epic

WEB

## Description

Mettre en place les fondamentaux SEO techniques du site.

## Dépendances

- WEB-01

## Critères d'acceptation

- [ ] metadata par page
- [ ] sitemap et robots générés
- [ ] Open Graph configure
```

### WEB-04

```md
Title: [TASK][WEB-04] Ajouter analytics web (PostHog/GA)

Labels:

- type: task
- area: website
- epic: WEB
- priority: P1
- status: backlog

Milestone:

- M5 - Core participant flows ready

Body:

## Parent epic

WEB

## Description

Instrumenter le site pour mesurer les parcours et conversions.

## Dépendances

- WEB-01

## Critères d'acceptation

- [ ] events critiques traces
- [ ] pages vues tracées
- [ ] vérification data en env test
```

### WEB-05

```md
Title: [TASK][WEB-05] Optimiser accessibilité/performance (objectif Lighthouse > 90)

Labels:

- type: task
- area: website
- epic: WEB
- priority: P1
- status: backlog

Milestone:

- M5 - Core participant flows ready

Body:

## Parent epic

WEB

## Description

Améliorer accessibilité et performance des pages MVP.

## Dépendances

- WEB-01
- WEB-03

## Critères d'acceptation

- [ ] score perf cible atteint
- [ ] checks a11y de base valides
- [ ] regressions majeures corrigées
```

---

## Mobile Shell (`MOB`) - Milestone `M3 - Mobile shell ready`

### MOB-01

```md
Title: [TASK][MOB-01] Initialiser app Ionic Angular dans apps/client/projects/mobile

Labels:

- type: task
- area: mobile-shell
- epic: MOB
- priority: P0
- status: backlog

Milestone:

- M3 - Mobile shell ready

Body:

## Parent epic

MOB

## Description

Initialiser l'application mobile Ionic Angular dans le workspace.

## Dépendances

- SET-01

## Critères d'acceptation

- [ ] app mobile générée
- [ ] run local opérationnel
- [ ] structure de base validée
```

### MOB-02

```md
Title: [TASK][MOB-02] Mettre en place navigation shell (tabs/stack) et layout de base

Labels:

- type: task
- area: mobile-shell
- epic: MOB
- priority: P0
- status: backlog

Milestone:

- M3 - Mobile shell ready

Body:

## Parent epic

MOB

## Description

Implémenter la navigation principale et le layout shell.

## Dépendances

- MOB-01

## Critères d'acceptation

- [ ] navigation tabs/stack fonctionnelle
- [ ] layout coherent mobile
- [ ] routes shell stables
```

### MOB-03

```md
Title: [TASK][MOB-03] Intégrer theming, design tokens et composants UI de base

Labels:

- type: task
- area: mobile-shell
- epic: MOB
- priority: P1
- status: backlog

Milestone:

- M3 - Mobile shell ready

Body:

## Parent epic

MOB

## Description

Appliquer le theming et les composants UI minimaux de l'app.

## Dépendances

- MOB-01
- LIB-01

## Critères d'acceptation

- [ ] tokens appliques
- [ ] composants UI de base disponibles
- [ ] coherence visuelle assurée
```

### MOB-04

```md
Title: [TASK][MOB-04] Configurer Capacitor (Android/iOS) et builds debug

Labels:

- type: task
- area: mobile-shell
- epic: MOB
- priority: P0
- status: backlog

Milestone:

- M3 - Mobile shell ready

Body:

## Parent epic

MOB

## Description

Configurer Capacitor pour Android/iOS et valider les builds debug.

## Dépendances

- MOB-01

## Critères d'acceptation

- [ ] config Capacitor validée
- [ ] build Android debug OK
- [ ] build iOS debug OK
```

### MOB-05

```md
Title: [TASK][MOB-05] Ajouter service notifications push stub (FCM wiring initial)

Labels:

- type: task
- area: mobile-shell
- epic: MOB
- priority: P1
- status: backlog

Milestone:

- M3 - Mobile shell ready

Body:

## Parent epic

MOB

## Description

Ajouter la base technique pour notifications push (stub).

## Dépendances

- MOB-04
- SET-02

## Critères d'acceptation

- [ ] service push stub disponible
- [ ] token device récupéré (mock/stub)
- [ ] workflow documente
```

---

## Auth (`AUT`) - Milestone `M4 - Auth ready`

### AUT-01

```md
Title: [TASK][AUT-01] Configurer Supabase Auth (providers, policies de base)

Labels:

- type: task
- area: auth
- epic: AUT
- priority: P0
- status: backlog

Milestone:

- M4 - Auth ready

Body:

## Parent epic

AUT

## Description

Configurer l'authentification Supabase et policies minimales.

## Dépendances

- ARC-04
- SET-02

## Critères d'acceptation

- [ ] provider(s) auth configures
- [ ] policies de base appliquées
- [ ] tests auth initiaux valides
```

### AUT-02

```md
Title: [TASK][AUT-02] Implémenter endpoints API auth/session (NestJS)

Labels:

- type: task
- area: auth
- epic: AUT
- priority: P0
- status: backlog

Milestone:

- M4 - Auth ready

Body:

## Parent epic

AUT

## Description

Implémenter les endpoints auth/session côté API.

## Dépendances

- AUT-01
- LIB-01

## Critères d'acceptation

- [ ] endpoints auth exposes
- [ ] gestion session stable
- [ ] erreurs auth normalisées
```

### AUT-03

```md
Title: [TASK][AUT-03] Implémenter écrans login/signup/reset mobile

Labels:

- type: task
- area: auth
- epic: AUT
- priority: P0
- status: backlog

Milestone:

- M4 - Auth ready

Body:

## Parent epic

AUT

## Description

Construire les écrans d'authentification mobile.

## Dépendances

- MOB-02
- AUT-02

## Critères d'acceptation

- [ ] login mobile fonctionnel
- [ ] signup mobile fonctionnel
- [ ] reset mot de passe fonctionnel
```

### AUT-04

```md
Title: [TASK][AUT-04] Implémenter garde routes protégées web/mobile

Labels:

- type: task
- area: auth
- epic: AUT
- priority: P0
- status: backlog

Milestone:

- M4 - Auth ready

Body:

## Parent epic

AUT

## Description

Ajouter les gardes d'accès pour routes privées web/mobile.

## Dépendances

- AUT-02
- LIB-03

## Critères d'acceptation

- [ ] routes privées bloquées sans session
- [ ] redirection utilisateur correcte
- [ ] état auth synchro web/mobile
```

### AUT-05

```md
Title: [TASK][AUT-05] Ajouter gestion role participant/admin minimal

Labels:

- type: task
- area: auth
- epic: AUT
- priority: P1
- status: backlog

Milestone:

- M4 - Auth ready

Body:

## Parent epic

AUT

## Description

Implémenter la gestion minimale des rôles et autorisations.

## Dépendances

- AUT-02
- ARC-04

## Critères d'acceptation

- [ ] rôles minimaux définis
- [ ] vérification autorisation active
- [ ] cas limites documentes
```

---

## Dashboard (`DSH`) - Milestone `M5 - Core participant flows ready`

### DSH-01

```md
Title: [TASK][DSH-01] Définir contenu dashboard MVP (cartes, rappels, dernières actus)

Labels:

- type: task
- area: dashboard
- epic: DSH
- priority: P0
- status: backlog

Milestone:

- M5 - Core participant flows ready

Body:

## Parent epic

DSH

## Description

Définir la composition fonctionnelle du dashboard participant.

## Dépendances

- ARC-04

## Critères d'acceptation

- [ ] sections dashboard listées
- [ ] priorités contenu valides
- [ ] version MVP approuvée
```

### DSH-02

```md
Title: [TASK][DSH-02] Exposer endpoint dashboard aggregate côté API

Labels:

- type: task
- area: dashboard
- epic: DSH
- priority: P0
- status: backlog

Milestone:

- M5 - Core participant flows ready

Body:

## Parent epic

DSH

## Description

Exposer un endpoint agrégateur pour alimenter le dashboard.

## Dépendances

- SET-02
- LIB-01
- AUT-02

## Critères d'acceptation

- [ ] endpoint aggregate disponible
- [ ] contrat stable documenté
- [ ] performance acceptable en MVP
```

### DSH-03

```md
Title: [TASK][DSH-03] Implémenter vue dashboard mobile

Labels:

- type: task
- area: dashboard
- epic: DSH
- priority: P0
- status: backlog

Milestone:

- M5 - Core participant flows ready

Body:

## Parent epic

DSH

## Description

Implémenter l’écran dashboard dans l'application mobile.

## Dépendances

- MOB-02
- AUT-04
- DSH-02

## Critères d'acceptation

- [ ] dashboard mobile rendu
- [ ] données endpoint affichées
- [ ] états loading/error gérés
```

### DSH-04

```md
Title: [TASK][DSH-04] Implémenter vue dashboard web participant (si activée MVP)

Labels:

- type: task
- area: dashboard
- epic: DSH
- priority: P1
- status: backlog

Milestone:

- M5 - Core participant flows ready

Body:

## Parent epic

DSH

## Description

Ajouter une variante web participant du dashboard si confirmée.

## Dépendances

- WEB-01
- AUT-04
- DSH-02

## Critères d'acceptation

- [ ] décision scope web confirmée
- [ ] vue web implémentée si retenue
- [ ] parité fonctionnelle minimale assurée
```

---

## Programs (`PRG`) - Milestone `M5 - Core participant flows ready`

### PRG-01

```md
Title: [TASK][PRG-01] Définir modèle programme/cohorte/statut progression MVP

Labels:

- type: task
- area: programs
- epic: PRG
- priority: P0
- status: backlog

Milestone:

- M5 - Core participant flows ready

Body:

## Parent epic

PRG

## Description

Définir le modèle de données programme/cohorte/progression.

## Dépendances

- ARC-04

## Critères d'acceptation

- [ ] modèle métier valide
- [ ] états progression définis
- [ ] contraintes principales documentées
```

### PRG-02

```md
Title: [TASK][PRG-02] Implémenter endpoints liste/détail programmes

Labels:

- type: task
- area: programs
- epic: PRG
- priority: P0
- status: backlog

Milestone:

- M5 - Core participant flows ready

Body:

## Parent epic

PRG

## Description

Implémenter les endpoints API de consultation programmes.

## Dépendances

- SET-02
- LIB-01
- AUT-02
- PRG-01

## Critères d'acceptation

- [ ] endpoint liste disponible
- [ ] endpoint détail disponible
- [ ] filtrage minimal supporte
```

### PRG-03

```md
Title: [TASK][PRG-03] Implémenter écran mobile liste + détail programme

Labels:

- type: task
- area: programs
- epic: PRG
- priority: P0
- status: backlog

Milestone:

- M5 - Core participant flows ready

Body:

## Parent epic

PRG

## Description

Implémenter les écrans mobiles liste et détail programme.

## Dépendances

- MOB-02
- PRG-02

## Critères d'acceptation

- [ ] liste programmes visible
- [ ] détail programme accessible
- [ ] navigation liste->détail stable
```

### PRG-04

```md
Title: [TASK][PRG-04] Implémenter marquage de progression minimale

Labels:

- type: task
- area: programs
- epic: PRG
- priority: P1
- status: backlog

Milestone:

- M5 - Core participant flows ready

Body:

## Parent epic

PRG

## Description

Permettre un suivi minimal de progression programme.

## Dépendances

- PRG-02
- LIB-02

## Critères d'acceptation

- [ ] marquage progression enregistre
- [ ] restitution état progression
- [ ] règles metier appliquées
```

### PRG-05

```md
Title: [TASK][PRG-05] Ajouter scenarii de test Given/When/Then programmes

Labels:

- type: task
- area: programs
- epic: PRG
- priority: P1
- status: backlog

Milestone:

- M5 - Core participant flows ready

Body:

## Parent epic

PRG

## Description

Ajouter la couverture comportementale BDD des parcours programmes.

## Dépendances

- PRG-03
- PRG-04
- QAT-01

## Critères d'acceptation

- [ ] scenarios Given/When/Then rédigés
- [ ] exécution E2E possible
- [ ] assertions comportement explicites
```

---

## Resources (`RES`) - Milestone `M5 - Core participant flows ready`

### RES-01

```md
Title: [TASK][RES-01] Définir taxonomie ressources (type, theme, audience)

Labels:

- type: task
- area: resources
- epic: RES
- priority: P0
- status: backlog

Milestone:

- M5 - Core participant flows ready

Body:

## Parent epic

RES

## Description

Définir la taxonomie fonctionnelle des ressources.

## Dépendances

- ARC-04

## Critères d'acceptation

- [ ] types de ressources définis
- [ ] themes définis
- [ ] cibles audience définies
```

### RES-02

```md
Title: [TASK][RES-02] Implémenter endpoints ressources (liste, filtre, détail)

Labels:

- type: task
- area: resources
- epic: RES
- priority: P0
- status: backlog

Milestone:

- M5 - Core participant flows ready

Body:

## Parent epic

RES

## Description

Implémenter les endpoints API pour ressources et filtres.

## Dépendances

- SET-02
- LIB-01
- AUT-02
- RES-01

## Critères d'acceptation

- [ ] endpoint liste opérationnel
- [ ] endpoint détail opérationnel
- [ ] filtres MVP disponibles
```

### RES-03

```md
Title: [TASK][RES-03] Implémenter écran mobile ressources (recherche/filtre)

Labels:

- type: task
- area: resources
- epic: RES
- priority: P0
- status: backlog

Milestone:

- M5 - Core participant flows ready

Body:

## Parent epic

RES

## Description

Implémenter l’écran mobile de consultation des ressources.

## Dépendances

- MOB-02
- RES-02

## Critères d'acceptation

- [ ] recherche fonctionnelle
- [ ] filtres fonctionnels
- [ ] détail ressource accessible
```

### RES-04

```md
Title: [TASK][RES-04] Implémenter tracking consultation ressources

Labels:

- type: task
- area: resources
- epic: RES
- priority: P1
- status: backlog

Milestone:

- M5 - Core participant flows ready

Body:

## Parent epic

RES

## Description

Tracer les consultations de ressources pour suivi produit.

## Dépendances

- RES-02
- WEB-04

## Critères d'acceptation

- [ ] events consultation traces
- [ ] métadonnées minimales capturées
- [ ] vérification des traces en test
```

---

## Announcements (`ANN`) - Milestone `M5 - Core participant flows ready`

### ANN-01

```md
Title: [TASK][ANN-01] Définir format annonce et règles de publication MVP

Labels:

- type: task
- area: announcements
- epic: ANN
- priority: P0
- status: backlog

Milestone:

- M5 - Core participant flows ready

Body:

## Parent epic

ANN

## Description

Définir la structure annonce et ses règles de publication.

## Dépendances

- ARC-04

## Critères d'acceptation

- [ ] format annonce valide
- [ ] règles publication MVP définies
- [ ] priorité annonce documentée
```

### ANN-02

```md
Title: [TASK][ANN-02] Implémenter endpoints annonces (feed + détail)

Labels:

- type: task
- area: announcements
- epic: ANN
- priority: P0
- status: backlog

Milestone:

- M5 - Core participant flows ready

Body:

## Parent epic

ANN

## Description

Implémenter les endpoints API de feed et détail annonces.

## Dépendances

- SET-02
- LIB-01
- AUT-02
- ANN-01

## Critères d'acceptation

- [ ] endpoint feed disponible
- [ ] endpoint détail disponible
- [ ] tri/ordre MVP valide
```

### ANN-03

```md
Title: [TASK][ANN-03] Implémenter flux annonces dans mobile dashboard/feed

Labels:

- type: task
- area: announcements
- epic: ANN
- priority: P0
- status: backlog

Milestone:

- M5 - Core participant flows ready

Body:

## Parent epic

ANN

## Description

Afficher les annonces dans l'application mobile.

## Dépendances

- MOB-02
- DSH-02
- ANN-02

## Critères d'acceptation

- [ ] feed annonce visible
- [ ] détail annonce accessible
- [ ] integration dashboard validée
```

### ANN-04

```md
Title: [TASK][ANN-04] Ajouter notification push pour annonce prioritaire

Labels:

- type: task
- area: announcements
- epic: ANN
- priority: P1
- status: backlog

Milestone:

- M5 - Core participant flows ready

Body:

## Parent epic

ANN

## Description

Déclencher une notification push pour annonces prioritaires.

## Dépendances

- MOB-05
- ANN-02

## Critères d'acceptation

- [ ] règle priorité push définie
- [ ] push annonce prioritaire testable
- [ ] fallback en cas d'échec documenté
```

---

## Support (`SUP`) - Milestone `M5 - Core participant flows ready`

### SUP-01

```md
Title: [TASK][SUP-01] Implémenter endpoint contact/support (API + validation)

Labels:

- type: task
- area: support
- epic: SUP
- priority: P0
- status: backlog

Milestone:

- M5 - Core participant flows ready

Body:

## Parent epic

SUP

## Description

Exposer un endpoint contact/support avec validation robuste.

## Dépendances

- SET-02
- LIB-01

## Critères d'acceptation

- [ ] endpoint support disponible
- [ ] validation payload active
- [ ] erreurs utilisateur explicites
```

### SUP-02

```md
Title: [TASK][SUP-02] Intégrer formulaire support dans mobile

Labels:

- type: task
- area: support
- epic: SUP
- priority: P0
- status: backlog

Milestone:

- M5 - Core participant flows ready

Body:

## Parent epic

SUP

## Description

Ajouter le formulaire support dans l'application mobile.

## Dépendances

- MOB-02
- SUP-01
- AUT-04

## Critères d'acceptation

- [ ] formulaire mobile envoyé
- [ ] messages validation affiches
- [ ] confirmation envoi visible
```

### SUP-03

```md
Title: [TASK][SUP-03] Intégrer formulaire contact site web

Labels:

- type: task
- area: support
- epic: SUP
- priority: P0
- status: backlog

Milestone:

- M5 - Core participant flows ready

Body:

## Parent epic

SUP

## Description

Ajouter le formulaire de contact sur le site web.

## Dépendances

- WEB-01
- SUP-01

## Critères d'acceptation

- [ ] formulaire web envoie les demandes
- [ ] validations front/back cohérentes
- [ ] confirmation utilisateur claire
```

### SUP-04

```md
Title: [TASK][SUP-04] Configurer envoi email transactionnel (Resend ou equivalent)

Labels:

- type: task
- area: support
- epic: SUP
- priority: P1
- status: backlog

Milestone:

- M5 - Core participant flows ready

Body:

## Parent epic

SUP

## Description

Configurer l'envoi email pour confirmations/support.

## Dépendances

- SUP-01

## Critères d'acceptation

- [ ] provider email configure
- [ ] email de confirmation envoyé
- [ ] erreurs d'envoi gérées
```

### SUP-05

```md
Title: [TASK][SUP-05] Ajouter suivi et statut basique des demandes support

Labels:

- type: task
- area: support
- epic: SUP
- priority: P1
- status: backlog

Milestone:

- M5 - Core participant flows ready

Body:

## Parent epic

SUP

## Description

Mettre en place un suivi minimal des demandes support.

## Dépendances

- SUP-01
- AUT-05

## Critères d'acceptation

- [ ] statut demande stocke
- [ ] transitions minimales définies
- [ ] consultation statut possible
```

---

## QA (`QAT`) - Milestone `M6 - QA ready`

### QAT-01

```md
Title: [TASK][QAT-01] Définir matrice de couverture (page, composant, comportement)

Labels:

- type: task
- area: qa
- epic: QAT
- priority: P0
- status: backlog

Milestone:

- M6 - QA ready

Body:

## Parent epic

QAT

## Description

Définir la matrice de couverture tests MVP.

## Dépendances

- SET-04
- SET-05

## Critères d'acceptation

- [ ] matrice page/composant/comportement créée
- [ ] couverture minimale cible définie
- [ ] scenarios critiques identifiés
```

### QAT-02

```md
Title: [TASK][QAT-02] Écrire tests unitaires composants critiques web/mobile

Labels:

- type: task
- area: qa
- epic: QAT
- priority: P0
- status: backlog

Milestone:

- M6 - QA ready

Body:

## Parent epic

QAT

## Description

Ajouter les tests unitaires des composants critiques.

## Dépendances

- QAT-01
- WEB-01
- MOB-02

## Critères d'acceptation

- [ ] composants critiques couverts
- [ ] assertions explicites
- [ ] tests stables en CI
```

### QAT-03

```md
Title: [TASK][QAT-03] Écrire tests integration API modules critiques

Labels:

- type: task
- area: qa
- epic: QAT
- priority: P0
- status: backlog

Milestone:

- M6 - QA ready

Body:

## Parent epic

QAT

## Description

Écrire les tests integration pour modules API critiques.

## Dépendances

- QAT-01
- AUT-02
- PRG-02
- RES-02
- ANN-02
- SUP-01

## Critères d'acceptation

- [ ] endpoints critiques couverts
- [ ] cas erreur couverts
- [ ] résultats reproductibles
```

### QAT-04

```md
Title: [TASK][QAT-04] Écrire E2E Given/When/Then pour parcours coeur participant

Labels:

- type: task
- area: qa
- epic: QAT
- priority: P0
- status: backlog

Milestone:

- M6 - QA ready

Body:

## Parent epic

QAT

## Description

Ajouter les scenarios E2E comportementaux des parcours coeur.

## Dépendances

- QAT-01
- AUT-03
- DSH-03
- PRG-03
- RES-03
- SUP-02

## Critères d'acceptation

- [ ] scenarios Given/When/Then implémentés
- [ ] parcours critiques exécutés
- [ ] preuves d'exécution disponibles
```

### QAT-05

```md
Title: [TASK][QAT-05] Réaliser campagne régression et corriger bloqueurs

Labels:

- type: task
- area: qa
- epic: QAT
- priority: P0
- status: backlog

Milestone:

- M6 - QA ready

Body:

## Parent epic

QAT

## Description

Exécuter régression complète et corriger les bloqueurs.

## Dépendances

- QAT-02
- QAT-03
- QAT-04

## Critères d'acceptation

- [ ] campagne régression terminée
- [ ] blockers P0 résolus
- [ ] rapport de stabilisation publié
```

### QAT-06

```md
Title: [TASK][QAT-06] Réaliser checks accessibilité/performance pré-pilot

Labels:

- type: task
- area: qa
- epic: QAT
- priority: P1
- status: backlog

Milestone:

- M6 - QA ready

Body:

## Parent epic

QAT

## Description

Valider a11y/performance avant passage au pilote.

## Dépendances

- QAT-05
- WEB-05

## Critères d'acceptation

- [ ] checks a11y exécutés
- [ ] checks performance exécutés
- [ ] plan d'actions écarts fourni
```

---

## Deployment (`DEP`) - Milestone `M7 - Pilot release ready`

### DEP-01

```md
Title: [TASK][DEP-01] Configurer environnements (dev/staging/pilot)

Labels:

- type: task
- area: deployment
- epic: DEP
- priority: P0
- status: backlog

Milestone:

- M7 - Pilot release ready

Body:

## Parent epic

DEP

## Description

Configurer et documenter les environnements de déploiement.

## Dépendances

- SET-07

## Critères d'acceptation

- [ ] env dev/staging/pilot définis
- [ ] secrets et variables recensés
- [ ] accès et rôles clarifiés
```

### DEP-02

```md
Title: [TASK][DEP-02] Mettre en place pipeline déploiement web

Labels:

- type: task
- area: deployment
- epic: DEP
- priority: P0
- status: backlog

Milestone:

- M7 - Pilot release ready

Body:

## Parent epic

DEP

## Description

Automatiser le déploiement web vers l'environnement cible.

## Dépendances

- SET-06
- WEB-05

## Critères d'acceptation

- [ ] pipeline web opérationnel
- [ ] déploiement staging valide
- [ ] rollback web documente
```

### DEP-03

```md
Title: [TASK][DEP-03] Mettre en place pipeline déploiement API

Labels:

- type: task
- area: deployment
- epic: DEP
- priority: P0
- status: backlog

Milestone:

- M7 - Pilot release ready

Body:

## Parent epic

DEP

## Description

Automatiser le déploiement API vers l'environnement cible.

## Dépendances

- SET-06
- QAT-03

## Critères d'acceptation

- [ ] pipeline API opérationnel
- [ ] déploiement staging valide
- [ ] checks post-deploy disponibles
```

### DEP-04

```md
Title: [TASK][DEP-04] Preparer distribution mobile test (APK/TestFlight interne)

Labels:

- type: task
- area: deployment
- epic: DEP
- priority: P0
- status: backlog

Milestone:

- M7 - Pilot release ready

Body:

## Parent epic

DEP

## Description

Preparer les builds mobiles de test pour le pilote.

## Dépendances

- MOB-04
- QAT-04

## Critères d'acceptation

- [ ] build APK test disponible
- [ ] build iOS test disponible
- [ ] procedure distribution test documentée
```

### DEP-05

```md
Title: [TASK][DEP-05] Finaliser observabilité et alerting minimum

Labels:

- type: task
- area: deployment
- epic: DEP
- priority: P1
- status: backlog

Milestone:

- M7 - Pilot release ready

Body:

## Parent epic

DEP

## Description

Mettre en place la supervision minimale avant pilote.

## Dépendances

- DEP-02
- DEP-03

## Critères d'acceptation

- [ ] logs et métriques accessibles
- [ ] alertes minimales configurées
- [ ] procédure vérification en place
```

### DEP-06

```md
Title: [TASK][DEP-06] Rédiger runbook incident + rollback + pilot checklist

Labels:

- type: task
- area: deployment
- epic: DEP
- priority: P0
- status: backlog

Milestone:

- M7 - Pilot release ready

Body:

## Parent epic

DEP

## Description

Documenter incidents, rollback et checklist go/no-go pilote.

## Dépendances

- DEP-01
- DEP-05
- QAT-06

## Critères d'acceptation

- [ ] runbook incident rédigé
- [ ] procedure rollback rédigée
- [ ] checklist pilote prête
```

### DEP-07

```md
Title: [TASK][DEP-07] Executer go/no-go pilote et publier release pilote

Labels:

- type: task
- area: deployment
- epic: DEP
- priority: P0
- status: backlog

Milestone:

- M7 - Pilot release ready

Body:

## Parent epic

DEP

## Description

Executer le go/no-go final et publier la release pilote.

## Dépendances

- DEP-02
- DEP-03
- DEP-04
- DEP-06

## Critères d'acceptation

- [ ] go/no-go documente
- [ ] release pilote publiée
- [ ] retour post-release capture
```
