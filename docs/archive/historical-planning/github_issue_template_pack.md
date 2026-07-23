> **Status:** Historical.
> This document does not define the current process.
> Active reference: [ISSUE_TEMPLATE](../../../.github/ISSUE_TEMPLATE/)

# Pack Templates Issues GitHub - Epics MVP KRAAK

Usage rapide :

1. Créer une nouvelle issue GitHub.
2. Copier-coller un bloc complet ci-dessous.
3. Ajuster l'owner, les dates et les critères si nécessaire.
4. Ajouter labels et milestone indiques dans le bloc.
5. Renseigner `Status` et `Priority` dans le GitHub Project, pas en labels.

---

## Bloc 1 - Epic Architecture

```md
Title: [EPIC][ARC] Architecture MVP verrouillée

Labels:

- type: epic
- area: architecture

Milestone:

- M1 - Architecture locked

Body:

## Contexte

Verrouiller les choix d'architecture web/mobile/api et les conventions de base
pour éviter le scope creep et accélérer l'exécution MVP.

## Objectif

Clore toutes les issues ARC-\* pour atteindre le milestone M1.

## Sous-taches (issues enfants)

- [ ] ARC-01 - Valider architecture cible web/mobile/api avec scope MVP (P0) - deps: none
- [ ] ARC-02 - Définir conventions repo (naming, structure, quality gates) (P0) - deps: ARC-01
- [ ] ARC-03 - Définir stratégie de rendu web (SEO/prerender) (P0) - deps: ARC-01
- [ ] ARC-04 - Définir modèles de données MVP (P0) - deps: ARC-01
- [ ] ARC-05 - Documenter ADRs et critères anti-scope-creep (P1) - deps: ARC-02, ARC-04

## Dépendances amont

- none

## Critères d'acceptation

- [ ] Toutes les sous-taches ARC-\* sont en done
- [ ] Les decisions sont documentées et partagées
- [ ] Le scope MVP est explicite et stable

## Definition of done de l'epic

Milestone M1 atteint.
```

---

## Bloc 2 - Epic Workspace setup

```md
Title: [EPIC][SET] Workspace bootstrapped et quality gates actifs

Labels:

- type: epic
- area: workspace

Milestone:

- M2 - Workspace bootstrapped

Body:

## Contexte

Mettre en place un workspace buildable, testable et automatisable pour web,
mobile et api.

## Objectif

Clore toutes les issues SET-\* pour atteindre le milestone M2.

## Sous-taches (issues enfants)

- [ ] SET-01 - Initialiser workspace Angular monorepo (apps/client/projects/web, apps/client/projects/mobile) (P0) - deps: ARC-02
- [ ] SET-02 - Initialiser apps/api NestJS et wiring de base (P0) - deps: ARC-02
- [ ] SET-03 - Configurer quality gates (lint, format, typecheck) (P0) - deps: SET-01, SET-02
- [ ] SET-04 - Configurer test runners unitaires + integration (P0) - deps: SET-01, SET-02
- [ ] SET-05 - Configurer Playwright E2E et smoke pipeline (P0) - deps: SET-01, SET-04
- [ ] SET-06 - Configurer CI GitHub Actions multi-apps (P0) - deps: SET-03, SET-04, SET-05
- [ ] SET-07 - Mettre en place variables d'environnement et runbook local dev (P1) - deps: SET-02

## Dépendances amont

- ARC

## Critères d'acceptation

- [ ] Build, lint, tests executables localement
- [ ] Pipeline CI verte
- [ ] Setup documente

## Definition of done de l'epic

Milestone M2 atteint.
```

---

## Bloc 3 - Epic Shared libraries

```md
Title: [EPIC][LIB] Shared libraries contracts/domain/api-client

Labels:

- type: epic
- area: shared-libs

Milestone:

- M2 - Workspace bootstrapped

Body:

## Contexte

Structurer la réutilisation transverse avec des libs minimales et explicites.

## Objectif

Fournir des contrats, règles metier pures et client API type.

## Sous-taches (issues enfants)

- [ ] LIB-01 - Créer packages/contracts (DTO, schema validation, versioning) (P0) - deps: ARC-04, SET-02
- [ ] LIB-02 - Créer packages/domain (règles metier pures MVP) (P0) - deps: ARC-04, LIB-01
- [ ] LIB-03 - Créer packages/api-client (typed client web/mobile vers API) (P1) - deps: LIB-01, SET-02
- [ ] LIB-04 - Ajouter tests unitaires libs + guideline de publication interne (P1) - deps: LIB-02, LIB-03

## Dépendances amont

- ARC
- SET

## Critères d'acceptation

- [ ] Contrats centralises et versionnables
- [ ] Domaine sans dépendance framework
- [ ] Client API type consomme dans apps

## Definition of done de l'epic

LIB-01 et LIB-02 requis pour M2; LIB-03 et LIB-04 planifies/clos selon capacité.
```

