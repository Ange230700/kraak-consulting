# Sources officielles des documentations

Ce document centralise les URLs officielles des technologies déclarées
directement dans le dépôt KRAAK, ainsi que des plateformes déjà retenues par
l'architecture du projet.

## Périmètre

Sources utilisées pour établir cette liste :

- `package.json`
- `apps/client/package.json`
- `apps/api/package.json`
- `packages/contracts/package.json`
- `packages/domain/package.json`
- `packages/api-client/package.json`
- `packages/tokens/package.json`
- `.github/workflows/ci.yml`
- `ARCHITECTURE.md`
- `docs/context/tech_stack.md`

Statuts utilisés :

- `Actif` : déjà déclaré ou utilisé dans le code, les scripts ou la CI
- `Configuré` : déjà présent dans l'infra ou le workflow du dépôt
- `Cible` : retenu par l'architecture, même si le branchement complet n'est pas encore fait

## Runtime, langage et monorepo

| Technologie    | Statut    | Usage dans KRAAK                                           | Documentation officielle                                                                                         |
| -------------- | --------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Node.js        | Actif     | Runtime du monorepo, de l'API, du SSR et des scripts       | [https://nodejs.org/download/release/v24.14.1/docs/api/](https://nodejs.org/download/release/v24.14.1/docs/api/) |
| pnpm           | Actif     | Gestionnaire de packages et workspaces du monorepo         | [https://pnpm.io/](https://pnpm.io/)                                                                             |
| TypeScript     | Actif     | Langage principal du web, mobile, API et packages partagés | [https://www.typescriptlang.org/docs/](https://www.typescriptlang.org/docs/)                                     |
| Git            | Actif     | Versioning local du dépôt                                  | [https://git-scm.com/doc](https://git-scm.com/doc)                                                               |
| GitHub         | Configuré | Hébergement du dépôt et workflow de contribution           | [https://docs.github.com/](https://docs.github.com/)                                                             |
| GitHub Actions | Configuré | Pipeline CI défini dans `.github/workflows/ci.yml`         | [https://docs.github.com/actions](https://docs.github.com/actions)                                               |

## Frontend web

| Technologie                       | Statut | Usage dans KRAAK                                          | Documentation officielle                                                                         |
| --------------------------------- | ------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Angular                           | Actif  | Framework du site web et socle du workspace client        | [https://angular.dev/](https://angular.dev/)                                                     |
| Angular CLI                       | Actif  | Build, serve, tests et orchestration du workspace Angular | [https://angular.dev/tools/cli](https://angular.dev/tools/cli)                                   |
| Angular SSR                       | Actif  | Rendu serveur et stratégie SEO du projet `web`            | [https://angular.dev/guide/ssr](https://angular.dev/guide/ssr)                                   |
| Angular Prerender                 | Actif  | Prerender marketing retenu pour le site vitrine           | [https://angular.dev/guide/prerendering](https://angular.dev/guide/prerendering)                 |
| RxJS                              | Actif  | Réactivité et flux asynchrones côté Angular et NestJS     | [https://rxjs.dev/](https://rxjs.dev/)                                                           |
| PrimeNG                           | Actif  | Bibliothèque de composants UI Angular pour le site web    | [https://primeng.org/](https://primeng.org/)                                                     |
| PrimeNG Theming / PrimeUIX Themes | Actif  | Système de thèmes utilisé via `@primeuix/themes`          | [https://primeng.org/theming](https://primeng.org/theming)                                       |
| Tailwind CSS                      | Actif  | Styles utilitaires pour les composants et pages Angular   | [https://tailwindcss.com/docs](https://tailwindcss.com/docs)                                     |
| PostCSS                           | Actif  | Chaîne de transformation CSS du client Angular            | [https://postcss.org/](https://postcss.org/)                                                     |
| Autoprefixer                      | Actif  | Préfixes CSS automatiques via PostCSS                     | [https://github.com/postcss/autoprefixer#readme](https://github.com/postcss/autoprefixer#readme) |
| Express                           | Actif  | Serveur Node utilisé pour le bootstrap SSR Angular        | [https://expressjs.com/](https://expressjs.com/)                                                 |

## Mobile

| Technologie       | Statut | Usage dans KRAAK                                  | Documentation officielle                                                                             |
| ----------------- | ------ | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Ionic Framework   | Actif  | Framework UI mobile du projet `mobile`            | [https://ionicframework.com/docs](https://ionicframework.com/docs)                                   |
| Ionic Angular     | Actif  | Intégration Angular des composants Ionic          | [https://ionicframework.com/docs/angular/overview](https://ionicframework.com/docs/angular/overview) |
| Capacitor         | Actif  | Runtime et bridge natif pour l'application mobile | [https://capacitorjs.com/docs](https://capacitorjs.com/docs)                                         |
| Stencil           | Actif  | Dépendance d'écosystème utilisée par Ionic        | [https://stenciljs.com/docs/introduction](https://stenciljs.com/docs/introduction)                   |
| Ionicons          | Actif  | Icônes utilisées dans l'application mobile        | [https://ionic.io/ionicons](https://ionic.io/ionicons)                                               |
| Android Capacitor | Actif  | Cible Android déclarée via `@capacitor/android`   | [https://capacitorjs.com/docs/android](https://capacitorjs.com/docs/android)                         |

## Backend, contrats et validation de données

| Technologie | Statut | Usage dans KRAAK                                | Documentation officielle                                             |
| ----------- | ------ | ----------------------------------------------- | -------------------------------------------------------------------- |
| NestJS      | Actif  | Framework backend de l'API                      | [https://docs.nestjs.com/](https://docs.nestjs.com/)                 |
| Zod         | Actif  | Validation et schémas dans `packages/contracts` | [https://zod.dev/](https://zod.dev/)                                 |
| PostgreSQL  | Cible  | Base de données derrière Supabase               | [https://www.postgresql.org/docs/](https://www.postgresql.org/docs/) |

## Tests et qualité

| Technologie          | Statut | Usage dans KRAAK                                       | Documentation officielle                                                                                           |
| -------------------- | ------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Playwright           | Actif  | Tests E2E web dans `apps/client/tests/e2e/`            | [https://playwright.dev/docs/intro](https://playwright.dev/docs/intro)                                             |
| Vitest               | Actif  | Tests unitaires des packages et d'une partie du client | [https://vitest.dev/guide/](https://vitest.dev/guide/)                                                             |
| Jest                 | Actif  | Tests unitaires de l'API NestJS                        | [https://jestjs.io/docs/getting-started](https://jestjs.io/docs/getting-started)                                   |
| ts-jest              | Actif  | Pont TypeScript pour Jest côté API                     | [https://kulshekhar.github.io/ts-jest/](https://kulshekhar.github.io/ts-jest/)                                     |
| ts-node              | Actif  | Exécution TypeScript côté outillage backend            | [https://typestrong.org/ts-node/docs/](https://typestrong.org/ts-node/docs/)                                       |
| ESLint               | Actif  | Lint global du dépôt                                   | [https://eslint.org/docs/latest/](https://eslint.org/docs/latest/)                                                 |
| angular-eslint       | Actif  | Règles ESLint spécifiques à Angular                    | [https://github.com/angular-eslint/angular-eslint#readme](https://github.com/angular-eslint/angular-eslint#readme) |
| typescript-eslint    | Actif  | Règles TypeScript pour ESLint                          | [https://typescript-eslint.io/](https://typescript-eslint.io/)                                                     |
| Prettier             | Actif  | Formatage du code et des fichiers Markdown             | [https://prettier.io/docs/](https://prettier.io/docs/)                                                             |
| Husky                | Actif  | Hooks Git locaux                                       | [https://typicode.github.io/husky/](https://typicode.github.io/husky/)                                             |
| commitlint           | Actif  | Validation des messages de commit                      | [https://commitlint.js.org/](https://commitlint.js.org/)                                                           |
| Commitizen           | Actif  | Assistant de création des commits                      | [https://commitizen-tools.github.io/commitizen/](https://commitizen-tools.github.io/commitizen/)                   |
| cz-git               | Actif  | Adaptateur Commitizen utilisé dans le dépôt            | [https://cz-git.qbb.sh/](https://cz-git.qbb.sh/)                                                                   |
| Conventional Commits | Actif  | Convention de messages de commit suivie par le projet  | [https://www.conventionalcommits.org/](https://www.conventionalcommits.org/)                                       |

## Services, données, analytics et déploiement

| Technologie              | Statut    | Usage dans KRAAK                                        | Documentation officielle                                                                                                                                     |
| ------------------------ | --------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Supabase                 | Configuré | Base, auth, storage et migrations SQL du projet         | [https://supabase.com/docs](https://supabase.com/docs)                                                                                                       |
| Supabase Auth            | Cible     | Authentification applicative retenue par l'architecture | [https://supabase.com/docs/guides/auth](https://supabase.com/docs/guides/auth)                                                                               |
| Supabase Storage         | Cible     | Stockage de fichiers retenu par l'architecture          | [https://supabase.com/docs/guides/storage](https://supabase.com/docs/guides/storage)                                                                         |
| Resend                   | Cible     | Envoi d'emails transactionnels et formulaires           | [https://resend.com/docs](https://resend.com/docs)                                                                                                           |
| Firebase Cloud Messaging | Cible     | Notifications push mobile prévues dans l'architecture   | [https://firebase.google.com/docs/cloud-messaging](https://firebase.google.com/docs/cloud-messaging)                                                         |
| Google Analytics 4       | Cible     | Analytics web légers si besoin MVP                      | [https://support.google.com/analytics/answer/10089681](https://support.google.com/analytics/answer/10089681)                                                 |
| Google Search Console    | Cible     | Suivi SEO et indexation                                 | [https://developers.google.com/search/docs/monitor-debug/search-console-start](https://developers.google.com/search/docs/monitor-debug/search-console-start) |
| Vercel                   | Configuré | Déploiement du front et previews                        | [https://vercel.com/docs](https://vercel.com/docs)                                                                                                           |
| Render                   | Configuré | Déploiement de l'API via `render.yaml`                  | [https://render.com/docs](https://render.com/docs)                                                                                                           |
| Docker                   | Configuré | Build de l'image API et validation CI                   | [https://docs.docker.com/](https://docs.docker.com/)                                                                                                         |

## Remarques

- Cette liste vise les technologies explicitement déclarées dans le dépôt ou dans
  l'architecture active. Les dépendances transitives du lockfile ne sont pas
  détaillées ici.
- Quand une nouvelle technologie est ajoutée au codebase, à la CI ou à
  l'architecture validée, ce document doit être mis à jour dans le même
  changement.
