---
status: active
owner: platform
last_reviewed: 2026-10-28
source_of_truth: true
---

# Exports documentaires

## Table des matières

- [Exports documentaires](#exports-documentaires)
  - [Principe](#principe)
  - [Installation](#installation)
  - [Commandes](#commandes)
  - [Écriture canonique](#ecriture-canonique)
  - [Narration](#narration)
  - [Mermaid](#mermaid)
  - [PDF et PowerPoint](#pdf-et-powerpoint)
  - [Provenance et publication](#provenance-et-publication)
  - [Vérification et QA visuelle](#verification-et-qa-visuelle)
  - [Validation locale et CI](#validation-locale-et-ci)

## Principe

Le Markdown canonique est la seule source. Le moteur `scripts/artifacts/` étend
le point d'entrée historique `scripts/export-docs.mjs`. Aucun export ne modifie
la source ni ne contacte un service distant. Voir
[l'audit initial](ARTIFACT_ENGINE_AUDIT.md).

## Installation

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
```

Sous Linux : `pnpm exec playwright install --with-deps chromium`.
Playwright 1.59.1 fournit le navigateur commun au PDF et à Mermaid 11.12.0 ;
aucune installation de Puppeteer n'est nécessaire. Les dépendances de vérification
sont verrouillées : PDF.js 5.4.624, canvas 0.1.100, JSZip 3.10.1 et xmldom 0.8.15.
LibreOffice est optionnel, uniquement pour la QA visuelle PPTX. Installer Impress
et les polices Liberation sur Linux. Sous Windows, le chemin par défaut est
`C:/Program Files/LibreOffice/program/soffice.com`. `LIBREOFFICE_PATH` permet un
chemin explicite. Chaque conversion utilise un profil temporaire isolé et un
processus sans fenêtre. La version effective est enregistrée dans le rapport.

## Commandes

```bash
pnpm docs:plan --source README.md --format all
pnpm docs:export --source README.md --format all
pnpm docs:export --source README.md --format pdf
pnpm docs:export --source README.md --format pptx
pnpm docs:export --source README.md --format txt
pnpm docs:export --source scripts/artifacts/fixtures/document-fr.md --format tts --chunk-size 4000
pnpm docs:verify --source scripts/artifacts/fixtures/document-fr.md --format all
pnpm docs:visual-qa --source scripts/artifacts/fixtures/document-fr.md --format all
pnpm docs:export --source README.md --format all --operation provenance
pnpm docs:export --help
```

`all` conserve les trois formats historiques TXT/PDF/PPTX. Le format `tts` est
explicite, car ses exigences d'alternatives sont plus strictes. `--dry-run` est un
alias de `--operation plan`. Les opérations possibles sont `generate`, `plan`,
`verify`, `visual-qa`, `provenance`. Une erreur retourne le code 1, jamais un
succès de substitution. Entourer les chemins avec espaces de guillemets.
`--output` remplace la racine `.artifacts/docs`, sans supprimer le sous-dossier
portant le nom du document. Pour des sources homonymes, utiliser des racines
distinctes. Ne pas lancer plusieurs générations sur une même destination.

## Écriture canonique

Les titres, paragraphes, listes, tableaux GFM, liens et images locales sont
analysés via les tokens Marked. Les métadonnées plates entre deux lignes `---`
en tête sont exclues du rendu ; les séparateurs ordinaires restent du Markdown.
Les métadonnées imbriquées YAML ne sont pas prises en charge : conserver les
conventions plates du dépôt. `lang: fr-CI` est la valeur par défaut ; `en-GB` est
également accepté. Une autre langue déclarée est rejetée.
Le HTML brut et les commentaires HTML sont exclus. Les images doivent rester
dans le dépôt après résolution des liens symboliques. Les images distantes sont
refusées. Les liens restent cliquables dans le PDF, y compris les ancres de titres.

## Narration

Le TXT historique conserve le code et les marqueurs de liste. Le fichier
`<nom>.tts.txt` fournit une narration UTF-8/LF : libellés de liens sans destinations,
listes en paragraphes, tableaux en paires colonne/valeur, texte source sans
paraphrase. Les liens affichant uniquement une URL deviennent « lien » ou « link ».
Les titres restent des titres lisibles séparés par une ligne vide ; aucune
transition factuelle n'est inventée.

Pour un bloc de code, fournir une alternative dans la ligne d'ouverture,
par exemple `js narration: Le statut de cet exemple est prêt.`.
Pour Mermaid, renseigner `accDescr:` dans le diagramme. Sans alternative, le TTS
échoue explicitement. L'API `renderNarration` accepte aussi un dictionnaire
`codeAlternatives` indexé par SHA-256 du bloc. Les termes techniques sont conservés,
sans dictionnaire de prononciation implicite. Aucune API ElevenLabs n'est utilisée.

Le découpage optionnel conserve les paragraphes entiers et leur ordre. Un
paragraphe dépassant la taille demandée reste entier ; le manifeste des segments
signale ces dépassements. Les segments se trouvent dans `narration/`, avec leurs
empreintes. `docs:verify` contrôle leur contenu et leur ordre. Une nouvelle
génération TTS supprime les anciens segments dans le dossier de travail temporaire
pour ne pas conserver de segments périmés après publication.

## Mermaid

Le moteur extrait les blocs Mermaid, y compris dans les listes et citations.
Chaque diagramme possède une identité de position et une empreinte du contenu.
Le rendu utilise une configuration KRAAK stricte, sans HTML interactif, réseau,
configuration intégrée ou directives `click`. Fournir le type de diagramme avant
`accTitle:` et `accDescr:`. Le SVG primaire et son PNG sont mis en cache selon le
contenu, la configuration, les versions du moteur/navigateur et la plateforme.
Les empreintes, le XML SVG et les dimensions sont contrôlés avant réutilisation.
Un cache incomplet ou corrompu est régénéré avec une trace de diagnostic.
La normalisation SVG versionnée préserve les espaces entre mots lors de la
conversion PNG. Les diagrammes des listes imbriquées deviennent aussi des figures
dans la présentation dérivée.

Les exports ordinaires substituent les figures dans une représentation dérivée,
sans remplacer les blocs dans le Markdown. La règle existante pour
`docs/reference/*.marp.md` reste inchangée : rendre les assets dans
`docs/reference/diagrams/` et exporter le Marp basé sur des images. Le moteur refuse
le Mermaid brut dans une source `.marp.md`.

## PDF et PowerPoint

Le PDF Chromium est A4, balisé, avec métadonnées de titre/langue, tableaux et
figures légendées. PDF.js relit chaque sortie et vérifie les blocs sémantiques dans
l'ordre, les répétitions de blocs substantiels, les liens, les images et les
structures balisées, dont la séquence des niveaux de titres. Les structures
prouvées ne constituent **pas** une
certification PDF/UA. L'ordre de lecture complexe, l'utilité des alternatives et
l'accessibilité complète nécessitent une expertise humaine.

Le PPTX PptxGenJS utilise une spécification indépendante du PDF : texte natif,
tableaux natifs jusqu'à six colonnes et cellules de 120 caractères, puis repli
explicite en texte éditable pour les tableaux plus complexes. Les lignes sont
réparties sur plusieurs slides ; les diagrammes restent des images PNG, avec
SVG réutilisable conservé. Il n'y a pas de conversion automatique Mermaid en
formes natives. Les notes contiennent le texte de chaque slide et l'empreinte de
la source. Le texte long est paginé sans résumé automatique. Les images locales
ont leurs propres slides après le contenu.

JSZip et xmldom contrôlent CRC, XML, relations internes, ressources orphelines,
ordre et nombre de slides, texte éditable, tableaux, images, notes et limites
physiques des objets. Les collisions et débordements internes de zones de texte
ne sont pas entièrement démontrables par OOXML ; la QA visuelle complète ce contrôle.

## Provenance et publication

Les sorties se trouvent dans `.artifacts/docs/<nom>/` :

- `<nom>.txt`, `<nom>.tts.txt`, `<nom>.pdf`, `<nom>.pptx` et leurs compagnons JSON ;
- `manifest.json`, `presentation.json`, `diagrams/` et `verification/` ;
- `visual-qa/pdf/` et `visual-qa/pptx/`, avec PNG, planches contact et rapports.

Les compagnons incluent SHA-256 source/sortie, version du modèle, identité du code
et du lockfile, versions du moteur et ressources. Les clés sont sérialisées par
ordre binaire UTF-8 indépendant de la locale. Une source, image, configuration
ou sortie obsolète fait échouer `docs:verify`. Les rapports d'exécution n'ajoutent
pas d'horodatage à l'identité stable. Le manifeste décrit la génération demandée ;
les compagnons des autres formats restent disponibles et doivent être revérifiés.

La CLI travaille dans un dossier frère temporaire et ne publie qu'après
vérification de tous les formats demandés. Elle restaure le dossier précédent si
la publication échoue. Les renommages Windows temporairement bloqués ont un
nombre limité de nouvelles tentatives. Une interruption brutale de l'OS entre
renommages peut laisser un dossier `.backup-*` récupérable : aucun protocole
multi-fichier ne prétend offrir une transaction disque résistante à toute panne.

TXT/TTS et SVG sont comparés octet par octet sous entrées, versions, polices et
plateforme identiques. Les PDF/PPTX ont des métadonnées internes volatiles : leur
reproductibilité porte sur le texte, l'ordre et la structure, pas sur les octets.
Changer les polices système ou LibreOffice peut changer les pixels ; conserver
l'environnement et consulter les versions du rapport pour comparer des preuves.

## Vérification et QA visuelle

La vérification structurelle n'utilise pas LibreOffice. La QA PDF rasterise chaque
page à 108 DPI ; la QA PPTX convertit via LibreOffice puis rasterise les slides.
Elle compare le texte et le nombre de slides au modèle, compte les pixels encrés,
signale les pages presque vides et refuse les pages vides ou les textes mesurés
hors page. Les planches sont découpées par groupes de douze, dans l'ordre.
Des preuves partielles sont conservées dans un dossier `.failed-*` si la QA échoue.
Une QA réussie remplace son dossier de preuves pour supprimer les anciennes pages
et planches devenues inutiles ; un échec conserve les preuves valides précédentes.
Une alerte de faible densité mérite une revue humaine ; une page de couverture
peut être intentionnellement peu remplie. Les métriques ne prouvent pas une mise
en page parfaite.

## Validation locale et CI

```bash
pnpm test:docs:export
pnpm test:docs:export:integration
pnpm docs:export --source scripts/artifacts/fixtures/document-fr.md --format all
pnpm docs:export --source scripts/artifacts/fixtures/document-fr.md --format tts
pnpm docs:verify --source scripts/artifacts/fixtures/document-fr.md --format all
pnpm docs:visual-qa --source scripts/artifacts/fixtures/document-fr.md --format all
```

Les tests couvrent les régressions historiques, sources bilingues, Unicode,
ressources locales, chemins avec espaces, cache corrompu, erreurs Mermaid,
provenance obsolète, sorties corrompues et double génération. Les scénarios sont
nommés Given/When/Then. `Docs Quality` exécute les tests et un job visuel séparé
sous Ubuntu 24.04, avec LibreOffice et ses polices explicitement installés. Le
lockfile épingle les bibliothèques ; les paquets système suivent les correctifs
de cette distribution et leur version effective est enregistrée. Les preuves
visuelles sont téléversées même en cas d'échec. Aucun secret de production,
compte ElevenLabs, Render ou Supabase n'est requis.
