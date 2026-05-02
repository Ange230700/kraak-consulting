# Variables d'environnement

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
- `PORT` : port d'écoute de l'API. Exemple local : `3000`
- `SUPABASE_URL` : URL du projet Supabase. Exemple local : `http://127.0.0.1:54321`
- `SUPABASE_PUBLISHABLE_KEY` : clé publique Supabase pour les flux auth API
- `SUPABASE_SECRET_KEY` : clé service role secrète
- `RESEND_API_KEY` : clé API Resend secrète
- `CONTACT_FROM_EMAIL` : expéditeur des emails transactionnels. Exemple : `onboarding@resend.dev`
- `CONTACT_TO_EMAIL` : email destinataire des formulaires. Exemple : `contact@kraak.org`
- `CORS_ALLOWED_ORIGINS` : origines autorisées séparées par des virgules. Exemple : `http://localhost:4200,http://localhost:4300`
- `APP_VERSION` : identifiant de release exposé par `/health`. Exemple : `pilot-2026-04-30`

Ordre de chargement côté API :

1. Si `NODE_ENV=local` (ou non défini) : seul `.env` est chargé.
2. Sinon : `.env.${NODE_ENV}` est chargé en priorité, avec `.env` comme
   fallback pour les variables non spécifiées. Cas particulier :
   `NODE_ENV=production` est résolu vers `.env.prod`, comme `NODE_ENV=prod`.

Les fichiers `.env.staging` et `.env.prod` ne doivent **jamais** être
versionnés : en staging et en production, les variables sont injectées par
l'hébergeur (Render, Vercel, GitHub Secrets).

Scripts utiles côté `apps/api/package.json` :

- `pnpm start:local` charge explicitement `.env` (`NODE_ENV=local`)
- `pnpm start:dev` reste un alias vers `start:local`
- `pnpm start:staging` lance NestJS avec `NODE_ENV=staging`
- `pnpm start:prod` s'appuie sur les variables injectées par l'hébergeur

Note Auth API :

- `SUPABASE_SECRET_KEY` reste nécessaire pour lire les profils et les tables MVP
- `SUPABASE_PUBLISHABLE_KEY` est recommandé pour les endpoints `auth/*`
  exposés par l'API ; si elle manque, l'API retombe sur `SUPABASE_SECRET_KEY`

Alias utiles à la racine :

- `pnpm dev:api` pointe vers l'environnement `local`
- `pnpm dev:api:staging` pointe vers l'environnement `staging`

## Client — `apps/client/`

Variables utilisées par le runtime-config et les scripts :

| Variable                   | Description                                   | Exemple local            |
| -------------------------- | --------------------------------------------- | ------------------------ |
| `CLIENT_API_BASE_URL`      | URL publique de l'API consommée par le client | `http://localhost:3000`  |
| `SUPABASE_URL`             | URL publique du projet Supabase côté client   | `http://127.0.0.1:54321` |
| `SUPABASE_PUBLISHABLE_KEY` | Clé publique Supabase côté client             | —                        |
| `KRAAK_WEB_PORT`           | Port du serveur Angular pour scripts / E2E    | `4200`                   |

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
> `docs/runbooks/RELEASE_PROD.md`.

La configuration Auth email/password versionnée du MVP ne vit pas dans ces
fichiers `.env` mais dans `supabase/config.toml`, avec ses templates email
locaux dans `supabase/templates/auth/`. Voir aussi
[`SUPABASE_AUTH_SETUP.md`](SUPABASE_AUTH_SETUP.md).

Variables attendues :

| Variable                   | Description                                |
| -------------------------- | ------------------------------------------ |
| `SUPABASE_URL`             | URL du projet Supabase ciblé               |
| `SUPABASE_PUBLISHABLE_KEY` | Clé publique du projet Supabase ciblé      |
| `SUPABASE_SECRET_KEY`      | Clé serveur / service role du projet ciblé |

## Domaines publics documentés

- Domaine public principal : `https://kraak-group.vercel.app`
- Domaine staging actuel : `https://client-six-indol-58.vercel.app`
- API staging actuelle : `https://kraak-api-staging.onrender.com`

## CI/CD — `.env.example` (racine)

| Variable            | Description                     |
| ------------------- | ------------------------------- |
| `VERCEL_TOKEN`      | Token d'authentification Vercel |
| `VERCEL_ORG_ID`     | ID organisation Vercel          |
| `VERCEL_PROJECT_ID` | ID projet Vercel                |
| `RENDER_API_KEY`    | Clé API Render                  |

URLs de supervision versionnées dans le dépôt :

- `.github/workflows/observability.yml` vérifie la home publique du site.
- `.github/workflows/observability.yml` vérifie l'API publique via `/health`.

Ces variables sont injectées via GitHub Secrets et ne sont pas nécessaires
en développement local.

## Déploiement — Render (`render.yaml`)

Le fichier `render.yaml` déclare les variables d'environnement de production
pour l'API : `NODE_ENV`, `PORT`, `APP_VERSION`, `SUPABASE_URL`,
`SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`,
`CONTACT_TO_EMAIL`, `CORS_ALLOWED_ORIGINS`.

## Convention de gestion

- Utiliser les fichiers `.env.example` sans valeurs sensibles.
- Garder `local` et `staging` comme seuls environnements de travail documentés dans les workspaces.
- Mettre à jour ce document à chaque ajout, suppression ou renommage de variable.
- Injecter les secrets via GitHub Secrets ou variables d'environnement de l'hébergeur.
- Rotation immédiate en cas de fuite.