---

## Bloc 4 - Epic Website

```md
Title: [EPIC][WEB] Website MVP conversion-ready

Labels:

- type: epic
- area: website

Milestone:

- M5 - Core participant flows ready

Body:

## Contexte

Livrer un site vitrine credible, performant et oriente conversion.

## Objectif

Clore les chantiers pages, formulaires, SEO et optimisation web.

## Sous-taches (issues enfants)

- [ ] WEB-01 - Implémenter pages core (Accueil, À propos, Services, Programmes, Contact) (P0) - deps: SET-01, ARC-03
- [ ] WEB-02 - Intégrer formulaires de contact et CTA conversion (P0) - deps: WEB-01, SUP-01
- [ ] WEB-03 - Ajouter SEO technique (meta, sitemap, robots, Open Graph) (P0) - deps: WEB-01
- [ ] WEB-04 - Ajouter analytics web (PostHog/GA) (P1) - deps: WEB-01
- [ ] WEB-05 - Optimiser accessibilité/performance (objectif Lighthouse > 90) (P1) - deps: WEB-01, WEB-03

## Dépendances amont

- SET
- SUP (pour intégration formulaire API)

## Critères d'acceptation

- [ ] Pages MVP disponibles et cohérentes
- [ ] Parcours contact fonctionnel
- [ ] SEO technique et analytics en place

## Definition of done de l'epic

Contributions WEB requises pour M5 et M6 valides.
```

---

## Bloc 5 - Epic Mobile shell

```md
Title: [EPIC][MOB] Mobile shell Ionic/Capacitor pret

Labels:

- type: epic
- area: mobile-shell

Milestone:

- M3 - Mobile shell ready

Body:

## Contexte

Mettre en place une ossature mobile solide pour brancher les modules metier.

## Objectif

Clore toutes les issues MOB-\* pour atteindre M3.

## Sous-taches (issues enfants)

- [ ] MOB-01 - Initialiser app Ionic Angular dans apps/client/projects/mobile (P0) - deps: SET-01
- [ ] MOB-02 - Mettre en place navigation shell (tabs/stack) et layout de base (P0) - deps: MOB-01
- [ ] MOB-03 - Intégrer theming, design tokens et composants UI de base (P1) - deps: MOB-01, LIB-01
- [ ] MOB-04 - Configurer Capacitor (Android/iOS) et builds debug (P0) - deps: MOB-01
- [ ] MOB-05 - Ajouter service notifications push stub (FCM wiring initial) (P1) - deps: MOB-04, SET-02

## Dépendances amont

- SET
- LIB

## Critères d'acceptation

- [ ] Shell navigable sur mobile
- [ ] Build debug Android/iOS execute
- [ ] Base notifications initialisée

## Definition of done de l'epic

Milestone M3 atteint.
```

---

## Bloc 6 - Epic Auth

```md
Title: [EPIC][AUT] Auth web/mobile/api stable

Labels:

- type: epic
- area: auth

Milestone:

- M4 - Auth ready

Body:

## Contexte

Mettre en place une authentification sécurisée pour les parcours participants.

## Objectif

Clore toutes les issues AUT-\* pour atteindre M4.

## Sous-taches (issues enfants)

- [ ] AUT-01 - Configurer Supabase Auth (providers, policies de base) (P0) - deps: ARC-04, SET-02
- [ ] AUT-02 - Implémenter endpoints API auth/session (NestJS) (P0) - deps: AUT-01, LIB-01
- [ ] AUT-03 - Implémenter écrans login/signup/reset mobile (P0) - deps: MOB-02, AUT-02
- [ ] AUT-04 - Implémenter garde routes protégées web/mobile (P0) - deps: AUT-02, LIB-03
- [ ] AUT-05 - Ajouter gestion role participant/admin minimal (P1) - deps: AUT-02, ARC-04

## Dépendances amont

- SET
- LIB
- MOB

## Critères d'acceptation

- [ ] Login/signup/reset opérationnels
- [ ] Sessions et routes protégées valides
- [ ] Roles minimaux appliques

## Definition of done de l'epic

Milestone M4 atteint.
```

---

## Bloc 7 - Epic Dashboard

