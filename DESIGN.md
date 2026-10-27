---
status: active
owner: platform
last_reviewed: 2026-10-27
source_of_truth: true
---

# Design KRAAK

## Table des matières

- [Design KRAAK](#design-kraak)
  - [Intention](#intention)
  - [Principes visuels](#principes-visuels)
  - [Identité visuelle](#identite-visuelle)
  - [Typographie et mise en page](#typographie-et-mise-en-page)
  - [Composants et interactions](#composants-et-interactions)
  - [Images et mouvement](#images-et-mouvement)
  - [Accessibilité et adaptation](#accessibilite-et-adaptation)
  - [Sources de référence](#sources-de-reference)

Ce document décrit le langage visuel actif de KRAAK pour ses interfaces web et
mobile. Il complète les règles d’architecture sans les remplacer. Les valeurs
techniques partagées sont définies dans
[`packages/tokens/src/tokens.css`](packages/tokens/src/tokens.css) et doivent y
être modifiées plutôt que dupliquées ici.

## Intention

L’expérience KRAAK doit exprimer un accompagnement professionnel, humain et
tourné vers des opportunités concrètes. Elle associe la crédibilité d’une
organisation structurée à l’énergie de l’apprentissage, de l’autonomie et de
l’ouverture internationale.

Le design sert d’abord à informer, rassurer et orienter vers une action utile.
Il ne doit pas prendre le pas sur les contenus ni promettre des résultats qui
ne sont pas démontrés.

## Principes visuels

- **Clarté avant décoration :** hiérarchie lisible, contenus concis et parcours
  faciles à comprendre.
- **Confiance sans froideur :** structure professionnelle, ton accessible et
  visuels humains.
- **Ambition mesurée :** mettre en valeur la progression et l’impact avec des
  preuves crédibles, sans surcharge ni promesse exagérée.
- **Cohérence :** réutiliser les jetons, composants et motifs existants plutôt
  que créer des styles ponctuels.
- **Mobile d’abord :** préserver la lisibilité et l’accès aux actions sur les
  petits écrans.

## Identité visuelle

La palette est définie par les jetons partagés. Le bleu marine ancre les
éléments de structure et la typographie ; le bleu et le cyan portent les accents
et les actions ; le doré reste un accent ponctuel. Les surfaces claires et les
neutres maintiennent une bonne respiration.

| Rôle                  | Jeton de référence | Usage                                                 |
| --------------------- | ------------------ | ----------------------------------------------------- |
| Structure et identité | `--kr-brand-navy`  | Titres, navigation et éléments de marque              |
| Accent bleu           | `--kr-brand-blue`  | Liens et éléments d’action                            |
| Accent cyan           | `--kr-brand-cyan`  | Mise en évidence et détails d’interface               |
| Accent doré           | `--kr-brand-gold`  | Repères ponctuels, jamais comme couleur dominante     |
| Surface de page       | `--kr-brand-page`  | Fond général et alternance avec les surfaces blanches |
| Texte et neutres      | `--kr-neutral-*`   | Texte, bordures et niveaux de surface                 |

Utiliser le logo fourni sans le déformer, le recolorer ni lui ajouter d’effet.
Conserver autour de lui un espace suffisant pour qu’il reste identifiable.

## Typographie et mise en page

La famille sans empattement partagée est définie par `--kr-font-sans`. Utiliser
une hiérarchie nette : titres courts et distincts, paragraphes confortables à
lire, et libellés d’action explicites. Éviter les longs blocs compacts et les
variations typographiques décoratives.

Privilégier une grille simple, des sections aérées et un espacement cohérent.
Les alignements et largeurs de lecture doivent faciliter le balayage visuel et
rester adaptés aux écrans étroits.

## Composants et interactions

- **Actions :** un CTA principal clairement identifiable par zone. Les boutons
  principaux utilisent le traitement bleu-cyan défini dans les styles globaux
  web ; les variantes secondaires ou discrètes ne doivent pas lui faire
  concurrence.
- **Cartes :** les réserver aux contenus qui bénéficient d’un regroupement
  visuel. Garder leur contenu court, leur surface claire et leur séparation
  discrète.
- **Navigation et liens :** rendre les destinations et les états actifs
  compréhensibles, sans s’appuyer uniquement sur la couleur.
- **États interactifs :** fournir des états visibles au survol, au focus clavier,
  à l’activation et, le cas échéant, au chargement ou à l’erreur.
- **Style d’implémentation :** utiliser Tailwind CSS et les composants PrimeNG
  sur le web, Ionic sur mobile, et les jetons partagés. Ne pas ajouter de style
  en ligne ni de feuille de style dédiée à une page ou à un composant Angular.

## Images et mouvement

Choisir des images lumineuses et naturelles qui montrent l’apprentissage, la
collaboration, l’accompagnement et le travail en contexte. Éviter les visuels
stéréotypés, artificiels ou déconnectés des publics de KRAAK. Les images doivent
avoir un texte alternatif utile lorsqu’elles transmettent une information ;
les images purement décoratives restent ignorées par les technologies
d’assistance.

Les animations restent courtes et discrètes. Elles soutiennent la compréhension
ou le retour d’interaction, sans retarder l’accès au contenu. Respecter
`prefers-reduced-motion` et garantir que l’interface reste utilisable lorsque
les animations sont réduites.

## Accessibilité et adaptation

- Vérifier le contraste du texte, des contrôles et des états dans leurs contextes
  d’usage.
- Rendre toutes les actions accessibles au clavier, avec un indicateur de focus
  visible et un ordre de tabulation logique.
- Ne pas utiliser la couleur comme seul moyen de communiquer un état ou une
  distinction.
- Employer des libellés explicites, des titres structurés et des alternatives
  textuelles adaptées.
- Vérifier les mises en page et les interactions sur mobile, tablette et grand
  écran, sans défilement horizontal injustifié.

## Sources de référence

- [`packages/tokens/src/tokens.css`](packages/tokens/src/tokens.css) : source
  canonique des couleurs, familles typographiques, rayons et ombres.
- [`apps/client/projects/web/src/tailwind.css`](apps/client/projects/web/src/tailwind.css) :
  styles globaux, composants visuels et préférences de mouvement du web.
- [`docs/architecture/WEB.md`](docs/architecture/WEB.md) :
  contraintes d’implémentation de l’interface web.
- [`docs/reference/STYLE_GUIDE.md`](docs/reference/STYLE_GUIDE.md) :
  support de conception historique non autoritaire.
