---
status: active
owner: platform
last_reviewed: 2026-07-23
source_of_truth: true
---

# Variables d'environnement

## Table des matières

- [Variables d'environnement](#variables-denvironnement)
  - [Organisation des fichiers](#organisation-des-fichiers)
  - [Backend — apps/api/](#backend-appsapi)
  - [Client — apps/client/](#client-appsclient)
  - [Supabase — supabase/](#supabase-supabase)
  - [Domaines publics documentés](#domaines-publics-documentes)
  - [CI/CD — .env.example (racine)](#cicd-envexample-racine)
  - [Déploiement — Render (render.yaml)](#deploiement-render-renderyaml)
  - [Convention de gestion](#convention-de-gestion)

Ce document décrit les variables d'environnement du MVP et leur emplacement
dans le monorepo. Ne jamais commiter de secrets dans le dépôt.

## Organisation des fichiers

| Fichier                         | Contenu                                             |
| ------------------------------- | --------------------------------------------------- |
| `apps/api/.env.example`         | Modèle backend local (copier vers `.env`)           |
| `apps/api/.env`                 | Variables backend local effectivement lues          |
| `apps/api/.env.staging.example` | Modèle backend staging (copier vers `.env.staging`) |
| `apps/api/.env.staging`         | Variables backend staging effectivement lues        |
| `apps/api/.env.prod`            | Variables backend production pour test local        |
| `apps/client/.env.example`      | Modèle client local / staging                       |
| `apps/client/.env`              | Runtime-config client local + scripts / E2E         |
| `apps/client/.env.staging`      | Runtime-config client staging                       |
| `apps/client/.env.prod`         | Runtime-config client production pour build local   |
| `supabase/.env.staging`         | Références Supabase staging                         |
| `.env.example` (racine)         | Variables CI/CD uniquement                          |

> Le client Angular n'utilise pas de `.env` à l'exécution. Les URLs et clés
> publiques sont définies explicitement dans
> `environment.local.ts`, `environment.staging.ts` et
> `environment.production.ts`, puis remplacées à la compilation via
> `angular.json`.

## Backend — `apps/api/`

Variables lues par `process.env` dans le code NestJS :

- `NODE_ENV` : environnement d'exécution. Exemple local : `local`
- `APP_ENV` : environnement de déploiement exposé par `/health`. Valeurs
  attendues : `local`, `staging`, `production`. Sur Render, ne pas s'appuyer sur
  `NODE_ENV` pour distinguer staging et production, car les deux services
  utilisent des builds optimisés avec `NODE_ENV=production`.
- `PORT` : port d'écoute de l'API. Exemple local : `3000`
- `SUPABASE_URL` : URL du projet Supabase. Exemple local : `http://127.0.0.1:54321`
- `SUPABASE_PUBLISHABLE_KEY` : clé publique Supabase pour les flux auth API
  (alias legacy accepté : `SUPABASE_ANON_KEY`)
- `SUPABASE_SECRET_KEY` : clé service role secrète
  (alias legacy accepté : `SUPABASE_SERVICE_ROLE_KEY`)
- `RESEND_API_KEY` : clé API Resend secrète
- `CONTACT_FROM_EMAIL` : expéditeur des emails transactionnels. Exemple : `onboarding@resend.dev`
- `CONTACT_TO_EMAIL` : email destinataire interne des formulaires. Exemple : `contact@kraak.org`. Les demandes publiques y arrivent déjà enrichies avec la file de triage, le workflow de réponse et le fallback opérationnel.
- `CORS_ALLOWED_ORIGINS` : origines autorisées exactes séparées par des virgules. Exemple : `http://localhost:4200,http://localhost:4300`
- `CORS_ALLOWED_ORIGIN_PATTERNS` : optionnel. Expressions régulières séparées par des virgules pour autoriser des familles d'origines, typiquement des sous-domaines contrôlés sur `onrender.com`. Exemple : `^https://kraak-web-staging(-[a-z0-9]+)?\.onrender\.com$`
- `APP_VERSION` : identifiant de release exposé par `/health`. Exemple : `pilot-2026-04-30`

Ordre de chargement côté API :

1. Si `NODE_ENV=local` (ou non défini) : seul `.env` est chargé.
2. Sinon : `.env.${NODE_ENV}` est chargé en priorité, avec `.env` comme
   fallback pour les variables non spécifiées. Cas particulier :
   `NODE_ENV=production` est résolu vers `.env.prod`, comme `NODE_ENV=prod`.

`APP_ENV` ne pilote pas le chargement des fichiers `.env` ; il sert uniquement à
identifier l'environnement réel dans le payload `/health` et dans les checks
d'observabilité.

Les fichiers `.env.staging` et `.env.prod` ne doivent **jamais** être
versionnés : en staging et en production, les variables sont injectées par
l'hébergeur (Render, GitHub Secrets).

Scripts utiles côté `apps/api/package.json` :

- `pnpm start:local` charge explicitement `.env` (`NODE_ENV=local`)
- `pnpm start:dev` reste un alias vers `start:local`
- `pnpm start:staging` lance NestJS avec `NODE_ENV=staging`
- `pnpm start:prod` s'appuie sur les variables injectées par l'hébergeur

Note Auth API :

- `SUPABASE_SECRET_KEY` (ou alias `SUPABASE_SERVICE_ROLE_KEY`) reste nécessaire pour lire les profils et les tables MVP
- `SUPABASE_PUBLISHABLE_KEY` (ou alias `SUPABASE_ANON_KEY`) est recommandé pour les endpoints `auth/*`
  exposés par l'API ; si elle manque, l'API retombe sur `SUPABASE_SECRET_KEY`

Alias utiles à la racine :

- `pnpm dev:api` pointe vers l'environnement `local`
- `pnpm dev:api:staging` pointe vers l'environnement `staging`

## Client — `apps/client/`

Variables utilisées par le runtime-config et les scripts :

| Variable                   | Description                                                                                                                      | Exemple local            |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `CLIENT_API_BASE_URL`      | URL publique de l'API consommée par le client (doit être non vide en prod, sinon le client poste en same-origin et reçoit `405`) | `http://localhost:3000`  |
| `SUPABASE_URL`             | URL publique du projet Supabase côté client                                                                                      | `http://127.0.0.1:54321` |
| `SUPABASE_PUBLISHABLE_KEY` | Clé publique Supabase côté client                                                                                                | —                        |
| `KRAAK_WEB_PORT`           | Port du serveur Angular pour scripts / E2E                                                                                       | `4200`                   |

Les environnements Angular sont définis dans :

- `apps/client/projects/web/src/environments/environment.local.ts`
- `apps/client/projects/web/src/environments/environment.staging.ts`
- `apps/client/projects/mobile/src/environments/environment.local.ts`
- `apps/client/projects/mobile/src/environments/environment.staging.ts`

Flags compile-time mobile (dans `projects/mobile/src/environments/environment.*.ts`) :

- `pushNotificationsEnabled` (`boolean`) : active le wiring initial du service push mobile (`MOB-05`)
- `pushNotificationsProvider` (`string`) : provider cible (valeur actuelle: `fcm`)

Configurations Angular disponibles :

- `web:build:local` remplace `environment.ts` par
  `projects/web/src/environments/environment.local.ts`
- `web:build:staging` remplace `environment.ts` par
  `projects/web/src/environments/environment.staging.ts`
- `mobile:build:local` remplace `environment.ts` par
  `projects/mobile/src/environments/environment.local.ts`
- `mobile:build:staging` remplace `environment.ts` par
  `projects/mobile/src/environments/environment.staging.ts`

Scripts utiles :

- `pnpm dev:web` utilise la configuration Angular `local`
- `pnpm dev:web:staging` utilise la configuration Angular `staging`
- `pnpm dev:mobile` utilise la configuration Angular `local`
- `pnpm dev:mobile:staging` utilise la configuration Angular `staging`
- `pnpm build:web:local` et `pnpm build:mobile:local` génèrent un runtime-config local
- `pnpm build:web:staging` et `pnpm build:mobile:staging` génèrent un runtime-config staging
- `pnpm build:web` et `pnpm build:mobile` génèrent un runtime-config `production`
  à partir de `apps/client/.env.prod` quand ce fichier existe

Variable optionnelle utile côté build :

- `PUBLIC_SITE_URL` alimente le sitemap, `robots.txt` et la valeur de repli du
  site public lors des builds web hébergés
- `PUBLIC_GA4_ID` (ex. `G-XXXXXXXXXX`) active Google Analytics 4 sur le site
  web public lors du build `production`. Si la variable n'est pas définie,
  l'analytics reste totalement désactivée (aucun script chargé)

## Supabase — `supabase/`

Le fichier `supabase/.env.staging` sert de référence claire pour l'environnement
staging manipulé dans le dépôt. En local, les variables Supabase nécessaires
sont déclarées directement dans `apps/api/.env` et `apps/client/.env`.

> **Production** : la prod utilise un projet Supabase **distinct** de staging
> (cf. `docs/decisions/ARC-07-prod-release-tag-based.md`). Le `SUPABASE_PROJECT_REF`
> prod n'est jamais commité ; il vit uniquement dans le GitHub Environment
> `production` (`SUPABASE_PROD_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN`,
> `SUPABASE_PROD_DB_PASSWORD`) et est consommé par le workflow
> `.github/workflows/release-prod.yml` lors des migrations prod. Voir
> `docs/operations/RELEASE_PROD.md`.

La configuration Auth email/password versionnée du MVP ne vit pas dans ces
fichiers `.env` mais dans `supabase/config.toml`, avec ses templates email
locaux dans `supabase/templates/auth/`. Voir aussi
[`SUPABASE_AUTH.md`](SUPABASE_AUTH.md) et la politique de secrets de
[`RELEASE_PROD.md`](RELEASE_PROD.md#politique-de-secrets).

Variables attendues :

| Variable                   | Description                                |
| -------------------------- | ------------------------------------------ |
| `SUPABASE_URL`             | URL du projet Supabase ciblé               |
| `SUPABASE_PUBLISHABLE_KEY` | Clé publique du projet Supabase ciblé      |
| `SUPABASE_SECRET_KEY`      | Clé serveur / service role du projet ciblé |

Aliases legacy acceptés par l'API :

- `SUPABASE_ANON_KEY` pour `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` pour `SUPABASE_SECRET_KEY`

## Domaines publics documentés

- Domaine public principal : `https://kraak-web-prod.onrender.com`
- Domaine staging : pas d'URL stable (previews Render changent par commit ; branch alias protégé par SSO)
- API staging actuelle : `https://kraak-api-staging.onrender.com`
- API production actuelle : `https://kraak-api-prod.onrender.com`

## CI/CD — `.env.example` (racine)

| Variable                     | Description                            |
| ---------------------------- | -------------------------------------- |
| `RENDER_API_KEY`             | Clé API Render (authentification API)  |
| `RENDER_PROD_SERVICE_ID`     | ID du service Render API de production |
| `RENDER_PROD_WEB_SERVICE_ID` | ID du service Render web de production |

URLs de supervision versionnées dans le dépôt :

- `.github/workflows/observability.yml` vérifie les homes web staging et production.
- `.github/workflows/observability.yml` vérifie les APIs staging et production via `/health`.

Ces variables sont injectées via GitHub Secrets et ne sont pas nécessaires
en développement local.

## Déploiement — Render (`render.yaml`)

Le fichier `render.yaml` déclare les variables d'environnement de production
pour l'API : `NODE_ENV`, `APP_ENV`, `PORT`, `APP_VERSION`, `SUPABASE_URL`,
`SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `RESEND_API_KEY`,
`CONTACT_FROM_EMAIL`, `CONTACT_TO_EMAIL`, `CORS_ALLOWED_ORIGINS`,
`CORS_ALLOWED_ORIGIN_PATTERNS`.
La procédure de vérification et de finalisation manuelle dans le dashboard
Render est couverte par [`DEPLOYMENT.md`](DEPLOYMENT.md) et
[`RELEASE_PROD.md`](RELEASE_PROD.md).

## Convention de gestion

- Utiliser les fichiers `.env.example` sans valeurs sensibles.
- Garder `local` et `staging` comme seuls environnements de travail documentés dans les workspaces.
- Mettre à jour ce document à chaque ajout, suppression ou renommage de variable.
- Injecter les secrets via GitHub Secrets ou variables d'environnement de l'hébergeur.
- Rotation immédiate en cas de fuite.
