# Format des annonces et règles de publication MVP (ANN-01)

## Objectif

Définir un format d'annonce stable pour le MVP KRAAK, afin de garantir:

- une saisie homogène côté administration;
- une validation cohérente dans les contrats (`@kraak/contracts`) et les règles domaine (`@kraak/domain`);
- une publication contrôlée selon la cible (`all_participants`, `program`, `cohort`).

## Format annonce MVP

### Champs obligatoires

- `id` (UUID)
- `title` (texte court)
- `body` (texte principal)
- `priority` (`low` | `normal` | `high` | `critical`)
- `audienceType` (`all_participants` | `program` | `cohort` | `custom`)
- `status` (`draft` | `published` | `archived`)
- `createdByUserId`
- `createdAt`
- `updatedAt`

### Champs conditionnels

- `programId`:
  requis pour `audienceType = program` ou `audienceType = cohort`.
- `cohortId`:
  requis pour `audienceType = cohort`.
- `publishedAt`:
  requis pour `status = published` et `status = archived`.

## Règles de publication MVP

### 1) Ciblage audience

- `all_participants`:
  `programId = null` et `cohortId = null`.
- `program`:
  `programId` requis et `cohortId = null`.
- `cohort`:
  `programId` et `cohortId` requis.
- `custom`:
  réservé V1.1+ (hors format de publication MVP).

### 2) Cohérence statut/horodatage

- `draft`:
  `publishedAt` doit rester `null`.
- `published`:
  `publishedAt` est requis.
- `archived`:
  `publishedAt` reste requis (annonce déjà publiée auparavant).

### 3) Priorisation d'affichage

Ordre recommandé dans le feed:

1. `critical`
2. `high`
3. `normal`
4. `low`

Puis tri décroissant par `publishedAt` à priorité égale.

## Alignement avec les sources de référence

- ARC-04: modèle de données `announcement` + contrainte de publication MVP.
- `supabase/migrations/20250718000000_initial_schema.sql`: enum `announcement_priority`, colonne `priority`, contraintes de scope et de publication.
- `packages/contracts/src/{enums,dto,schemas}.ts`: format et validation de contrat.
- `packages/domain/src/announcements.ts`: règles métier pures de validation et de priorisation.

## Critères d'acceptation ANN-01 couverts

- format annonce valide
- règles publication MVP définies
- priorité annonce documentée
