# Guide De Rework Du GitHub Project

## Board Actif

- GitHub Project principal : `#6 - KRAAK - Product Backlog`
- Propriétaire : `@me` / `Ange230700`
- Dépôt : `Ange230700/kraak-consulting`
- Mise a jour : 23 juillet 2026

---

## État Actuel

Le rework initial du board a ete execute le 10-11 avril 2026. Depuis la
normalisation Phase 9, le Project #6 live est la source opérationnelle de
vérité.

- le Project contient `158` items au moment de l'export du 23 juillet 2026
- les champs stables de planification contrôlés par CSV sont `Priority`, `Lane`,
  `Surface`, `Coupling`, `Wave` et `Effort`
- les champs dynamiques (`Status`, `Assignee`, `Launch blocker`, milestone
  courant) restent lus depuis GitHub Project et ne doivent pas être remplacés par
  un CSV statique

Sources et artefacts :

- source opérationnelle : GitHub Project #6 live
- backlog métier : `docs/specs/BACKLOG.md`
- snapshot courant reproductible : `docs/specs/github_project_planning_current.csv`
- bootstrap historique MVP avril 2026 :
  `docs/specs/github_project_bootstrap_mvp_2026-04.csv`
- famille de titres acceptee :
  `[EPIC][ID]`, `[TASK][ID]`, `[BUG][ID]`, `[DEFECT][ID]`,
  `[ALERT][ID]`, `[ALERT][ID][scope]`, `[OPS]` et `[DOCS]`

Le CSV sert uniquement de snapshot/import reproductible. Il n'écrase jamais les
statuts live du board.

---

## Mises À Jour Du Statut Du Projet

Le Project #6 doit contenir des status updates publiés directement dans GitHub
Projects. Ces updates remplacent l'ancien modèle de comparaison CSV comme signal
de reporting humain : le CSV reste un snapshot technique, pas un journal de
pilotage.

Update initial à publier pour juillet 2026 :

```md
## KRAAK planning status — July 2026

### Current focus

- Restore GitHub Actions execution
- Restore Nightly Regression
- Restore production observability

### Release blockers

- #619 GitHub Actions billing/execution
- #618 Newman artifact
- #608 Production observability

### Planning maintenance

- Normalizing Project #6 fields, views and automation
- Replacing the obsolete CSV comparison model
```

Cadence obligatoire de publication :

- chaque semaine pendant une phase de livraison active
- avant toute décision de release
- après la clôture d'une vague majeure

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

`Area` est conservé temporairement comme champ historique, mais il est
optionnel et ne fait plus partie des champs requis par l'audit.

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
  - `Wave 2 - Acces`
  - `Wave 3A - Site public`
  - `Wave 3B - Parcours participant`
  - `Wave 4 - Qualite`
  - `Wave 5 - Release`
  - `Wave 6 - Monetisation`
  - `Wave 7 - Apprentissage`
  - `Wave 8 - Release V1.1`

Usage attendu :

- `Lane` = qui peut avancer dessus sans attendre l'autre
- `Surface` = ou se fait le changement principal
- `Coupling` = niveau de coordination requis
- `Wave` = ordre macro d'exécution

## Politique De Labels Phase 10

Les labels restent des signaux de type ou de domaine. Les champs GitHub Project
restent la source de vérité pour `Status` et `Priority`.

Labels à conserver ou créer selon le besoin :

- `type: task`
- `type: epic`
- `type: bug`
- `type: chore`
- `epic: ARC`
- `epic: AUT`
- `epic: PAY`
- `area: auth`
- `area: deployment`
- `security`
- `documentation`

Labels à retirer :

- `status: *`
- `priority: *`

Normalisation attendue : garder un espace après les deux-points pour les labels
namespacés (`epic: SET`, pas `epic:SET`).

---

## Contrat De Champs Et CSV Phase 9

Ce contrat est la règle opérationnelle avant tout remplissage en masse. L'audit
doit contrôler les champs selon la catégorie de l'item, pas forcer tous les
items à posséder les mêmes valeurs.

