---
status: active
owner: platform
last_reviewed: 2026-10-25
source_of_truth: true
---

# Exports documentaires

## Table des matières

- [Exports documentaires](#exports-documentaires)
  - [Principe](#principe)
  - [Installation](#installation)
  - [Commandes](#commandes)
  - [Rendu et limites](#rendu-et-limites)
  - [Vérification](#verification)

## Principe

Le Markdown reste la source canonique. La commande `pnpm docs:export` produit
localement ses dérivés, sans modifier le document ni appeler un service externe :

| Format | Usage                                                                             |
| ------ | --------------------------------------------------------------------------------- |
| PDF    | Document A4 avec titres, listes, tableaux et illustrations locales                |
| PPTX   | Présentation avec texte éditable, pagination automatique et notes de présentation |
| TXT    | Texte UTF-8 à relire pour préparer une narration audio                            |

Le format de transcript est **TXT**, et non TTX. Aucun fichier MP3 n'est généré :
la synthèse vocale, le choix d'une voix et les services payants restent hors de ce
workflow. Le TXT conserve notamment le code et transforme les lignes de tableaux
en paires « colonne : valeur » ; il ne réécrit pas le contenu en script oral.

## Installation

Utiliser les versions Node.js et pnpm du dépôt :

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
```

Chromium est nécessaire uniquement au PDF. Sur un hôte Linux sans dépendances
système de navigateur, utiliser `pnpm exec playwright install --with-deps chromium`.
TXT et PPTX fonctionnent sans navigateur, sans PowerPoint et sans LibreOffice.

## Commandes

```bash
pnpm docs:export --source README.md --format all
pnpm docs:export --source README.md --format pdf
pnpm docs:export --source README.md --format pptx
pnpm docs:export --source README.md --format txt --output .artifacts/narration
```

Les chemins contenant des espaces doivent être entourés de guillemets. Sous
Windows, les chemins avec antislashs sont également acceptés.

Par défaut, les sorties sont placées dans
`.artifacts/docs/<nom>/<nom>.{pdf,pptx,txt}`. `--output` remplace le dossier
`.artifacts/docs`, pas le nom du fichier. Pour deux sources portant le même nom,
choisir des dossiers de sortie distincts pour éviter un remplacement.

Chaque fichier possède un compagnon `<fichier>.json` contenant le chemin source,
son empreinte SHA-256, l'empreinte du dérivé, le format et la date de génération.
Les sorties sous `.artifacts/` sont ignorées par Git ; ne pas les modifier comme
sources ni les commiter. Les empreintes permettent de vérifier l'identité du
contenu, mais ne garantissent pas des PDF/PPTX binaires identiques entre deux
générations.

## Rendu et limites

Les métadonnées YAML en tête et les commentaires HTML ne sont pas exportés.
Le bloc de métadonnées reconnu est délimité par deux lignes `---` en tête du
fichier et contient uniquement des paires plates `clé: valeur` non vides,
des lignes vides ou des commentaires YAML. Les autres blocs sont conservés
comme contenu Markdown, notamment les séparateurs ordinaires.
Le HTML brut n'est pas rendu ; privilégier les constructions Markdown. Les liens
restent cliquables dans le PDF, y compris les liens vers les titres du sommaire.
Les identifiants de titres réutilisent la normalisation et le dédoublonnage du
générateur de sommaires du dépôt. Le TXT et le PPTX conservent le libellé des liens.

Le PPTX est une adaptation documentaire, pas une reproduction d'une maquette
Marp : une diapositive de titre précède les sections, les textes longs sont
répartis sur plusieurs diapositives et les illustrations sont regroupées en fin
de présentation. Les tableaux deviennent du texte éditable. Les notes
contiennent le texte de chaque diapositive.

Les illustrations doivent être des fichiers locaux du dépôt, référencés
relativement au document. Elles sont converties en PNG puis intégrées aux exports
visuels. Les images distantes ou hors du dépôt et les fichiers manquants
provoquent une erreur explicite ; aucun téléchargement distant n'est effectué.
Le TXT conserve uniquement leur légende.

Les blocs Mermaid bruts sont refusés pour PDF et PPTX : rendre d'abord les
diagrammes en SVG ou PNG puis remplacer les blocs par des images Markdown,
conformément à `AGENTS.md`. Le TXT peut conserver leur source. Aucun moteur
Mermaid ni traitement spécial des directives Marp n'est ajouté ici.

Un échec produit un message dans la console et un code de sortie non nul. Avec
`--format all`, les formats sont générés dans l'ordre TXT, PDF, PPTX : un fichier
déjà généré reste disponible si le format suivant échoue.

## Vérification

```bash
pnpm test:docs:export
pnpm test:docs:export:integration
```

Le premier contrôle fonctionne sans navigateur. Le second nécessite Chromium et
vérifie réellement les trois formats, les illustrations et les empreintes. Ces
deux contrôles sont exécutés dans le workflow `Docs Quality`.

Relire le PDF, les diapositives et le transcript avant diffusion, notamment les
tableaux longs, les titres et la prononciation du contenu technique. Toute
synthèse vocale ultérieure exige une décision explicite sur les données
transmises et le fournisseur.
