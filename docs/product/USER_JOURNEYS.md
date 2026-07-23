---
status: active
owner: platform
last_reviewed: 2026-07-23
source_of_truth: true
---

# Parcours Utilisateur De L'Application

## Objectif

Ce document fige les parcours utilisateur MVP de l'application mobile KRAAK.

Il couvre :

- les flux MVP exacts
- les critères d'acceptation par flux
- les états d'échec prioritaires
- le modèle de navigation du premier lancement
- la structure de navigation mobile gelée pour le MVP

Ce document doit servir de référence pour le design mobile, les contrats
backend, les écrans Ionic Angular, les tests E2E et les tests d'acceptation.

---

## 1. Principes De Cadrage

- le MVP vise prioritairement le rôle `participant`
- les parcours `admin` et `trainer` ne pilotent pas l'architecture de navigation
  du MVP mobile
- l'application doit rester simple, lisible et orientée consultation d'un
  parcours de formation
- les flux critiques doivent être exploitables avec un minimum d'étapes et peu
  de friction

---

## 2. Flux MVP À Couvrir

Flux retenus :

1. Sign in
2. First access / onboarding
3. View dashboard
4. Open program
5. View session details
6. Open a resource
7. Read announcement
8. Contact support
9. Log out

---

## 3. Navigation De Premier Lancement

### Décision retenue

Le modèle de navigation du MVP mobile est :

- **tabs** comme navigation principale après connexion
- **stacked navigation** à l'intérieur de chaque onglet pour les écrans de
  détail
- **pas de menu latéral** comme structure primaire du MVP

### Raisons de ce choix

- les usages MVP sont peu nombreux, récurrents et lisibles dans une barre
  d'onglets
- le participant doit atteindre rapidement son tableau de bord, ses programmes,
  ses annonces et le support
- les détails de programme, session, ressource et annonce se prêtent bien à une
  navigation en pile depuis un point d'entrée principal
- un menu latéral ajouterait une profondeur inutile pour le MVP

### Règle de gel

Pour le MVP, la navigation principale est gelée sur :

- une navigation par onglets après authentification
- une navigation empilée pour les détails
- un flux d'authentification/onboarding hors des onglets

---

## 4. Structure De Navigation Mobile Gelée

### Avant authentification

- `Sign in`
- `First access / onboarding` si applicable

### Après authentification

Onglets principaux retenus :

1. `Accueil`
2. `Programmes`
3. `Annonces`
4. `Support`

### Détails en navigation empilée

Depuis `Accueil` :

- détail de programme
- détail de session
- détail d'annonce

Depuis `Programmes` :

- détail de programme
- détail de session
- détail de ressource

Depuis `Annonces` :

- détail d'annonce

Depuis `Support` :

- formulaire de demande
- détail d'une demande existante si affiché au MVP

### Actions transverses

- `Log out` accessible depuis l'entête de l'application ou un point de profil
  léger

Règle MVP :

- ne pas ajouter d'onglet `Profil` dédié tant que le besoin n'est pas confirmé
- ne pas introduire de menu hamburger principal

### Carte de navigation complète

```mermaid
flowchart TD
    start(["Ouverture de l'app"])
    auth{"Session\nvalide ?"}
    signin["Écran Sign in"]
    onboarding{"Onboarding\nrequis ?"}
    first_access["Premier accès\nonboarding"]

    subgraph tabs["Navigation par onglets — post-connexion"]
        home["Accueil\n(onglet 1)"]
        programs["Programmes\n(onglet 2)"]
        announcements["Annonces\n(onglet 3)"]
        support["Support\n(onglet 4)"]
    end

    program_detail["Détail programme"]
    session_detail["Détail session"]
    resource_detail["Détail ressource"]
    announcement_detail["Détail annonce"]
    support_form["Formulaire support"]
    logout(["Log out"])

    start --> auth
    auth -- "non" --> signin
    signin -- "succès" --> onboarding
    auth -- "oui" --> onboarding
    onboarding -- "oui" --> first_access
    first_access --> home
    onboarding -- "non" --> home

    home --> program_detail
    home --> session_detail
    home --> announcement_detail
    programs --> program_detail
    program_detail --> session_detail
    program_detail --> resource_detail
    announcements --> announcement_detail
    support --> support_form

    home -. "Log out" .-> logout
    programs -. "Log out" .-> logout
    announcements -. "Log out" .-> logout
    support -. "Log out" .-> logout
```

