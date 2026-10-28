---
status: active
owner: platform
last_reviewed: 2026-10-28
source_of_truth: true
---

# Audit du moteur documentaire

## Table des matières

- [Audit du moteur documentaire](#audit-du-moteur-documentaire)
  - [Périmètre et choix](#perimetre-et-choix)
  - [Matrice des capacités](#matrice-des-capacites)
  - [Référence et attribution](#reference-et-attribution)
  - [Baseline](#baseline)

## Périmètre et choix

Inspection du moteur KRAAK sur `0e303aea`, des tests existants et des modules
`artifacts`, `presentations`, `cli` et `validation` du template Coursera local.
Le moteur reste dans `scripts/` : extraire des modules spécialisés évite un
second moteur et un package sans consommateur applicatif. Conserver Marked,
Playwright et PptxGenJS ; ne pas ajouter Puppeteer ni un second navigateur.
Les documents de pilotage, ADR, runbooks et références restent canoniques.
Le français est la langue documentaire ; les exports acceptent `fr-CI` et `en-GB`.

## Matrice des capacités

| Capacité        | Existant                                | Manquant                                 | Implémentation proposée                             | Validation                                 |
| --------------- | --------------------------------------- | ---------------------------------------- | --------------------------------------------------- | ------------------------------------------ |
| Modèle Markdown | Tokens Marked, sections, images locales | Modèle partagé versionné, langue         | Enrichir le modèle existant                         | Tests de structure et métadonnées          |
| TXT             | UTF-8, accents, tableaux, code          | Narration dédiée                         | Mode TTS distinct, alternatives explicites          | Comparaison octet par octet                |
| Mermaid         | Détection et refus visuel               | Rendu et cache                           | Navigateur Playwright existant, SVG et PNG          | Double rendu, corruption, syntaxe invalide |
| PDF             | A4, balises, liens, figures             | Vérification indépendante                | PDF.js et assertions issues du modèle               | Texte, structure, liens, pages             |
| PPTX            | Texte éditable, pagination, notes       | OOXML indépendant, tableaux natifs       | Spécification de diapositives et inspection ZIP/XML | Relations, contenu, notes, limites         |
| QA visuelle     | Absente                                 | Pages, slides, contact sheets            | PDF.js, canvas, LibreOffice optionnel               | Compteurs, densité, preuves PNG            |
| Provenance      | SHA-256 source et sortie                | Identités de configuration, vérification | Manifestes versionnés et publication validée        | Source obsolète, dérivé corrompu           |
| CLI/CI          | Export et tests Docs Quality            | Plan, verify, visual QA                  | Étendre les commandes existantes                    | Tests CLI et job QA dédié                  |

## Référence et attribution

Référence architecturale :
[coursera-program-notes-template](https://github.com/Ange230700/coursera-program-notes-template).
Patterns retenus : identité de rendu dépendant de la configuration, cache contrôlé
par empreintes, vérification indépendante, séparation structure/QA visuelle et
exécution séquentielle. Ne pas importer les manifestes de cours ni leurs versions
d'outils. Le fichier `LICENSE.template` contient des placeholders ; aucune copie
de code du template n'est nécessaire. Les modules KRAAK sont écrits pour son
modèle et ses dépendances existantes.

## Baseline

Le premier lancement des deux suites échoue avant les tests : `marked` et `sharp`
ne sont pas installés dans le worktree. Ce résultat n'est pas un défaut fonctionnel
prouvé ; installer le lockfile puis relancer les suites avant les modifications.
Après installation du lockfile, les 20 tests historiques passent (code 0).
La référence inspectée est le commit `f4d04561ef6bac007c770b6928ba67241fcb72ab`.
La politique Marp reste applicable aux sources `docs/reference/*.marp.md`.
L'automatisation des diagrammes dans les documents ordinaires ne la remplace pas.
