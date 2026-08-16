---
status: active
owner: platform
last_reviewed: 2026-08-16
source_of_truth: true
---

# Architecture web

## Table des matières

- [Architecture web](#architecture-web)
  - [Contrat courant](#contrat-courant)
  - [Implémentation active](#implementation-active)
  - [Internationalisation cible](#internationalisation-cible)
  - [Sources liées](#sources-liees)

Le site web KRAAK est l'application Angular publique située dans
`apps/client/projects/web`.

## Contrat courant

- Framework : Angular.
- UI : PrimeNG, PrimeIcons et Tailwind CSS.
- Rendu : prerender Angular pour les routes vitrines publiques.
- Style : classes Tailwind et composants PrimeNG, sans `style` inline ni fichier
  CSS/SCSS par composant.
- Icônes : PrimeIcons pour les icônes UI.
- Surface publique canonique : `/fr/`, `/fr/a-propos`, `/fr/services`,
  `/fr/faq`, `/fr/programmes`, `/fr/ressources`, `/fr/contact`, pages légales
  et pages d'erreur sous `/fr/...`.
- Internationalisation : `fr-CI` est la locale source et de repli, `en-GB` est
  la première locale anglaise selon ARC-19. La page d'accueil `/fr/` ou `/en/`
  et la barre de navigation forment le premier incrément public bilingue. La
  coque publique partagée (pied de page, lien d'accès rapide et commande de
  retour en haut) forme le deuxième incrément. La page Contact constitue le
  troisième incrément localisé, la page Services le quatrième et la page
  Programmes le cinquième. La page À propos constitue le sixième incrément. Les
  quatre pages de conversion de cette série sont désormais localisées. Les
  autres pages `/en/...` restent un scaffold technique non indexable tant que
  leurs contenus anglais ne sont pas traduits et relus.

## Implémentation active

- Routes publiques : [`../../apps/client/projects/web/src/app/app.routes.ts`](../../apps/client/projects/web/src/app/app.routes.ts).
- Prerender public : [`../../apps/client/projects/web/src/app/app.routes.server.ts`](../../apps/client/projects/web/src/app/app.routes.server.ts).
- Catalogues runtime : [`../../apps/client/projects/shared/i18n/catalogs/`](../../apps/client/projects/shared/i18n/catalogs/),
  avec les espaces de clés `web.home`, `web.nav`, `web.shell`, `web.contact`,
  `web.services`, `web.programs` et `web.about` pour les incréments publics
  bilingues livrés.
- Tests de surface : [`../../apps/client/projects/web/src/app/app.routes.spec.ts`](../../apps/client/projects/web/src/app/app.routes.spec.ts)
  et [`../../apps/client/projects/web/src/app/app.routes.server.spec.ts`](../../apps/client/projects/web/src/app/app.routes.server.spec.ts).
- Historique design : [`../archive/vitrine-design/`](../archive/vitrine-design/),
  à consulter uniquement comme archive.

## Internationalisation cible

Les routes publiques web utilisent des chemins canoniques préfixés par locale :
`/fr/...` pour le français et `/en/...` pour l'anglais. La racine `/` redirige
vers `/fr/`, et les chemins publics français historiques redirigent vers leurs
équivalents `/fr/...`.

Le prerender, les métadonnées SEO, les canonicals, les liens `hreflang`, les
entrées sitemap et l'attribut `<html lang>` sont générés par locale depuis le
modèle de routes web localisées.

La page d'accueil, la barre de navigation, la coque publique partagée, les pages
Contact, Services, Programmes et À propos servent désormais leur contenu
français ou anglais depuis les catalogues selon la locale de l'URL. Un sélecteur
de langue relie les variantes d'une même page publique lorsque le mapping existe,
puis revient à la page d'accueil de la langue cible lorsqu'aucune variante
publique n'est disponible.

Les quatre pages de conversion prévues dans cette série sont désormais
localisées. L'activation de l'indexation anglaise, des entrées sitemap et des
liens `hreflang` réciproques reste conditionnée à une revue humaine du contenu
anglais de chaque page.

Les copies anglaises de Contact, Services, Programmes et À propos sont proposées
mais n'ont pas encore reçu de revue humaine. En conséquence, `/en/contact`,
`/en/services`, `/en/programs` et `/en/about` restent `noindex, nofollow`, hors
du sitemap de production et sans lien `hreflang="en-GB"` réciproque depuis leur
page française respective.

Ces incréments de contenu ne modifient pas encore la politique SEO du scaffold
anglais : les routes anglaises restent `noindex, nofollow`, exclues
du sitemap de production et non annoncées en `hreflang="en-GB"` depuis les
pages françaises indexables. Leurs métadonnées anglaises restent temporaires
jusqu'à une traduction et une revue SEO dédiées. `x-default` continue de pointer
vers la route française correspondante.

Les routes d'authentification technique, notamment les callbacks et liens de
réinitialisation, restent compatibles avec Supabase Auth avant toute localisation
de chemin.

Sur Render static, les redirects HTTP permanents non racine sont déclarés dans
`render.yaml`. La racine `/` est couverte par la redirection Angular/SSR et par
une page statique générée en fin de prerender, car Render ne permet pas les
redirects ciblant directement `/` dans les règles de réécriture.

## Sources liées

- [`ARC-03`](../decisions/ARC-03-seo-prerender-strategy.md) pour la stratégie de
  prerender.
- [`ARC-14`](../decisions/ARC-14-freeze-surface-vitrine-publique.md) pour le gel
  de la surface vitrine.
- [`ARC-15`](../decisions/ARC-15-positionnement-page-ressources-vitrine.md) pour
  le positionnement de `/ressources`.
- [`../engineering/UI_COMPONENT_MAPPING.md`](../engineering/UI_COMPONENT_MAPPING.md)
  pour le mapping PrimeNG/Ionic.
- [`../engineering/UI_FEEDBACK.md`](../engineering/UI_FEEDBACK.md) pour les
  messages et toasts web.
- [`ARC-19`](../decisions/ARC-19-i18n-localization-strategy.md) pour la stratégie
  d'internationalisation français / anglais.