---

## 5. Parcours Détaillés Et Critères D'Acceptation

## 5.1 Sign in

### But - Sign in

Permettre à un participant autorisé de se connecter avec un accès sécurisé.

### Déclencheur - Sign in

- ouverture de l'application sans session valide
- retour à l'application après déconnexion ou expiration de session

### Parcours nominal - Sign in

1. L'utilisateur arrive sur l'écran `Sign in`.
2. Il saisit son email et son mot de passe.
3. Il valide le formulaire.
4. L'application authentifie l'utilisateur.
5. Si le compte est valide, l'application charge le contexte utilisateur.
6. Si onboarding requis, l'utilisateur est redirigé vers le flux de premier
   accès.
7. Sinon, il entre sur `Accueil`.

### Critères d'acceptation - Sign in

- l'écran affiche au minimum `email`, `mot de passe` et action de connexion
- l'authentification réussie redirige vers le bon flux post-login
- une session persistante est créée après connexion réussie
- un utilisateur non `participant` n'entre pas dans un parcours mobile non prévu
  sans règle explicite
- un retour utilisateur clair est affiché en cas d'échec

---

## 5.2 First Access / Onboarding

### But - First Access / Onboarding

Confirmer le premier accès et orienter le participant avant l'usage courant.

### Déclencheur - First Access / Onboarding

- première connexion d'un participant
- compte `registered` sans onboarding complété

### Parcours nominal - First Access / Onboarding

1. L'utilisateur est redirigé vers l'écran de premier accès.
2. L'application affiche un message de bienvenue, le cadre du parcours et les
   prochaines actions utiles.
3. L'utilisateur confirme ou termine les éléments requis minimums.
4. L'application marque l'onboarding comme terminé.
5. L'utilisateur est redirigé vers `Accueil`.

### Critères d'acceptation - First Access / Onboarding

- le premier accès n'apparaît qu'aux utilisateurs concernés
- l'écran rappelle clairement ce que l'utilisateur peut faire dans l'app
- le participant peut terminer le flux en peu d'étapes
- la fin du flux empêche sa réapparition abusive lors des connexions suivantes
- la redirection finale mène vers `Accueil`

---

## 5.3 View Dashboard

### But - View Dashboard

Donner une vue synthétique du contexte participant à l'ouverture de l'app.

### Déclencheur - View Dashboard

- connexion réussie sans onboarding en attente
- ouverture de l'onglet `Accueil`

### Parcours nominal - View Dashboard

1. Le participant arrive sur `Accueil`.
2. L'application affiche le résumé du compte et du parcours.
3. Le participant voit ses programmes actifs ou pertinents.
4. Il voit les prochaines sessions, les annonces récentes et les accès rapides
   utiles.

### Critères d'acceptation - View Dashboard

- l'écran `Accueil` est le point d'entrée principal post-login
- les données affichées sont limitées au périmètre du participant
- l'écran met en avant au moins : programmes, prochaines sessions, annonces
- chaque carte utile ouvre un détail cohérent
- si aucun contenu n'est disponible, un état vide compréhensible est affiché

---

## 5.4 Open Program

### But - Open Program

Permettre au participant d'ouvrir un programme auquel il est inscrit.

### Déclencheur - Open Program

- clic depuis `Accueil`
- clic depuis l'onglet `Programmes`

### Parcours nominal - Open Program