```md
Title: [EPIC][DSH] Dashboard participant MVP

Labels:

- type: epic
- area: dashboard

Milestone:

- M5 - Core participant flows ready

Body:

## Contexte

Proposer une vue d'accueil participant utile et actionnable.

## Objectif

Implémenter le contenu dashboard, l'aggregation API et les vues clientes.

## Sous-taches (issues enfants)

- [ ] DSH-01 - Définir contenu dashboard MVP (cartes, rappels, dernières actus) (P0) - deps: ARC-04
- [ ] DSH-02 - Exposer endpoint dashboard aggregate cote API (P0) - deps: SET-02, LIB-01, AUT-02
- [ ] DSH-03 - Implémenter vue dashboard mobile (P0) - deps: MOB-02, AUT-04, DSH-02
- [ ] DSH-04 - Implémenter vue dashboard web participant (si activée MVP) (P1) - deps: WEB-01, AUT-04, DSH-02

## Dépendances amont

- AUT
- MOB
- LIB

## Critères d'acceptation

- [ ] Dashboard mobile utilisable
- [ ] Données agrégées fiables
- [ ] Variante web confirmée selon scope

## Definition of done de l'epic

Contribution DSH complétée pour M5.
```

---

## Bloc 8 - Epic Programs

```md
Title: [EPIC][PRG] Parcours Programmes MVP

Labels:

- type: epic
- area: programs

Milestone:

- M5 - Core participant flows ready

Body:

## Contexte

Permettre la consultation et le suivi minimum des programmes participants.

## Objectif

Implémenter modèles, endpoints, vues mobiles et tests de comportement.

## Sous-taches (issues enfants)

- [ ] PRG-01 - Définir modèle programme/cohorte/statut progression MVP (P0) - deps: ARC-04
- [ ] PRG-02 - Implémenter endpoints liste/détail programmes (P0) - deps: SET-02, LIB-01, AUT-02, PRG-01
- [ ] PRG-03 - Implémenter écran mobile liste + détail programme (P0) - deps: MOB-02, PRG-02
- [ ] PRG-04 - Implémenter marquage de progression minimale (P1) - deps: PRG-02, LIB-02
- [ ] PRG-05 - Ajouter scenarii de test Given/When/Then programmes (P1) - deps: PRG-03, PRG-04, QAT-01

## Dépendances amont

- AUT
- MOB
- LIB

## Critères d'acceptation

- [ ] Liste et détail programmes accessibles
- [ ] Progression minimale sauvegardée
- [ ] Scenarios BDD associes

## Definition of done de l'epic

Contribution PRG complétée pour M5.
```

---

## Bloc 9 - Epic Resources

```md
Title: [EPIC][RES] Catalogue Ressources MVP

Labels:

- type: epic
- area: resources

Milestone:

- M5 - Core participant flows ready

Body:

## Contexte

Mettre a disposition des ressources consultables et filtrables par les
participants.

## Objectif

Implémenter taxonomie, endpoints, experience mobile et tracking.

## Sous-taches (issues enfants)

- [ ] RES-01 - Définir taxonomie ressources (type, theme, audience) (P0) - deps: ARC-04
- [ ] RES-02 - Implémenter endpoints ressources (liste, filtre, détail) (P0) - deps: SET-02, LIB-01, AUT-02, RES-01
- [ ] RES-03 - Implémenter écran mobile ressources (recherche/filtre) (P0) - deps: MOB-02, RES-02
- [ ] RES-04 - Implémenter tracking consultation ressources (P1) - deps: RES-02, WEB-04

## Dépendances amont

- AUT
- MOB
- LIB

## Critères d'acceptation

- [ ] Consultation/filtrage ressources opérationnels
- [ ] Détail ressource disponible
- [ ] Tracking de consultation enregistre

## Definition of done de l'epic

Contribution RES complétée pour M5.
```

---

## Bloc 10 - Epic Announcements

```md
Title: [EPIC][ANN] Flux Annonces MVP

Labels:

- type: epic
- area: announcements

Milestone:

- M5 - Core participant flows ready

Body:

## Contexte

Diffuser des annonces utiles et prioritaires vers les participants.

## Objectif

Implémenter le format annonce, le feed API, l'affichage mobile et les push.

## Sous-taches (issues enfants)

- [ ] ANN-01 - Définir format annonce et règles de publication MVP (P0) - deps: ARC-04
- [ ] ANN-02 - Implémenter endpoints annonces (feed + détail) (P0) - deps: SET-02, LIB-01, AUT-02, ANN-01
- [ ] ANN-03 - Implémenter flux annonces dans mobile dashboard/feed (P0) - deps: MOB-02, DSH-02, ANN-02
- [ ] ANN-04 - Ajouter notification push pour annonce prioritaire (P1) - deps: MOB-05, ANN-02

## Dépendances amont

- AUT
- MOB
- DSH

## Critères d'acceptation

- [ ] Feed annonces visible dans l'app
- [ ] Détail annonce accessible
- [ ] Push prioritaire déclenchable

## Definition of done de l'epic

Contribution ANN complétée pour M5.
```

