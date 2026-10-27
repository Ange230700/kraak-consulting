---
status: active
owner: platform
last_reviewed: 2026-07-23
source_of_truth: true
---

# Architecture mobile

## Table des matières

- [Architecture mobile](#architecture-mobile)
  - [Contrat courant](#contrat-courant)
  - [Internationalisation cible](#internationalisation-cible)
  - [Sources liées](#sources-liees)

L'application mobile KRAAK est l'application Ionic Angular située dans
`apps/client/projects/mobile`.

## Contrat courant

- Framework : Ionic Angular sur le workspace Angular commun.
- Runtime natif : Capacitor.
- Cible pilote : Android en priorité ; iOS reste préparé selon capacité.
- Navigation MVP : authentification hors tabs, puis tabs `Accueil`,
  `Programmes`, `Annonces`, `Support`.
- Notifications : Firebase Cloud Messaging seulement quand le besoin natif est
  confirmé et selon le gating défini par ADR.
- Internationalisation : `fr-CI` restera la locale source et de repli, `en-GB`
  sera la première locale anglaise cible selon ARC-19.

## Internationalisation cible

L'application mobile changera de langue au runtime. Les routes mobiles resteront
stables par défaut afin de préserver les deep links, les tests et la navigation
interne. Les libellés d'onglets, titres, boutons, formulaires, messages,
toasts, états de chargement et textes d'accessibilité seront traduits via
l'adaptateur i18n applicatif prévu par ARC-19.

La locale de l'appareil pourra servir d'entrée de détection au premier lancement,
mais elle ne sera pas la source de vérité unique. Un choix explicite utilisateur
devra être persisté localement, puis synchronisé plus tard avec le profil
authentifié lorsque ce champ existera.

Cette PR ne modifie aucune route mobile, aucun catalogue et aucun comportement
runtime.

## Sources liées

- [`../product/MOBILE_MVP.md`](../product/MOBILE_MVP.md) pour le périmètre
  produit mobile.
- [`../product/USER_JOURNEYS.md`](../product/USER_JOURNEYS.md) pour les parcours.
- [`../operations/MOBILE_BUILD.md`](../operations/MOBILE_BUILD.md) pour les
  builds Capacitor.
- [`ARC-06`](../decisions/ARC-06-gating-firebase-mobile-push.md) pour le gating
  notifications push.
- [`ARC-19`](../decisions/ARC-19-i18n-localization-strategy.md) pour la stratégie
  d'internationalisation français / anglais.
