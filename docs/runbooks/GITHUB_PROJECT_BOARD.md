# Guide De Rework Du GitHub Project

## Board Actif

- GitHub Project principal : `#6 - KRAAK MVP - Product Backlog`
- Propriétaire : `@me` / `Ange230700`
- Depot : `Ange230700/kraak-group`
- Mise a jour : 11 avril 2026

---

## État Actuel

Le rework du board a ete execute le 10-11 avril 2026.

- le project contient `80` items (tous issus du backlog MVP canonique)
- les `38` anciennes issues web-only (`#1` a `#38`) ont ete retirees
- tous les champs duo (`Lane`, `Surface`, `Coupling`, `Wave`) sont renseignes
  sur chaque item (553 field-edit commands, zero erreurs)
- la vue Board par défaut est configurée en Kanban avec swimlanes, tri, et
  slicing
- `6` vues personnalisées sont créées et sauvegardées

Source canonique :

- backlog métier : `docs/specs/BACKLOG.md`
- projection board duo : `docs/specs/github_project_import_parallel_duo.csv`
- famille d'issues canonique : `[EPIC][ID]` et `[TASK][ID]`

---

## Objectif Du Rework

Le board doit devenir lisible pour deux personnes qui travaillent en parallèle
avec un minimum de dépendances implicites.

Le principe retenu :

- `Lane A - Web public` : site vitrine, conversion, SEO, contact web
- `Lane B - Platform & participant` : packages, API, auth, mobile, parcours
  participant
- `Shared handoff` : cadrage, contrats, quality gates, release

Une dépendance acceptable doit ressembler à :

- un contrat publié
- un endpoint stable
- une route ou un shell disponible
- un check de qualité commun

Une dépendance non acceptable doit ressembler à :

- "attendre que tout l'epic soit fini"
- "attendre tout le frontend"
- "attendre tout le backend"

---

## Champs Board Cibles

### Champs deja presents

- `Status`
- `Priority`
- `Area`
- `Effort`
- `Launch blocker`

### Champs board duo

Ces champs ont ete créés sur le project `#6` le `10 avril 2026`.

- `Lane` (`SINGLE_SELECT`)
  - `Lane A - Web public`
  - `Lane B - Platform & participant`
  - `Shared handoff`
- `Surface` (`SINGLE_SELECT`)
  - `docs`
  - `shared`
  - `api`
  - `web`
  - `mobile`
  - `qa`
  - `ops`
- `Coupling` (`SINGLE_SELECT`)
  - `independent`
  - `handoff`
  - `paired`
  - `portfolio`
- `Wave` (`SINGLE_SELECT`)
  - `Wave 0 - Cadrage`
  - `Wave 1 - Socle`
  - `Wave 2 - Accès`
  - `Wave 3A - Site public`
  - `Wave 3B - Parcours participant`
  - `Wave 4 - Qualité`
  - `Wave 5 - Release`

Usage attendu :

- `Lane` = qui peut avancer dessus sans attendre l'autre
- `Surface` = ou se fait le changement principal
- `Coupling` = niveau de coordination requis
- `Wave` = ordre macro d'exécution

---

## Vue Board Par Défaut (View 1)

La vue Board est configurée en Kanban optimisé pour le travail duo :

- **Layout** : Board (Kanban)
- **Column by** : Status (Todo / In Progress / Done)
- **Fields affiches** : Title, Assignees, Status, Sub-issues progress, Priority,
  Lane, Wave, Effort
- **Swimlanes** : Lane (Lane A / Lane B / Shared handoff)
- **Sort** : Priority (ascending — critical en haut)
- **Slice by** : Wave (filtrage rapide par vague)
- **Field sum** : Effort (somme des points par colonne)

---

## Vues Personnalisées (Views 2-7)

Toutes les vues ci-dessous sont créées et sauvegardées.

### 2. `Master backlog`

Layout : Table

Filtres : aucun (tous les items)

Tri :

1. `Wave` (ascending)
2. `Priority` (ascending)

