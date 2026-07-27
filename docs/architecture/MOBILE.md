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

## Sources liées

- [`../product/MOBILE_MVP.md`](../product/MOBILE_MVP.md) pour le périmètre
  produit mobile.
- [`../product/USER_JOURNEYS.md`](../product/USER_JOURNEYS.md) pour les parcours.
- [`../operations/MOBILE_BUILD.md`](../operations/MOBILE_BUILD.md) pour les
  builds Capacitor.
- [`ARC-06`](../decisions/ARC-06-gating-firebase-mobile-push.md) pour le gating
  notifications push.
