---
status: active
owner: platform
last_reviewed: 2026-10-27
source_of_truth: true
---

# Variables d’environnement

## Table des matières

- [Variables d’environnement](#variables-denvironnement)
  - [Deux profils : local et production](#deux-profils-local-et-production)
  - [API](#api)
  - [Client](#client)
  - [GitHub](#github)

## Deux profils : local et production

`main` est la branche permanente. Aucun profil Angular, script de lancement ni
service distant permanent staging n’est nécessaire au développement ou aux PR.
Les anciens fichiers locaux contenant des secrets ne sont pas supprimés
automatiquement : les conserver hors Git jusqu’à la fin des sauvegardes.

| Surface | Local                                  | Production                                                    |
| ------- | -------------------------------------- | ------------------------------------------------------------- |
| API     | `apps/api/.env`, `NODE_ENV=local`      | Variables Render, `NODE_ENV=production`, `APP_ENV=production` |
| Client  | `apps/client/.env` puis `.env.local`   | Variables de build Render ou `.env.prod` local non versionné  |
| Données | Supabase local                         | Projet Supabase de production vérifié                         |
| CI      | Fixtures, mocks et PostgreSQL éphémère | Aucun secret de base pour les PR                              |

Les scripts `dev:*:staging`, `build:*:staging` et
`test:api:journey:strict:staging` sont retirés. Utiliser `pnpm dev`,
`pnpm build:web:local`, `pnpm build:mobile:local`, `pnpm check` et les E2E locaux.
Les builds Android de debug utilisent le profil local.

## API

- `PORT`, `NODE_ENV`, `APP_ENV`, `APP_VERSION`.
- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`.
- `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, `CONTACT_TO_EMAIL`.
- `CORS_ALLOWED_ORIGINS` : origines réellement utilisées en production.
- `CORS_ALLOWED_ORIGIN_PATTERNS` : uniquement des domaines contrôlés nécessaires.

Les alias legacy des clés Supabase restent acceptés par le code. `APP_ENV`
identifie le déploiement dans `/health` ; il ne charge pas les fichiers env.
Ne pas déduire la configuration réelle du fournisseur de copies locales.

## Client

- `CLIENT_API_BASE_URL`, `CLIENT_SITE_URL`, `CLIENT_MOBILE_SITE_URL`.
- `CLIENT_SUPABASE_URL` ou `SUPABASE_URL`.
- `CLIENT_SUPABASE_PUBLISHABLE_KEY` ou `SUPABASE_PUBLISHABLE_KEY`.
- `CLIENT_FEATURE_PARTICIPANT_AREA` : conserver la valeur explicitement validée
  pour le déploiement ; ne pas activer de fonctionnalités en changeant de branche.
- Variables publiques de marque : voir [le modèle client](../../apps/client/.env.example).

La génération de `assets/runtime-config.js` accepte uniquement `local` et
`production`. Les clés secrètes Supabase et Resend ne doivent jamais y apparaître.

## GitHub

L’environnement `production` conserve son approbation et son délai d’attente.
Autoriser les tags `v*` pour les releases et `main` pour les inventaires et
contrôles en lecture seule.

Secrets de production :

- `RENDER_API_KEY`, `RENDER_PROD_SERVICE_ID`, `RENDER_PROD_WEB_SERVICE_ID`.
- `PROD_API_HEALTH_URL`, `PROD_WEB_URL`.
- `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROD_PROJECT_REF`,
  `SUPABASE_PROD_DB_PASSWORD`.
- `SUPABASE_DB_URL_PRODUCTION_READONLY` pour le garde de lignée en lecture seule.

`SONAR_TOKEN` et `SUPABASE_ACCESS_TOKEN` restent des secrets de dépôt.
Ne jamais afficher leur valeur, ni la copier dans une variable GitHub non secrète.
La variable de dépôt non secrète inutilisée `SONAR_TOKEN` a été retirée ; le
secret utilisé par le workflow SonarCloud est conservé.

L’environnement GitHub `staging`, ses secrets `KRAAK_JOURNEY_EMAIL`,
`KRAAK_JOURNEY_PASSWORD` et `SUPABASE_DB_URL_STAGING`, ainsi que le secret de
dépôt `SUPABASE_STAGING_PROJECT_REF`, ont été supprimés. Les déploiements
historiques restent consultables ; aucun workflow actif ne cible ces ressources.
La présence des noms restants ne prouve pas la validité des valeurs.
Le [registre de transition](PRODUCTION_ONLY_TRANSITION.md) conserve les preuves
et limites de vérification des fournisseurs.
