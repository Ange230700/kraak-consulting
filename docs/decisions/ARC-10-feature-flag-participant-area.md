---
status: active
owner: platform
last_reviewed: 2026-07-23
source_of_truth: true
---

<!-- docs\decisions\ARC-10-feature-flag-participant-area.md -->

# ARC-10 — Feature flag espace participant

| Champ          | Valeur                      |
| -------------- | --------------------------- |
| **Statut**     | Acceptée                    |
| **Date**       | 2026-05-01                  |
| **Auteurs**    | Équipe KRAAK                |
| **Dépendance** | ARC-08, ARC-09              |
| **Liée à**     | ARC-01, ARC-07 ; issue #297 |

---

## 1 · Contexte

Le MVP comporte deux surfaces fonctionnelles distinctes :

1. **Site vitrine** (marketing) — accueil, à propos, services, programmes,
   ressources, contact. Stable, prêt pour la production.
2. **Espace participant** (authentifié) — connexion, inscription, mot de passe
   oublié, dashboard. Encore en cours de stabilisation, dépend de Supabase Auth
   et de parcours métier non finalisés.

L'équipe souhaite **mettre en production le site vitrine immédiatement**, sans
attendre la stabilisation de l'espace participant, tout en continuant à itérer
sur ce dernier sur l'environnement de **staging** (cf. ARC-08).

Le projet Render unique `kraak-consulting` (cf. ARC-11)
partagent **le même artefact de build** : la sélection ne peut donc pas se
faire au build-time. Une bascule **runtime** est requise.

---

## 2 · Décision

### 2.1 Mécanisme — feature flag runtime

Un drapeau booléen `CLIENT_FEATURE_PARTICIPANT_AREA` est injecté à
l'application Angular via `runtime-config.js` (généré par
[`scripts/generate-client-runtime-config.mjs`](../../scripts/generate-client-runtime-config.mjs))
et exposé sous la clé `enableParticipantArea` de
`globalThis.__KRAAK_RUNTIME_CONFIG__`.

L'accesseur typé [`isParticipantAreaEnabled()`](../../apps/client/projects/web/src/app/core/runtime/runtime-config.ts)
encapsule la lecture et le défaut sécurisé `false`.

### 2.2 Comportement quand le flag est `false` (défaut prod)

| Surface                                                                        | Comportement                                                                    |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Routes `/connexion`, `/inscription`, `/mot-de-passe-oublie`, `/participant/**` | Absentes du `Routes` array → wildcard `**` redirige vers `/` (HTTP 200, racine) |
| Lien "Espace participant" dans la navbar                                       | Masqué (`@if (participantAreaEnabled)`)                                         |
| Sitemap / SEO                                                                  | Inchangé — ces routes n'ont jamais été listées                                  |
| API / Supabase                                                                 | Inchangées — pas de chemin atteignable côté UI                                  |

### 2.3 Configuration par environnement

Toutes les valeurs sont configurées sur le projet Render unique
`kraak-consulting` (cf. ARC-11), avec un override par branche pour le
déploiement Preview de `staging` :

| Environnement Render                 | `gitBranch` | Valeur du flag    |
| ------------------------------------ | ----------- | ----------------- |
| `production` (branche `main`)        | —           | `false`           |
| `preview` (override branche staging) | `staging`   | `true`            |
| `preview` (autres branches/PR)       | —           | `false`           |
| `development` (`render dev`)         | —           | `true`            |
| Local dev (`apps/client/.env`)       | —           | `true` recommandé |

### 2.4 Implémentation

- [`apps/client/projects/web/src/app/app.routes.ts`](../../apps/client/projects/web/src/app/app.routes.ts) :
  factory `buildRoutes(participantAreaEnabled)` qui compose `marketingRoutes`
  (toujours actives) avec `participantAreaRoutes` (gardées par le flag).
- [`apps/client/projects/web/src/app/layouts/navbar/navbar.component.ts`](../../apps/client/projects/web/src/app/layouts/navbar/navbar.component.ts) :
  champ `participantAreaEnabled` consommé par le template.
- Tests unitaires (Vitest) : `runtime-config.spec.ts`, `app.routes.spec.ts`,
  `navbar.spec.ts` couvrent les deux états du flag.

---

## 3 · Conséquences

### 3.1 Positives

- **Time-to-market** : la prod ne dépend plus de la maturité de l'espace
  participant.
- **Itération continue** : le staging conserve l'intégralité du parcours
  authentifié.
- **Réversibilité** : bascule en O(1) en modifiant la variable Render.

### 3.2 Négatives / dette

- Code participant compilé et présent dans le bundle prod (poids marginal,
  non chargé car routes absentes — Angular tree-shake les composants jamais
  référencés par les `loadComponent` non instanciés).
- Surface de test démultipliée : chaque test concernant routes / navbar doit
  exercer les deux états du flag.

### 3.3 Sortie du drapeau

Le flag est **temporaire**. Il sera retiré dès que :

1. L'espace participant aura passé sa revue produit + sécurité (notamment
   parcours auth, gestion du mot de passe, RLS Supabase).
2. La décision sera tracée dans un nouvel ADR ou dans la fiche de release.

La suppression consistera à : retirer le flag de `runtime-config`, dégrader
`buildRoutes` en `routes` constant unique, retirer le `@if` dans la navbar,
nettoyer les `.env*`, supprimer la variable Render (les 4 entrées du projet
unique `kraak-consulting`).

---

## 4 · Alternatives écartées

- **Build conditionnel** (`environment.prod.ts`) : nécessiterait deux
  artefacts distincts → casse l'identité staging/prod et complexifie ARC-09.
- **Garde de route Angular** retournant `false` : laisserait les fichiers JS
  participant chargés au premier match d'URL, et exigerait un `redirect` au
  niveau du `CanMatchFn` → équivalent fonctionnel mais plus verbeux que
  l'absence de route.
- **Reverse proxy / réécriture Render** : externaliserait la logique produit
  hors du code, plus difficile à tester unitairement.