1. Le participant sélectionne un programme visible.
2. L'application ouvre l'écran détail du programme.
3. L'écran affiche au minimum résumé, cohorte liée si applicable, sessions,
   ressources et annonces utiles.

### Critères d'acceptation - Open Program

- seuls les programmes accessibles au participant sont ouvrables
- l'écran détail expose les informations minimales attendues
- la navigation retour fonctionne vers l'écran précédent
- le participant peut enchaîner vers détail de session ou ressource depuis le
  programme

---

## 5.5 View Session Details

### But - View Session Details

Permettre au participant de consulter le détail d'une session.

### Déclencheur - View Session Details

- clic depuis `Accueil`
- clic depuis un programme

### Parcours nominal - View Session Details

1. Le participant sélectionne une session.
2. L'application ouvre le détail de session.
3. Le détail affiche le titre, l'horaire, le statut, le lieu/lien, le
   descriptif et les informations utiles.

### Critères d'acceptation - View Session Details

- seules les sessions du périmètre du participant sont visibles
- le détail contient les informations nécessaires pour rejoindre ou comprendre
  la session
- l'utilisateur peut revenir facilement à son programme ou à l'écran précédent

---

## 5.6 Open a Resource

### But - Open a Resource

Permettre au participant d'accéder à une ressource pédagogique publiée.

### Déclencheur - Open a Resource

- clic depuis le détail programme
- clic depuis une liste de ressources

### Parcours nominal - Open a Resource

1. Le participant ouvre une ressource visible.
2. L'application affiche le détail de la ressource ou ouvre directement la
   cible selon le type.
3. Le participant consulte le contenu ou le télécharge.

### Critères d'acceptation - Open a Resource

- seules les ressources publiées et autorisées sont visibles
- le type de ressource est géré proprement (`link`, `file`, etc.)
- l'ouverture d'une ressource ne casse pas la navigation globale
- en cas d'absence de ressource, un état vide explicite est affiché

---

## 5.7 Read Announcement

### But - Read Announcement

Permettre au participant de lire une annonce pertinente.

### Déclencheur - Read Announcement

- clic depuis `Accueil`
- clic depuis l'onglet `Annonces`
- clic depuis une notification

### Parcours nominal - Read Announcement

1. Le participant ouvre une annonce.
2. L'application affiche le détail de l'annonce.
3. Le contenu est lisible et contextualisé.
4. L'annonce peut être marquée lue si ce comportement est prévu.

### Critères d'acceptation - Read Announcement

- seules les annonces du périmètre du participant sont visibles
- l'écran détail affiche titre, contenu, date et contexte utile
- une annonce ouverte depuis une notification mène au bon contenu
- la consultation ne révèle aucune annonce non autorisée

---

## 5.8 Contact Support

### But - Contact Support

Permettre au participant de solliciter de l'aide rapidement.

### Déclencheur - Contact Support

- clic sur l'onglet `Support`
- clic sur une action de support depuis `Accueil` ou un écran détail

### Parcours nominal - Contact Support

1. Le participant ouvre `Support`.
2. L'application affiche les moyens de contact disponibles.
3. Il choisit un canal rapide ou ouvre un formulaire de demande.
4. Il saisit sa demande et valide.
5. L'application confirme la prise en compte.

### Critères d'acceptation - Contact Support

- l'onglet `Support` est accessible depuis la navigation principale
- au moins un canal exploitable est disponible au MVP
- le participant peut soumettre une demande structurée
- une confirmation claire est affichée après envoi
- les demandes créées sont rattachées au bon utilisateur

---

## 5.9 Log out

### But - Log out

Permettre à l'utilisateur de fermer proprement sa session.

### Déclencheur - Log out

- clic sur l'action `Log out`

### Parcours nominal - Log out

1. L'utilisateur déclenche l'action de déconnexion.
2. L'application invalide la session locale et distante si nécessaire.
3. L'utilisateur est redirigé vers `Sign in`.

### Critères d'acceptation - Log out