### 3. `Lane A - Web public`

Layout : Table

Filtre : `lane:"Lane A - Web public" -status:Done`

Tri : `Wave` (ascending), `Priority` (ascending)

### 4. `Lane B - Platform & participant`

Layout : Table

Filtre : `lane:"Lane B - Platform & participant" -status:Done`

Tri : `Wave` (ascending), `Priority` (ascending)

### 5. `Shared handoff`

Layout : Table

Filtre : `lane:"Shared handoff" -status:Done`

Tri : `Wave` (ascending), `Priority` (ascending)

### 6. `Ready now`

Layout : Table

Filtre : `-status:Done -coupling:paired`

Tri : `Priority` (ascending), `Wave` (ascending)

But : faire émerger les taches sans besoin de travail en duo.

Clarification : dans GitHub Project `Status`, la valeur de file d'attente est
`Todo` (correspond a `backlog` dans le CSV d'import).

### 7. `Release critical`

Layout : Table

Filtre : `launch-blocker:Yes`

Tri : `Priority` (ascending), `Wave` (ascending)

---

## Mapping De Travail Recommande

### Lane A - Web public

- `WEB-*`
- `SUP-03`
- `DSH-04` si la variante web participant est confirmée

### Lane B - Platform & participant

- `MOB-*`
- `AUT-*`
- `DSH-*` sauf `DSH-04`
- `PRG-*`
- `RES-*`
- `ANN-*`
- `SUP-01`
- `SUP-02`
- `SUP-04`
- `SUP-05`

### Shared handoff

- `ARC-*`
- `SET-*`
- `LIB-*`
- `QAT-*`
- `DEP-*`

Règle pratique :

- un item `Shared handoff` doit idéalement débloquer une lane sous `24h`
- si un item shared grossit, il faut le re-découper avant de le lancer

---

## Migration (Effectuée)

Les étapes suivantes ont été réalisées le 10-11 avril 2026 :

1. **Legacy purge** : les 38 anciennes issues web-only ont ete retirees du
   project.
2. **Ajout canonique** : les 80 issues MVP (`[EPIC]` + `[TASK]`) ont ete
   ajoutées.
3. **Champs duo** : `Lane`, `Surface`, `Coupling`, `Wave` renseignes sur
   chaque item via 553 commandes `gh project item-edit` (zero erreurs).
4. **Board optimise** : vue Board configurée en Kanban avec swimlanes, tri,
   slicing, et somme d'effort.
5. **6 vues personnalisées** : créées, filtrées, triées, et sauvegardées.

### Cycle de vie

- `Status` : `Todo -> In Progress -> Done`
- mapping CSV / backlog : `backlog -> Todo`
- issue : `Open -> Closed`
- board : aligner le meme jour que le merge vers `main`

---

## Règles De Coordination A Deux

- ne pas prendre en meme temps deux taches qui modifient le meme module
  principal
- préférer `contrat -> endpoint -> UI -> tests` plutôt que deux personnes dans
  le meme fichier
- si une tache touche `packages/*`, considerer qu'elle est `Shared handoff`
- si une tache web depend d'une API, la tache UI doit commencer sur mock,
  structure, et états avant le branchement final
- si un item reste `In Progress` plus de deux jours sans merge, il est
  probablement trop gros

---

## Artefact A Utiliser

Le fichier a utiliser pour la reimportation ou la remise a plat du board est :

- `docs/specs/github_project_import_parallel_duo.csv`

Il ajoute une lecture opérationnelle en plus du backlog :

- `Lane`
- `Surface`
- `Coupling`
- `Wave`

---

## Decision Opératoire

Par défaut :

- backlog thématique dans `docs/specs/BACKLOG.md`
- board live pilote en `Lane A / Lane B / Shared handoff`
- aucune nouvelle tâche ne doit être créée dans l'ancien format web-only

Cette organisation est celle qui minimise les dépendances entre deux
collaborateurs sans étendre le scope du MVP.
