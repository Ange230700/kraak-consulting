> **Status:** Historical.
> This document does not define the current process.
> Active reference: [ISSUE_TEMPLATE](../../../.github/ISSUE_TEMPLATE/)

# Pack GitHub CLI - Rework Du Project MVP

Ce document ne sert plus a recréer en masse une deuxième famille d'issues.

Objectif désormais :

- repartir d'une seule famille d'issues canonique `[EPIC][ID]` / `[TASK][ID]`
- remettre le GitHub Project en phase avec le backlog MVP
- piloter le travail a deux avec `Lane / Surface / Coupling / Wave`

Reference principale :

- `docs/planning/GITHUB_PROJECT.md`
- `docs/archive/historical-planning/github_project_bootstrap_mvp_2026-04.csv`

Convention de lecture a conserver :

- dans le CSV d'import, `Status = backlog`
- dans le champ natif GitHub Project, l'equivalent opérationnel est
  `Status = Todo`
- la correspondance attendue est donc : `backlog -> Todo`

---

## Règle Importante

Ne pas relancer un script de creation brute des tasks si les issues existent
deja. Le problème actuel n'est pas l'absence d'issues ; c'est la coexistence de
deux plans concurrents sur le board.

Priorité :

1. retirer les items legacy du project
2. ajouter les issues canoniques manquantes
3. appliquer les champs de pilotage duo

---

## Prérequis

1. `gh auth status`
2. accès au project `#6`
3. accès écriture au dépôt `Ange230700/kraak-consulting`

---

## Commandes De Base

### Lister les items du project

```bash
gh project item-list 6 --owner "@me" --limit 200 --format json
```

### Ajouter une issue manquante au project

```bash
gh project item-add 6 --owner "@me" --url https://github.com/Ange230700/kraak-consulting/issues/75
```

### Retirer un item legacy du project

```bash
gh project item-delete 6 --owner "@me" --id <project-item-id>
```

### Lister les champs du project

```bash
gh project field-list 6 --owner "@me"
```

### Créer un champ single-select

```bash
gh project field-create 6 \
  --owner "@me" \
  --name "Lane" \
  --data-type "SINGLE_SELECT" \
  --single-select-options "Lane A - Web public,Lane B - Platform & participant,Shared handoff"
```

---

## Champs Duo Du Board

### `Lane`

- `Lane A - Web public`
- `Lane B - Platform & participant`
- `Shared handoff`

### `Surface`

- `docs`
- `shared`
- `api`
- `web`
- `mobile`
- `qa`
- `ops`

### `Coupling`

- `independent`
- `handoff`
- `paired`
- `portfolio`

### `Wave`

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

---

## Script Type De Migration

Pseudo-sequence a suivre :

1. exporter les items actuels du project
2. retirer du project les anciennes issues `#1` a `#38`
3. ajouter toutes les issues canoniques manquantes
4. renseigner les champs a partir de
   `docs/archive/historical-planning/github_project_bootstrap_mvp_2026-04.csv`
5. verifier les vues `Lane A`, `Lane B`, `Shared handoff`

---

## Decision D'Usage

Pour les prochaines mises à jour :

- ne plus maintenir un pack de création séparé du backlog canonique
- utiliser le CSV duo-ready comme référence de board
- utiliser les templates d'issues seulement pour les nouvelles tâches hors pack,
  après validation produit