| Catégorie d'item          | Champs requis                                                                                                    |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Tâche `In Progress`       | `Status`, `Priority`, `Lane`, `Surface`, `Coupling`, `Wave`, `Effort`, `Launch blocker`, `Assignee`, `Milestone` |
| Tâche `Todo` vague active | `Status`, `Priority`, `Lane`, `Surface`, `Coupling`, `Wave`, `Effort`, `Launch blocker`                          |
| Tâche vague future        | `Status`, `Priority`, `Lane`, `Surface`, `Wave`                                                                  |
| Epic                      | `Status`, `Priority`, `Lane`, `Wave`                                                                             |
| Item `Done`               | `Status` uniquement ; conserver les champs historiques existants sans backfill obligatoire                       |
| Pull request              | Ne pas conserver comme carte normale de planification                                                            |

Pour l'audit local, passer la vague active explicitement quand elle est connue :

```bash
bash scripts/github-project-awareness.sh --current-wave "Wave 5 - Release"
```

Sans `--current-wave`, l'audit l'infère à partir des tâches `In Progress`, puis
de la première vague non terminée.

Pour régénérer le snapshot CSV courant :

```bash
bash scripts/github-project-awareness.sh \
  --owner Ange230700 \
  --repo Ange230700/kraak-consulting \
  --current-wave "Wave 5 - Release" \
  --export-current docs/specs/github_project_planning_current.csv
```

Règles de comparaison CSV :

- utiliser `Issue URL` en priorité, puis `Issue Number`
- utiliser le titre normalisé Unicode/accents seulement en fallback historique
- comparer uniquement `Priority`, `Lane`, `Surface`, `Coupling`, `Wave` et
  `Effort`
- exclure `Status`, `Assignee`, `Launch blocker` et milestone courant de la
  comparaison statique
- ne pas activer `--fail-on-drift` en CI tant que ce contrat Phase 9 et le
  snapshot courant ne sont pas revus et mergés

### Statut

Options conservées :

- `Todo`
- `In Progress`
- `Done`

### Priorité

La priorité doit redevenir un signal de décision strict :

| Priorité   | Sens opérationnel                                                                 |
| ---------- | --------------------------------------------------------------------------------- |
| `critical` | bloque la release courante, la production, la sécurité ou un workflow obligatoire |
| `high`     | requis dans la vague active                                                       |
| `medium`   | engagé mais non bloquant pour la release                                          |
| `low`      | optionnel, exploratoire ou reportable                                             |

Les anciens niveaux CSV se mappent seulement pour comparaison :

- `P0` -> `critical`
- `P1` -> `high`
- `P2` -> `medium`
- `P3` -> `low`

Cette conversion ne concerne que la compatibilité avec les anciens exports CSV.
Le board live utilise directement `critical`, `high`, `medium` et `low`.

### Effort

Le champ GitHub `Effort` reste numérique pour permettre les sommes par vue.
La comparaison CSV applique ce mapping :

| Taille | Points |
| ------ | -----: |
| `XS`   |      1 |
| `S`    |      2 |
| `M`    |      3 |
| `L`    |      5 |
| `XL`   |      8 |

Règles :

- requis pour les tâches `Todo` de la vague active et les tâches `In Progress`
- non requis directement sur les epics ; utiliser les totaux des sous-issues
- non requis sur les items `Done` historiques sauf besoin de reporting rétro

### Launch Blocker, Assignee Et Milestone

- `Launch blocker` est requis uniquement sur les tâches actives ou de release
  courante, avec une valeur explicite `Yes` ou `No`.
- Les tâches de vagues futures peuvent garder `Launch blocker` vide jusqu'au
  raffinement.
- `Assignee` est requis uniquement en `In Progress`.
- `Milestone` est requis pour le travail actif ; les tâches V1.1 futures doivent
  rester alignées avec `M8`, `M9` ou `M10` avant sélection.
- Ces champs sont dynamiques et ne font pas partie de la comparaison CSV
  canonique.

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

## Artefacts CSV

Le fichier historique de bootstrap/import initial est :

- `docs/specs/github_project_bootstrap_mvp_2026-04.csv`

Le snapshot courant de planification est :

- `docs/specs/github_project_planning_current.csv`

Le snapshot courant contient uniquement les champs stables :

- `Issue Number`
- `Issue URL`
- `Title`
- `Priority`
- `Lane`
- `Surface`
- `Coupling`
- `Wave`
- `Effort`

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
