---
status: active
owner: platform
last_reviewed: 2026-07-23
source_of_truth: true
---

# Correspondance de composants — Web (PrimeNG) ↔ Mobile (Ionic)

> Ce document décrit la correspondance entre les composants utilisés sur le site
> web (Angular + PrimeNG) et l'application mobile (Angular + Ionic). Le but est
> de partager les **tokens de design**, les **modèles de données**, les
> **services** et la **logique de validation**, tout en laissant chaque
> plateforme utiliser son propre kit de composants UI.

---

## Principes

1. **Pas de kit UI forcé** — PrimeNG côté web, Ionic côté mobile.
2. **Tokens partagés** — Le package `@kraak/tokens` fournit les couleurs, polices,
   rayons et ombres à travers les deux plateformes via des custom properties CSS.
3. **Logique partagée** — Services, modèles TypeScript, règles de validation et
   utilitaires vivent dans des packages partagés (`packages/domain/`,
   `packages/contracts/`, etc.) dès que la duplication devient réelle.
4. **Rendu spécifique** — Chaque plateforme compose ses propres templates et
   composants Angular ; aucun composant `.ts` de présentation n'est partagé entre
   web et mobile.

---

## Table de correspondance

| Fonction UI              | Web (PrimeNG)            | Mobile (Ionic)                          |
| ------------------------ | ------------------------ | --------------------------------------- |
| Bouton                   | `p-button`               | `ion-button`                            |
| Champ texte              | `p-inputtext`            | `ion-input`                             |
| Zone de texte            | `p-textarea`             | `ion-textarea`                          |
| Sélecteur / dropdown     | `p-select`               | `ion-select` + `ion-select-option`      |
| Case à cocher            | `p-checkbox`             | `ion-checkbox`                          |
| Bouton radio             | `p-radiobutton`          | `ion-radio` + `ion-radio-group`         |
| Interrupteur             | `p-toggleswitch`         | `ion-toggle`                            |
| Carte                    | `p-card`                 | `ion-card`                              |
| Dialogue / modal         | `p-dialog`               | `ion-modal`                             |
| Tiroir / drawer          | `p-drawer`               | `ion-menu`                              |
| Barre d'en-tête          | `p-toolbar`              | `ion-header` + `ion-toolbar`            |
| Onglets                  | `p-tabs` + `p-tabpanel`  | `ion-tabs` + `ion-tab`                  |
| Accordéon                | `p-accordion`            | `ion-accordion` + `ion-accordion-group` |
| Liste                    | `p-listbox`              | `ion-list` + `ion-item`                 |
| Badge                    | `p-badge`                | `ion-badge`                             |
| Message / toast          | `p-toast`                | `ion-toast`                             |
| Alerte                   | `p-message`              | `ion-alert`                             |
| Indicateur de chargement | `p-progressspinner`      | `ion-spinner` / `ion-loading`           |
| Avatar                   | `p-avatar`               | `ion-avatar`                            |
| Navigation               | `p-menubar`              | `ion-tabs` / `ion-menu`                 |
| Formulaire               | Reactive Forms + PrimeNG | Reactive Forms + Ionic                  |

---

## Éléments partagés (packages communs)

| Catégorie          | Emplacement prévu      | Contenu                                   |
| ------------------ | ---------------------- | ----------------------------------------- |
| Tokens de design   | `packages/tokens/`     | CSS custom properties + constantes TS     |
| Modèles de données | `packages/domain/`     | Interfaces, enums, types métier           |
| Validation         | `packages/domain/`     | Règles de validation, schémas (Zod, etc.) |
| Contrats API       | `packages/contracts/`  | Types requis / réponses API partagés      |
| Client API         | `packages/api-client/` | Helpers HTTP typés consommés par les deux |

---

## Mapping des tokens vers Ionic

Les variables Ionic (`--ion-color-*`) sont mappées dans
`apps/client/projects/mobile/src/styles.scss` :

| Rôle Ionic               | Token KRAAK source |
| ------------------------ | ------------------ |
| `--ion-color-primary`    | `--kr-brand-navy`  |
| `--ion-color-secondary`  | `--kr-brand-blue`  |
| `--ion-color-tertiary`   | `--kr-brand-cyan`  |
| `--ion-color-warning`    | `--kr-brand-gold`  |
| `--ion-font-family`      | `--kr-font-sans`   |
| `--ion-background-color` | `--kr-brand-page`  |
| `--ion-text-color`       | `--kr-neutral-900` |

---

## Mapping des tokens vers PrimeNG

Le preset Aura personnalisé (`apps/client/projects/web/src/app/config/kraak-preset.ts`)
importe les constantes TypeScript de `@kraak/tokens` et les injecte dans la
configuration PrimeNG `definePreset(Aura, { ... })`.

Les classes utilitaires Tailwind (`text-brand-navy`, `bg-brand-page`, etc.) sont
alimentées par les mêmes custom properties CSS via le bloc `@theme` de
`apps/client/projects/web/src/tailwind.css`.
