---
status: active
owner: platform
last_reviewed: 2026-07-23
source_of_truth: true
---

# MVP Mobile

## Table des matières

- [MVP Mobile](#mvp-mobile)
  - [1. Objectif métier principal](#1-objectif-metier-principal)
  - [2. Audience mobile principale](#2-audience-mobile-principale)
  - [3. Actions utilisateurs prioritaires (flux coeur)](#3-actions-utilisateurs-prioritaires-flux-coeur)
  - [4. Critères de succès (préparation pilote)](#4-criteres-de-succes-preparation-pilote)
  - [5. Limites de périmètre MVP](#5-limites-de-perimetre-mvp)
  - [6. Porte de décision produit (fin de phase 1)](#6-porte-de-decision-produit-fin-de-phase-1)
  - [7. Phase 2 - Decoupage priorise des fonctionnalités (Indispensable/Souhaite/Plus tard)](#7-phase-2-decoupage-priorise-des-fonctionnalites-indispensablesouhaiteplus-tard)
    - [7.1 Indispensable (critique pilote)](#71-indispensable-critique-pilote)
    - [7.2 Souhaite (forte valeur, non bloquant lancement)](#72-souhaite-forte-valeur-non-bloquant-lancement)
    - [7.3 Plus tard (candidats post-pilote)](#73-plus-tard-candidats-post-pilote)
  - [8. Matrice de correspondance (fonctionnalité -> critères de succès phase 1)](#8-matrice-de-correspondance-fonctionnalite-criteres-de-succes-phase-1)
  - [9. Recommandation de delivery (2 sprints)](#9-recommandation-de-delivery-2-sprints)
  - [10. Gel du périmètre MVP (avant design/codage)](#10-gel-du-perimetre-mvp-avant-designcodage)
    - [10.1 Indispensable (release 1 verrouillée)](#101-indispensable-release-1-verrouillee)
    - [10.2 Souhaite (non bloquant release 1)](#102-souhaite-non-bloquant-release-1)
    - [10.3 Plus tard (hors MVP)](#103-plus-tard-hors-mvp)
    - [10.4 Périmètre de la première release - gelé](#104-perimetre-de-la-premiere-release-gele)
    - [10.5 Matrice de classification complète (toutes les fonctionnalités demandées)](#105-matrice-de-classification-complete-toutes-les-fonctionnalites-demandees)
    - [Règles d'exécution](#regles-dexecution)
  - [11. Preuves de validation - MOB-01 (Initialiser app Ionic Angular)](#11-preuves-de-validation-mob-01-initialiser-app-ionic-angular)
  - [12. Preuves de validation - MOB-03 (Theming, design tokens et composants UI)](#12-preuves-de-validation-mob-03-theming-design-tokens-et-composants-ui)

## 1. Objectif métier principal

Le MVP mobile sert à maintenir les participants KRAAK connectés à leur parcours d'apprentissage, de façon simple et fiable.

Objectifs métiers prioritaires :

- permettre une authentification sécurisée
- donner un accès direct à leurs informations de formation
- centraliser les mises à jour et ressources
- garder un lien actif entre les participants et KRAAK

## 2. Audience mobile principale

Utilisateurs cibles du MVP (ordre de priorité) :

1. Participants inscrits
2. Prospects déjà engagés dans un parcours KRAAK
3. Équipe interne/admins uniquement pour les opérations strictement nécessaires au MVP

Hors périmètre MVP :

- application mobile de navigation grand public
- back-office admin avancé sur mobile
- matrice de rôles complexe sauf besoin imposé par le pilote

## 3. Actions utilisateurs prioritaires (flux coeur)

Les participants doivent pouvoir :

1. Se connecter
2. Voir leurs programmes suivis
3. Consulter le planning et les informations de session
4. Accéder aux ressources de formation
5. Recevoir des annonces/mises à jour
6. Contacter le support, le formateur ou KRAAK

## 4. Critères de succès (préparation pilote)

Le MVP mobile est réussi lorsque :

- l'authentification participant fonctionne de bout en bout
- chaque participant voit uniquement le contenu pertinent (périmètre rôle/contexte)
- l'application fonctionne d'abord sur Android (iOS optionnel sur la meme phase)
- les annonces/notifications de base sont disponibles
- la stabilité est suffisante pour un usage pilote réel

## 5. Limites de périmètre MVP

Dans le périmètre :

- accès au compte participant
- information de formation en lecture prioritaire et communication
- parcours de contact/support basique

Hors périmètre Phase 1 :

- paiements/abonnements avancés
- moteur LMS complet de progression
- logique lourde de synchronisation offline-first
- tableaux de bord analytiques avances dans l'application

## 6. Porte de décision produit (fin de phase 1)

Passer à la phase suivante uniquement si toutes ces conditions sont vraies :

- objectif et audience valides par les parties prenantes
- critères de succès mesurables et acceptés
- flux utilisateurs coeur figés pour la planification implementation
- trajectoire pilote Android-first confirmée

## 7. Phase 2 - Decoupage priorise des fonctionnalités (Indispensable/Souhaite/Plus tard)

Ce découpage traduit le résultat de la phase 1 en périmètre MVP prêt pour l'implementation.

### 7.1 Indispensable (critique pilote)

Ces fonctionnalités sont requises pour lancer un pilote Android reel.

1. Authentification et session

- Connexion email/mot de passe
- Persistance de session sécurisée
- Déconnexion
- Reinitialisation de mot de passe (flux basique)
- Mapping de résultat : le participant peut s'authentifier

1. Accueil périmètre participant

- Afficher uniquement le contenu pertinent après connexion
- Carte(s) programme : titre du programme suivi, statut, prochaine étape clé
- Écran de bienvenue/onboarding de base après première connexion
- Mapping de résultat : le participant voit uniquement le contenu pertinent

1. Planning et sessions

- Liste des sessions a venir (date/heure, titre, lieu/lien)
- Page détail session (description + formateur + infos de participation)
- Mapping de résultat : consulter le planning/sessions

1. Ressources de formation (lecture/téléchargement)

- Liste des ressources par programme/module
- Ouvrir le détail d'une ressource et accéder au lien/fichier
- Mapping de résultat : accéder aux ressources de formation

1. Annonces (base)

- Fil d'annonces in-app
- Marqueur non lu/lu (simple)
- Mapping de résultat : notifications/annonces de base disponibles

1. Contact et support

- Action de contact depuis l'application (email/WhatsApp/formulaire deeplink)
- Informations de contact support/formateur visibles
- Mapping de résultat : rester connecte a KRAAK

1. Preparation pilote Android

- Build Android signe et installable
- Baseline crash-free et contrôles de performance de base
- Mapping de résultat : application assez stable pour un pilote réel

### 7.2 Souhaite (forte valeur, non bloquant lancement)

Ces fonctionnalités améliorent la qualité du pilote mais ne bloquent pas le déploiement jour 1.

1. Notifications push (annonces uniquement)

- Recevoir une notification push lorsqu'une nouvelle annonce est publiée
- Ouvrir l'application directement sur l'annonce concernée

1. Profil participant léger

- Voir/modifier les champs de profil de base (nom, téléphone, contact préféré)

1. Marqueurs de progression des ressources

- Marquer une ressource comme vue/téléchargée

1. Rappels de session

- Rappel local 24 h/1 h avant une session à venir

1. Feedback in-app basique

- Formulaire rapide "Besoin d'aide" ou "Signaler un problème"

### 7.3 Plus tard (candidats post-pilote)

Ces éléments sont utiles mais volontairement reportés après le pilote MVP.

1. Packaging iOS et distribution TestFlight
2. Cache offline pour certaines ressources
3. Messagerie/chat in-app avec le formateur
4. Tableaux de bord avancés par rôle
5. Vues analytiques riches pour les participants

## 8. Matrice de correspondance (fonctionnalité -> critères de succès phase 1)

| Découpage fonctionnalités                     | Auth ok | Contenu pertinent uniquement | Android first | Annonces disponibles | Stabilité pilote |
| --------------------------------------------- | ------- | ---------------------------- | ------------- | -------------------- | ---------------- |
| Indispensable - Authentification/session      | Oui     | Indirect                     | Oui           | Non                  | Oui              |
| Indispensable - Accueil périmètre participant | Non     | Oui                          | Oui           | Non                  | Oui              |
| Indispensable - Planning/sessions             | Non     | Oui                          | Oui           | Non                  | Oui              |
| Indispensable - Ressources                    | Non     | Oui                          | Oui           | Non                  | Oui              |
| Indispensable - Fil d'annonces                | Non     | Oui                          | Oui           | Oui                  | Oui              |
| Indispensable - Contact/support               | Non     | Indirect                     | Oui           | Non                  | Oui              |
| Indispensable - Preparation pilote Android    | Non     | Non                          | Oui           | Non                  | Oui              |
| Souhaite - Notifications push                 | Non     | Indirect                     | Oui           | Oui                  | Indirect         |
| Souhaite - Profil participant                 | Non     | Oui                          | Oui           | Non                  | Indirect         |
| Souhaite - Marqueurs de progression           | Non     | Oui                          | Oui           | Non                  | Indirect         |
| Souhaite - Rappels de session                 | Non     | Non                          | Oui           | Indirect             | Indirect         |
| Souhaite - Feedback in-app                    | Non     | Indirect                     | Oui           | Non                  | Indirect         |

## 9. Recommandation de delivery (2 sprints)

Sprint 1 (fondations indispensables) :

- Authentification/session
- Onboarding/welcome de base
- Accueil périmètre participant
- Planning/sessions
- Contact/support

Sprint 2 (finalisation indispensable + souhaites sélectifs) :

- Ressources
- Fil d'annonces
- Stabilisation pilote Android
- Optionnel : notifications push si la stabilité est confirmée

Go/No-Go vers pilote :

- Toutes les user stories indispensables sont acceptées
- Aucun blocker P1 ouvert
- Flux participant de bout en bout valide sur Android

## 10. Gel du périmètre MVP (avant design/codage)

Cette section gèle le périmètre de la première release et précise ce qui est priorisé maintenant versus plus tard.

### 10.1 Indispensable (release 1 verrouillée)

- Authentification participant
- Onboarding / welcome de base
- Liste des programmes/cours
- Calendrier ou planning de session
- Bibliothèque de ressources
- Annonces / notifications
- Contact/support
- Déconnexion / gestion de session

### 10.2 Souhaite (non bloquant release 1)

- Profil participant
- Préparation de base des notifications push
- Marqueurs de progression des ressources
- Rappels de session
- Feedback in-app basique

### 10.3 Plus tard (hors MVP)

- LMS complet
- Classes vidéo en direct dans l'application
- Paiements in-app
- Packaging iOS et distribution TestFlight
- Cache offline pour certaines ressources
- Messagerie/chat in-app avec le formateur
- Synchronisation offline à grande échelle
- Communauté/forum/chat
- Moteur de notation des devoirs
- Tableaux de bord analytiques approfondis pour les utilisateurs
- Moteur avancé de certificats
- Panneau admin multi-rôle dans l'application mobile
- Gamification complexe

### 10.4 Périmètre de la première release - gelé

La release 1 est gelée sur les fonctionnalités **Indispensable** uniquement.

Enveloppe MVP (globale) :

- **Dans MVP** = Indispensable + Souhaite
- **Hors MVP** = Plus tard

### 10.5 Matrice de classification complète (toutes les fonctionnalités demandées)

| Fonctionnalité                             | Classification |
| ------------------------------------------ | -------------- |
| Authentification participant               | Indispensable  |
| Onboarding / welcome de base               | Indispensable  |
| Accueil périmètre participant              | Indispensable  |
| Profil participant                         | Souhaite       |
| Liste des programmes/cours                 | Indispensable  |
| Calendrier ou planning de session          | Indispensable  |
| Bibliothèque de ressources                 | Indispensable  |
| Annonces / notifications                   | Indispensable  |
| Contact/support                            | Indispensable  |
| Préparation pilote Android                 | Indispensable  |
| Préparation de base des notifications push | Souhaite       |
| Marqueurs de progression des ressources    | Souhaite       |
| Rappels de session                         | Souhaite       |
| Feedback in-app basique                    | Souhaite       |
| Déconnexion / gestion de session           | Indispensable  |
| LMS complet                                | Plus tard      |
| Classes vidéo en direct dans l'application | Plus tard      |
| Paiements in-app                           | Plus tard      |
| Packaging iOS et distribution TestFlight   | Plus tard      |
| Cache offline pour certaines ressources    | Plus tard      |
| Messagerie/chat in-app avec le formateur   | Plus tard      |
| Synchronisation offline à grande échelle   | Plus tard      |
| Communauté/forum/chat                      | Plus tard      |
| Moteur de notation des devoirs             | Plus tard      |
| Tableaux de bord analytiques utilisateurs  | Plus tard      |
| Moteur avancé de certificats               | Plus tard      |
| Panneau admin multi-rôle dans le mobile    | Plus tard      |
| Gamification complexe                      | Plus tard      |

### Règles d'exécution

- Le design et l'engineering démarrent depuis les fonctionnalités Indispensable uniquement.
- Les éléments Souhaite ne peuvent être pris que si l'Indispensable est terminé et que la stabilité pilote n'est pas à risque.
- Les éléments Plus tard restent hors périmètre jusqu'à décision post-pilote.

## 11. Preuves de validation - MOB-01 (Initialiser app Ionic Angular)

Contexte de vérification (date : 2026-04-28) :

- La cible définie par le backlog pour `MOB-01` est `apps/client/projects/mobile`.
- Le projet mobile Ionic Angular est présent dans le workspace Angular (`projects.mobile` dans `apps/client/angular.json`) avec bootstrap standalone Ionic (`provideIonicAngular`).

Preuves d'exécution :

1. Build mobile

- Commande : `pnpm --filter @kraak/client build:mobile`
- Résultat : succès, bundle généré dans `apps/client/dist/mobile`
- Note : un warning de budget initial est remonté (`651.03 kB` > budget `600 kB`), non bloquant pour l'initialisation de l'application

1. Tests unitaires mobile

- Commande : `pnpm --filter @kraak/client test:mobile`
- Résultat : succès (`21` fichiers de test passés, `52` tests passés)

1. Lint mobile

- Commande : `pnpm --filter @kraak/client exec ng lint mobile`
- Résultat : succès (`All files pass linting`)

Conclusion d'acceptation MOB-01 :

- Scope MOB-01 implémenté : Oui (application Ionic Angular initialisée et buildable)
- Dépendance SET-01 satisfaite : Oui (workspace Angular monorepo déjà en place)
- Preuves de validation ajoutées : Oui (section présente dans ce document)

## 12. Preuves de validation - MOB-03 (Theming, design tokens et composants UI)

Contexte de vérification (date : 2026-04-28) :

- Le mobile consomme les tokens partagés via `@kraak/tokens/tokens.css` importé dans `projects/mobile/src/tailwind.css`.
- Le thème Ionic mobile est aligné sur les tokens (`--ion-color-*`, `--ion-font-family`) dans `projects/mobile/src/styles.scss`.
- Des composants UI de base partagés sont en place sous `projects/mobile/src/app/shared/ui/`.

Scope livré pour MOB-03 :

1. Theming mobile consolidé

- Ajout de primitives UI réutilisables dans `projects/mobile/src/tailwind.css` :
  - `.kraak-surface-card`
  - `.kraak-overline`
  - `.kraak-section-title`
  - `.kraak-section-subtitle`

1. Intégration des composants UI de base

- `FeatureCardComponent` refactoré pour utiliser les primitives de thème (`kraak-surface-card`, `kraak-overline`).
- `SectionTitleComponent` refactoré pour utiliser les primitives de thème (`kraak-overline`, `kraak-section-title`, `kraak-section-subtitle`).

1. Tests unitaires renforcés

- `feature-card.component.spec.ts` vérifie désormais la classe de surface commune.
- `section-title.component.spec.ts` vérifie désormais les classes de titre/sous-titre/overline.

Preuves d'exécution :

1. Tests unitaires mobile

- Commande : `pnpm --filter @kraak/client test:mobile`
- Résultat : succès (`21` fichiers de test passés, `52` tests passés)

1. Lint mobile

- Commande : `pnpm --filter @kraak/client exec ng lint mobile`
- Résultat : succès (`All files pass linting`)

1. Build mobile

- Commande : `pnpm --filter @kraak/client build:mobile`
- Résultat : succès, bundle généré dans `apps/client/dist/mobile`
- Note : warning budget initial maintenu (non bloquant) : `652.24 kB` pour un budget de `600 kB`

Conclusion d'acceptation MOB-03 :

- Scope MOB-03 implémenté : Oui
- Dépendances MOB-01, LIB-01 satisfaites : Oui (app mobile initialisée + package `contracts` existant et utilisé dans le monorepo)
- Preuves de validation ajoutées : Oui (section présente dans ce document)
