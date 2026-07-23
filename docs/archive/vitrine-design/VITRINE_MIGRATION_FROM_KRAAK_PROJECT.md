> **Status:** Historical.
> This document does not define the current process.
> Active reference: [CONTENT_DRAFT](../../reference/CONTENT_DRAFT.md)

# Migration vitrine depuis shadracirie8-crypto/kraak_project

## Contexte

Ce document sert de plan de reprise des éléments intéressants de la proposition
réalisée dans le dépôt `shadracirie8-crypto/kraak_project` vers ce dépôt
`kraak-consulting`, en conservant strictement la stack cible actuelle :

- Front : Angular + PrimeNG + Tailwind (`apps/client/projects/web`)
- API : NestJS (`apps/api`)
- Conventions KRAAK (français pour contenus, anglais pour éléments de code)

Objectif : reproduire les points forts de la vitrine sans importer la structure
technique Django/Tailwind CDN de l'autre dépôt.

## Sources externes observées

Pages vitrine repérées dans `shadracirie8-crypto/kraak_project` :

- `templates/base.html`
- `templates/home.html`
- `templates/about.html`
- `templates/services.html`
- `templates/details_service.html`
- `templates/contact.html`

## Mapping vers ce dépôt

### Cibles Angular existantes

- `apps/client/projects/web/src/app/features/home/home.page.html`
- `apps/client/projects/web/src/app/features/about/about.page.html`
- `apps/client/projects/web/src/app/features/services/services.page.html`
- `apps/client/projects/web/src/app/features/contact/contact.page.html`
- `apps/client/projects/web/src/app/layouts/navbar/navbar.component.html`
- `apps/client/projects/web/src/app/layouts/footer/footer.component.html`

### État rapide

La base vitrine Angular est déjà solide et couvre l'essentiel des sections
marketing. Les écarts observés concernent surtout des blocs d'identité visuelle
et d'engagement présents dans la proposition Django.

## Éléments à reprendre (priorisés)

## P1 - Forte valeur vitrine

1. Bloc "Pourquoi choisir KRAAK ?" sur l'accueil

- Source : `templates/home.html`
- Cible : `home.page.html`
- Intérêt : renforce la différenciation et la preuve de crédibilité.

2. Bloc témoignages orienté résultats

- Source : `templates/home.html`
- Cible : `home.page.html`
- Intérêt : améliore la réassurance et la conversion.

3. Logos partenaires + zone "Ils nous font confiance"

- Source : `templates/about.html`
- Cible : `about.page.html`
- Intérêt : ajoute une preuve sociale institutionnelle.

## P2 - Valeur UX/engagement

1. Hero contact en carousel (2-3 visuels max)

- Source : `templates/contact.html`
- Cible : `contact.page.html`
- Intérêt : montée en attractivité visuelle de la page contact.

2. Assistant virtuel de pré-orientation (version sobre)

- Source : `templates/contact.html`
- Cible : `contact.page.ts` + `contact.page.html`
- Intérêt : qualification rapide avant soumission du formulaire.
- Note : implémenter une version statique locale (FAQ guidée) avant toute IA.

## P3 - À adapter au contexte actuel

1. Détail de service dédié (`/services/:slug`)

- Source : `templates/details_service.html`
- Cible : nouvelle page Angular `service-detail.page.*` + route dédiée
- Intérêt : profondeur SEO et meilleure compréhension de l'offre.
- Contrainte : garder cohérence avec la structure de contenu actuelle.

## Règles de reprise

1. Ne pas copier-coller le code Django/templating.
2. Réécrire en composants Angular standalone et templates séparés.
3. Conserver le design system courant (classes Tailwind + composants PrimeNG).
4. Vérifier accessibilité de base (libellés, contrastes, navigation clavier).
5. Mettre à jour les specs unitaires associées à chaque page modifiée.

## Plan d'exécution proposé

## Lot A (rapide, impact immédiat)

1. Ajouter "Pourquoi choisir KRAAK ?" et "Témoignages" dans `home.page.*`.
2. Ajouter tests unitaires de rendu associés (`home.page.spec.ts`).

## Lot B (réassurance institutionnelle)

1. Ajouter section partenaires dans `about.page.*`.
2. Ajouter tests de présence de section et labels clés.

## Lot C (contact augmenté)

1. Introduire hero carousel léger sur `contact.page.*`.
2. Ajouter assistant de pré-qualification non bloquant du formulaire.
3. Tester les interactions essentielles (ouverture, sélection, réponse affichée).

## Critères d'acceptation

1. Les pages restent responsive mobile-first.
2. Aucune régression sur les CTA principaux (contact/services).
3. Les contenus restent cohérents avec le ton KRAAK (français clair, crédible).
4. Les tests unitaires des pages modifiées passent.

## Décision à prendre

Pour démarrer immédiatement, exécuter le Lot A en premier.
