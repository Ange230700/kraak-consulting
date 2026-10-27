---
status: active
owner: platform
last_reviewed: 2026-10-28
source_of_truth: true
---

# Design KRAAK

## Table des matières

- [Design KRAAK](#design-kraak)
  - [Intention](#intention)
  - [Principes de conception](#principes-de-conception)
  - [Identité visuelle](#identite-visuelle)
  - [Composition et composants](#composition-et-composants)
  - [Images et illustration](#images-et-illustration)
  - [Accessibilité et adaptation](#accessibilite-et-adaptation)
  - [Implémentation](#implementation)
  - [Références](#references)

Ce document définit les principes visuels actifs de KRAAK. Il complète le
périmètre produit et l’architecture sans remplacer leurs décisions.

## Intention

Le design doit présenter KRAAK comme une organisation professionnelle,
ambitieuse et accessible, qui transforme l’accompagnement en opportunités
concrètes. L’expérience doit inspirer confiance sans paraître froide ou
administrative, et rester simple à parcourir sur tous les écrans.

## Principes de conception

- **Clarté avant décoration :** une hiérarchie visuelle nette, des titres
  explicites et des contenus découpés en sections faciles à parcourir.
- **Confiance et proximité :** un ton humain, des preuves crédibles et des
  visuels qui montrent des personnes en situation réelle.
- **Action utile :** chaque page aide à comprendre une offre, à choisir une
  prochaine étape ou à contacter KRAAK. Les appels à l’action restent visibles
  et leurs libellés décrivent le résultat attendu.
- **Cohérence :** réutiliser les couleurs, la typographie, les espacements et
  les composants communs plutôt que créer une variante sans besoin établi.

## Identité visuelle

Le logo officiel est utilisé sans modification de couleur, de proportions ni
d’effets. Préserver son espace de respiration et choisir une variante lisible
sur le fond concerné.

Les couleurs ci-dessous sont définies dans
[`packages/tokens/src/tokens.css`](packages/tokens/src/tokens.css) ; ce fichier
de tokens est la référence pour leurs valeurs dans le code.

| Rôle                       | Jeton             | Valeur                  | Usage                                           |
| -------------------------- | ----------------- | ----------------------- | ----------------------------------------------- |
| Structure et identité      | `--kr-brand-navy` | `#122b4a`               | Navigation, titres structurants et marque       |
| Liens et accent secondaire | `--kr-brand-blue` | `#1673ae`               | Liens et éléments d’interface mis en avant      |
| Accent léger               | `--kr-brand-cyan` | `#4cc3d9`               | Détails et états actifs, avec contraste vérifié |
| Accent de valeur           | `--kr-brand-gold` | `#f0c433`               | Mise en évidence ponctuelle                     |
| Fond de page               | `--kr-brand-page` | `#f3f3f3`               | Fonds clairs et sections alternées              |
| Texte et surfaces          | `--kr-neutral-*`  | Échelle dans les tokens | Texte, bordures et surfaces neutres             |

Privilégier les fonds clairs et limiter les accents concurrents. Le bleu marine
structure l’interface ; le cyan et l’or restent secondaires. Ne pas utiliser
une couleur seule pour transmettre un état.

La famille typographique partagée est définie par `--kr-font-sans` :
Poppins, puis les polices système de repli. Maintenir une hiérarchie évidente
entre titres, texte courant, libellés et métadonnées ; le confort de lecture
prime sur une taille décorative.

## Composition et composants

- Concevoir d’abord pour les petits écrans, puis répartir les contenus en
  colonnes lorsque l’espace le permet.
- Garder des lignes de texte et des sections faciles à lire, avec des
  espacements réguliers et généreux.
- Utiliser des boutons clairement différenciés : une action principale par zone
  importante, puis des actions secondaires moins saillantes. Les boutons
  principaux utilisent le traitement bleu-cyan défini dans les styles globaux
  web.
- Prévoir des états visibles au survol, au focus clavier et à l’activation,
  ainsi qu’au chargement ou à l’erreur lorsque ces états s’appliquent. Les
  destinations des liens et les éléments de navigation actifs restent
  compréhensibles sans dépendre uniquement de la couleur.
- Réserver les cartes aux contenus réellement distincts — services, programmes
  ou preuves — et conserver une structure simple et répétable.
- Structurer les pages par une introduction claire, un contenu principal
  hiérarchisé et une prochaine étape explicite.

## Images et illustration

Choisir des images lumineuses et cohérentes qui expriment l’apprentissage, la
collaboration, le mentorat, l’autonomie et l’ouverture internationale. Favoriser
les scènes crédibles plutôt que les visuels de banque d’images artificiels.
Utiliser les illustrations avec retenue et ne pas altérer les ressources de
marque.

Les animations restent courtes et discrètes : elles soutiennent la compréhension
ou le retour d’interaction sans retarder l’accès au contenu. Respecter
`prefers-reduced-motion` et garantir que l’interface reste utilisable lorsque
les animations sont réduites.

## Accessibilité et adaptation

- Assurer un contraste lisible pour le texte, les contrôles et les états
  interactifs.
- Rendre toutes les actions utilisables au clavier et afficher un indicateur de
  focus visible.
- Fournir des libellés accessibles aux contrôles et un texte alternatif utile
  aux images porteuses d’information ; laisser les images décoratives hors du
  parcours de lecture.
- Respecter les préférences de réduction des animations et éviter de faire
  dépendre la compréhension d’un effet visuel.
- Vérifier les pages et composants sur des largeurs d’écran variées avant leur
  livraison.

## Implémentation

Les surfaces client partagent les jetons de `packages/tokens`. Le web utilise
Angular, PrimeNG et Tailwind CSS ; le mobile utilise Ionic Angular, Capacitor et
Tailwind CSS. Les composants et pages Angular utilisent des templates séparés
et des classes utilitaires : pas de styles en ligne ni de feuilles de style
propres aux composants.

Toute évolution des décisions de design doit rester compatible avec le MVP et
être répercutée dans les jetons ou les composants partagés lorsque cela
s’applique.

## Références

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — stack et décisions d’architecture.
- [`docs/architecture/WEB.md`](docs/architecture/WEB.md) — contrat de la
  surface web.
- [`docs/product/MVP_SCOPE.md`](docs/product/MVP_SCOPE.md) — publics, objectifs
  et portée produit.
- [`packages/tokens/src/tokens.css`](packages/tokens/src/tokens.css) — valeurs
  canoniques des jetons partagés.
- [`apps/client/projects/web/src/tailwind.css`](apps/client/projects/web/src/tailwind.css) —
  styles globaux, boutons et préférences de mouvement du web.
- [`docs/reference/STYLE_GUIDE.md`](docs/reference/STYLE_GUIDE.md) — support de
  référence non autoritaire.