---

## Bloc 11 - Epic Support

```md
Title: [EPIC][SUP] Canal Support MVP

Labels:

- type: epic
- area: support

Milestone:

- M5 - Core participant flows ready

Body:

## Contexte

Fournir un canal de contact/support simple, fiable et traçable.

## Objectif

Mettre en place endpoint support, formulaires web/mobile et notifications email.

## Sous-taches (issues enfants)

- [ ] SUP-01 - Implémenter endpoint contact/support (API + validation) (P0) - deps: SET-02, LIB-01
- [ ] SUP-02 - Intégrer formulaire support dans mobile (P0) - deps: MOB-02, SUP-01, AUT-04
- [ ] SUP-03 - Intégrer formulaire contact site web (P0) - deps: WEB-01, SUP-01
- [ ] SUP-04 - Configurer envoi email transactionnel (Resend ou equivalent) (P1) - deps: SUP-01
- [ ] SUP-05 - Ajouter suivi et statut basique des demandes support (P1) - deps: SUP-01, AUT-05

## Dépendances amont

- SET
- LIB
- AUT

## Critères d'acceptation

- [ ] Formulaires web et mobile opérationnels
- [ ] Envoi/trace des demandes support
- [ ] Statut basique de suivi disponible

## Definition of done de l'epic

Contribution SUP complétée pour M5.
```

---

## Bloc 12 - Epic QA

```md
Title: [EPIC][QAT] Qualification MVP et stabilisation

Labels:

- type: epic
- area: qa

Milestone:

- M6 - QA ready

Body:

## Contexte

Valider la qualité fonctionnelle et non-fonctionnelle avant pilot release.

## Objectif

Clore toutes les issues QAT-\* pour atteindre M6.

## Sous-taches (issues enfants)

- [ ] QAT-01 - Définir matrice de couverture (page, composant, comportement) (P0) - deps: SET-04, SET-05
- [ ] QAT-02 - Écrire tests unitaires composants critiques web/mobile (P0) - deps: QAT-01, WEB-01, MOB-02
- [ ] QAT-03 - Écrire tests integration API modules critiques (P0) - deps: QAT-01, AUT-02, PRG-02, RES-02, ANN-02, SUP-01
- [ ] QAT-04 - Écrire E2E Given/When/Then pour parcours coeur participant (P0) - deps: QAT-01, AUT-03, DSH-03, PRG-03, RES-03, SUP-02
- [ ] QAT-05 - Realiser campagne regression et corriger blockers (P0) - deps: QAT-02, QAT-03, QAT-04
- [ ] QAT-06 - Realiser checks accessibilité/performance pre-pilot (P1) - deps: QAT-05, WEB-05

## Dépendances amont

- WEB
- AUT
- DSH
- PRG
- RES
- ANN
- SUP

## Critères d'acceptation

- [ ] Couverture cible atteinte
- [ ] Parcours critiques validates
- [ ] Blockers critiques résolus

## Definition of done de l'epic

Milestone M6 atteint.
```

---

## Bloc 13 - Epic Deployment

```md
Title: [EPIC][DEP] Pilot release ready

Labels:

- type: epic
- area: deployment

Milestone:

- M7 - Pilot release ready

Body:

## Contexte

Preparer les environnements, pipelines, runbooks et la publication pilote.

## Objectif

Clore toutes les issues DEP-\* pour atteindre M7.

## Sous-taches (issues enfants)

- [ ] DEP-01 - Configurer environnements (dev/staging/pilot) (P0) - deps: SET-07
- [ ] DEP-02 - Mettre en place pipeline déploiement web (P0) - deps: SET-06, WEB-05
- [ ] DEP-03 - Mettre en place pipeline déploiement API (P0) - deps: SET-06, QAT-03
- [ ] DEP-04 - Preparer distribution mobile test (APK/TestFlight interne) (P0) - deps: MOB-04, QAT-04
- [ ] DEP-05 - Finaliser observabilité et alerting minimum (P1) - deps: DEP-02, DEP-03
- [ ] DEP-06 - Rédiger runbook incident + rollback + pilot checklist (P0) - deps: DEP-01, DEP-05, QAT-06
- [ ] DEP-07 - Executer go/no-go pilote et publier release pilote (P0) - deps: DEP-02, DEP-03, DEP-04, DEP-06

## Dépendances amont

- QAT
- WEB
- MOB
- SET

## Critères d'acceptation

- [ ] Environnements et pipelines opérationnels
- [ ] Runbooks et rollback valides
- [ ] Release pilote publiée apres go/no-go

## Definition of done de l'epic

Milestone M7 atteint.
```