- la session locale est supprimée
- les écrans protégés ne restent pas accessibles après déconnexion
- toute tentative de retour vers un écran privé redirige vers `Sign in`

---

## 6. États D'Échec Prioritaires

États à traiter explicitement au MVP :

- `bad login`
- `no enrollment`
- `no internet`
- `expired session`
- `empty resource list`
- `unauthorized access`

### 6.1 Bad login

Cas :

- email inconnu
- mot de passe invalide
- compte non autorisé

Attendu MVP :

- message d'erreur clair et non technique
- aucun accès partiel à l'espace privé
- possibilité de réessayer sans recharger l'application

### 6.2 No enrollment

Cas :

- participant authentifié mais sans inscription active exploitable

Attendu MVP :

- affichage d'un état dédié, non cassé
- explication claire: aucun programme disponible pour le moment
- orientation vers le support ou le contact KRAAK

### 6.3 No internet

Cas :

- perte réseau au lancement ou pendant un flux

Attendu MVP :

- message clair sur l'absence de connexion
- conservation de l'écran courant si possible
- possibilité de relancer l'action

### 6.4 Expired session

Cas :

- jeton expiré
- session invalide côté backend

Attendu MVP :

- déconnexion contrôlée
- message explicite
- redirection vers `Sign in`

### 6.5 Empty resource list

Cas :

- programme/cohorte sans ressource publiée

Attendu MVP :

- état vide lisible
- aucun écran cassé ou ambigu
- message orienté information, pas erreur bloquante

### 6.6 Unauthorized access

Cas :

- tentative d'ouverture d'un programme, d'une session, d'une ressource ou d'une
  annonce hors périmètre

Attendu MVP :

- blocage d'accès explicite
- pas d'exposition de données sensibles
- redirection vers un écran autorisé si nécessaire

---

## 7. Matrice De Couverture Minimaliste Des Flux

| Flux                      | Auth requise | Données métier requises       | Navigation principale | État d'échec prioritaire |
| ------------------------- | ------------ | ----------------------------- | --------------------- | ------------------------ |
| Sign in                   | Non          | Non                           | hors tabs             | bad login                |
| First access / onboarding | Oui          | Contexte participant          | hors tabs             | expired session          |
| View dashboard            | Oui          | Enrollments + contenu visible | Accueil               | no enrollment            |
| Open program              | Oui          | Program + enrollment          | Programmes / Accueil  | unauthorized access      |
| View session details      | Oui          | Session visible               | stacked navigation    | unauthorized access      |
| Open a resource           | Oui          | Resource visible              | stacked navigation    | empty resource list      |
| Read announcement         | Oui          | Announcement visible          | Annonces / Accueil    | unauthorized access      |
| Contact support           | Oui          | User + support channel        | Support               | no internet              |
| Log out                   | Oui          | Session                       | action globale        | expired session          |

---

## 8. Décision Finale De Navigation MVP

Navigation gelée pour le MVP :

- modèle principal : **tabs**
- détails : **stacked navigation**
- flux hors navigation principale : **authentification et onboarding**
- modèle écarté pour le MVP : **menu latéral**

### Onglets gelés

1. `Accueil`
2. `Programmes`
3. `Annonces`
4. `Support`

### Écrans de détail gelés

- détail programme
- détail session
- détail ressource
- détail annonce
- formulaire/support detail minimal si nécessaire

Règle de gel :

- ne pas ajouter de cinquième onglet au MVP sans nouvelle décision produit
- ne pas introduire une navigation hybride complexe tabs + menu latéral
- ne pas transformer `Accueil` en simple liste ; il doit rester un tableau de
  bord synthétique

---

## 9. Utilisation De Cette Spec

Cette spec doit maintenant servir à :

- concevoir les wireframes mobile
- écrire les scénarios BDD/E2E des flux critiques
- structurer les routes et écrans Ionic Angular
- cadrer les réponses API minimales pour chaque flux
