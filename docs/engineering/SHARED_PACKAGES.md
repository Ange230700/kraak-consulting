---
status: active
owner: platform
last_reviewed: 2026-07-23
source_of_truth: true
---

# Guideline de publication des packages partagés

## Table des matières

- [Guideline de publication des packages partagés](#guideline-de-publication-des-packages-partages)
  - [Principes généraux](#principes-generaux)
  - [Packages existants](#packages-existants)
  - [Structure canonique d'un package](#structure-canonique-dun-package)
    - [Champs obligatoires du package.json](#champs-obligatoires-du-packagejson)
    - [Règles de versioning](#regles-de-versioning)
  - [Tests](#tests)
    - [Exigences](#exigences)
    - [Configuration Vitest](#configuration-vitest)
    - [Exécution](#execution)
  - [Ajouter un nouveau package](#ajouter-un-nouveau-package)
  - [Consommation d'un package interne](#consommation-dun-package-interne)
  - [Anti-patterns à éviter](#anti-patterns-a-eviter)

Ce document décrit les conventions, la structure et le processus de gestion des
packages internes du monorepo KRAAK, situés dans `packages/`.

---

## Principes généraux

- Tous les packages sont **privés** (`"private": true`) et ne sont **pas publiés
  sur npm**.
- La consommation entre packages et applications se fait exclusivement via le
  protocole workspace de pnpm : `"workspace:*"`.
- Chaque package a un périmètre clair et ne doit pas dépasser sa responsabilité
  déclarée.

---

## Packages existants

| Package             | Rôle                                           | Dépendances runtime |
| ------------------- | ---------------------------------------------- | ------------------- |
| `@kraak/tokens`     | Design tokens (couleurs, typo, ombres, rayons) | aucune              |
| `@kraak/contracts`  | Schémas Zod, DTOs, enums partagés              | `zod`               |
| `@kraak/domain`     | Logique métier sans dépendance de framework    | `@kraak/contracts`  |
| `@kraak/api-client` | Helpers typés de consommation d'API            | `@kraak/contracts`  |

---

## Structure canonique d'un package

```mermaid
flowchart TD
    pkg["packages/<nom>/"]
    pkg --> pkgjson["package.json"]
    pkg --> pkgtsconfig["tsconfig.json"]
    pkg --> pkgvitest["vitest.config.ts"]
    pkg --> pkgsrc["src/"]
    pkgsrc --> pkgindex["index.ts - barrel d'export principal"]
    pkgsrc --> pkgmodule["<module>.ts - fichier(s) source"]
    pkgsrc --> pkgspec["<module>.spec.ts - tests unitaires"]
```

### Champs obligatoires du `package.json`

```jsonc
{
  "name": "@kraak/<nom>",
  "version": "0.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "exports": {
    ".": "./src/index.ts",
  },
  "scripts": {
    "clean": "node ../../scripts/clean.mjs",
    "test": "vitest run",
    "test:watch": "vitest",
  },
  "devDependencies": {
    "typescript": "~5.8.3",
    "vitest": "^4.0.8",
  },
}
```

**Variante multi-export** (exemple : `@kraak/tokens`) — ajouter des entrées
nommées dans `exports` :

```jsonc
{
  "exports": {
    ".": "./src/index.ts",
    "./tokens.css": "./src/tokens.css",
  },
}
```

### Règles de versioning

- Tous les packages restent à `0.0.0` tant qu'aucune publication externe n'est
  envisagée.
- Il n'y a pas de changeset ni de tooling de versioning automatique à ce stade.
- Si le besoin de versioning sémantique apparaît, une décision d'architecture
  devra être documentée dans `docs/decisions/` avant d'introduire un outil
  (Changesets, etc.).

---

## Tests

### Exigences

- **Chaque fichier source** (`src/<module>.ts`) doit avoir un fichier de tests
  correspondant (`src/<module>.spec.ts`).
- Le framework de test est **Vitest**.
- Le pattern d'inclusion est `src/**/*.spec.ts` (configuré dans
  `vitest.config.ts`).
- Les tests doivent suivre la discipline TDD (`RED → GREEN → REFACTOR`).

### Configuration Vitest

Chaque package contient un `vitest.config.ts` minimal :

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts'],
  },
});
```

### Exécution

```bash
# nettoyer un package
pnpm --filter @kraak/<nom> clean

# un seul package
pnpm --filter @kraak/<nom> test

# tous les packages
pnpm test:libs
```

> **Attention** : le script `test:libs` utilise des filtres explicites par nom de
> package. Lors de l'ajout d'un nouveau package, mettre à jour ce script dans le
> `package.json` racine.

---

## Ajouter un nouveau package

1. Créer le répertoire `packages/<nom>/` avec la structure canonique ci-dessus.
2. Remplir `package.json` avec les champs obligatoires (voir modèle).
3. Créer `tsconfig.json` qui étend `../../tsconfig.base.json`.
4. Créer `vitest.config.ts` avec le pattern d'inclusion.
5. Créer `src/index.ts` comme barrel d'export.
6. Ajouter au moins un fichier source et son fichier de tests.
7. Ajouter le scope commitlint dans `commitlint.config.js` (clé
   `scope-enum`).
8. Ajouter un filtre `--filter @kraak/<nom>` dans le script `test:libs` du
   `package.json` racine.
9. Exécuter `pnpm install` à la racine pour synchroniser le lockfile.
10. Vérifier que `pnpm test:libs` passe avec le nouveau package inclus.

---

## Consommation d'un package interne

Depuis une application ou un autre package :

```jsonc
// dans le package.json du consommateur
{
  "dependencies": {
    "@kraak/<nom>": "workspace:*",
  },
}
```

Puis importer normalement :

```ts
import { MaFonction } from '@kraak/<nom>';
```

Le protocole `workspace:*` résout toujours vers la version locale du workspace,
sans passer par un registre.

---

## Anti-patterns à éviter

- **Ne pas publier sur npm** sans décision d'architecture validée.
- **Ne pas introduire de dépendance circulaire** entre packages.
- **Ne pas ajouter de dépendance de framework** (Angular, NestJS, etc.) dans un
  package partagé — utiliser `packages/domain/` pour la logique pure et
  `packages/contracts/` pour les types/schémas.
- **Ne pas dupliquer des types** déjà définis dans `@kraak/contracts`.
- **Ne pas créer un package** pour une abstraction utilisée par un seul
  consommateur — préférer un module local.
- **Ne pas oublier les tests** — un package sans couverture de tests ne doit pas
  être considéré comme terminé.
