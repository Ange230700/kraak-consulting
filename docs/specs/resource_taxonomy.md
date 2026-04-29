# Taxonomie des ressources (RES-01)

## Objectif

Définir une taxonomie minimale et stable des ressources pour permettre:

- la saisie cohérente des ressources côté administration;
- le filtrage côté API et clients (web/mobile);
- une base contractuelle partagée entre `@kraak/contracts`, l'API et le schéma Supabase.

## Dimensions retenues

### 1) Type (`resourceType`)

- `link`: ressource accessible via URL externe
- `file`: fichier téléchargeable ou consultable (PDF, DOCX, etc.)
- `video`: contenu vidéo (hébergé ou intégré)
- `document`: contenu éditorial structuré (guide, fiche, note)

### 2) Thème (`resourceTheme`)

- `training`: ressources liées aux contenus de formation
- `project_management`: ressources liées à la gestion de projet
- `immigration`: ressources liées à la mobilité/international/immigration
- `career`: ressources d'orientation et de développement professionnel

### 3) Audience (`resourceAudience`)

- `all`: ressource transversale, visible pour tous les segments
- `young_professionals_students`: jeunes professionnels et étudiants
- `organizations`: entreprises, startups et structures partenaires
- `international_candidates`: personnes intéressées par des opportunités internationales

## Alignement avec les documents de référence

- Segments audience alignés sur `docs/context/mvp_brief.md`.
- Modèle de données aligné sur ARC-04 et le schéma SQL initial.
- Contrats partagés alignés via `packages/contracts/src/enums.ts`, `packages/contracts/src/dto.ts` et `packages/contracts/src/schemas.ts`.

## Critères d'acceptation RES-01 couverts

- types de ressources définis
- thèmes définis
- cibles audience définies
