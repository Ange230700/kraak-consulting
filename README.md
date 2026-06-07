<!-- README.md -->

# KRAAK Group

Monorepo du MVP KRAAK — site web, application mobile et API backend.

---

## Quickstart (5 minutes)

### Prérequis

| Outil       | Version minimale | Installation                                                  |
| ----------- | ---------------- | ------------------------------------------------------------- |
| **Node.js** | 24.14+           | [nodejs.org](https://nodejs.org/)                             |
| **pnpm**    | 10.0+            | `corepack enable && corepack prepare pnpm@10.23.0 --activate` |
| **Git**     | 2.x              | [git-scm.com](https://git-scm.com/)                           |

> **Astuce** : `corepack` est inclus avec Node 24. Pas besoin d'installer `pnpm` séparément.

### Cloner et installer

```bash
git clone https://github.com/Ange230700/kraak-group.git
cd kraak-group
pnpm install
```

### Configurer les variables d'environnement

```bash
# API locale
cp apps/api/.env.example apps/api/.env

# Client local (runtime-config, scripts, E2E)
cp apps/client/.env.example apps/client/.env
```

Remplir les valeurs manquantes — voir
[`docs/runbooks/ENVIRONMENT_VARIABLES.md`](docs/runbooks/ENVIRONMENT_VARIABLES.md).

Le provider email/password local et les templates email du MVP sont versionnés
dans [`supabase/config.toml`](supabase/config.toml) et documentés dans
[`docs/runbooks/SUPABASE_AUTH_SETUP.md`](docs/runbooks/SUPABASE_AUTH_SETUP.md).
La procédure de rotation manuelle des clés secrètes Supabase est documentée dans
[`docs/runbooks/SUPABASE_SECRET_ROTATION.md`](docs/runbooks/SUPABASE_SECRET_ROTATION.md).
La finalisation manuelle des variables d'environnement Render est documentée
dans [`docs/runbooks/RENDER_ENV_FINALIZATION.md`](docs/runbooks/RENDER_ENV_FINALIZATION.md).

### Lancer en mode développement

```bash
# Toutes les apps en une seule commande
pnpm dev

# Site web (Angular SSR — http://localhost:4200)
pnpm dev:web

# API backend (NestJS — http://localhost:3000)
pnpm dev:api

# Application mobile (Ionic Angular — http://localhost:4300)
pnpm dev:mobile
```

> `pnpm dev` choisit automatiquement le prochain port libre pour le web et le mobile si `4200` ou `4300` sont déjà occupés. L'API reste attendue sur `3000`.

### Lancer avec Docker Compose (local uniquement)

Le fichier [`compose.local.yml`](compose.local.yml) sert uniquement au workflow de développement local.
Il ne doit pas être utilisé comme couche d'orchestration en production.
Pour un profil DB local prêt à l'emploi avec Supabase CLI, voir
[`docs/runbooks/DEV_MODE.md`](docs/runbooks/DEV_MODE.md) (section
"Profil DB local prêt à l'emploi (Supabase + Docker Compose)").

```bash
# Démarrer API + front statique local
docker compose -f compose.local.yml up --build

# Arrêter et nettoyer les conteneurs
docker compose -f compose.local.yml down
```

Services exposés :

- Front (statique) : `http://localhost:4200`
- API (NestJS) : `http://localhost:3000`

---

## Structure du monorepo

```text
kraak-group/
├── apps/
│   ├── api/           # Backend NestJS (port 3000)
│   └── client/        # Workspace Angular
│       └── projects/
│           ├── web/   # Site web (PrimeNG + Tailwind)
│           └── mobile/# App mobile (Ionic + Capacitor)
├── docs/
│   ├── context/       # Briefs produit, guides de style, brouillons
│   ├── runbooks/      # Guides opérationnels (env, GitHub Project…)
│   └── specs/         # Spécifications produit et backlog
├── scripts/           # Scripts utilitaires
├── AGENTS.md          # Règles pour les assistants IA
├── ARCHITECTURE.md    # Décisions d'architecture validées
└── CONTRIBUTING.md    # Guide de contribution (branches, commits, PR)
```

---

## Stack technique (résumé)

| Couche                 | Technologie                              |
| ---------------------- | ---------------------------------------- |
| Frontend web           | Angular 21 + PrimeNG 21 + Tailwind CSS 4 |
| Frontend mobile        | Ionic Angular 8 + Capacitor 7            |
| Backend                | NestJS 11                                |
| Base de données / Auth | Supabase (PostgreSQL, Auth, Storage)     |
| Déploiement web        | Vercel                                   |
| Déploiement API        | Render (Docker)                          |

Pour les détails, voir [`ARCHITECTURE.md`](ARCHITECTURE.md).

---

## Surface vitrine publique

La surface vitrine publique actuellement gelée et considérée comme complète
pour le MVP est :

- `/`
- `/a-propos`
- `/services`
- `/faq`
- `/programmes`
- `/ressources`
- `/contact`
- `/mentions-legales`
- `/politique-de-confidentialite`
- `/401`
- `/403`
- `/500`
- la page `404` servie via la wildcard `**`

Les routes authentifiées et non vitrines (`/connexion`, `/inscription`,
`/mot-de-passe-oublie`, `/participant/**`) restent hors de cette surface et ne
doivent pas rouvrir le scope public sans décision explicite. Voir
[`docs/decisions/ARC-14-freeze-surface-vitrine-publique.md`](docs/decisions/ARC-14-freeze-surface-vitrine-publique.md).

Note de positionnement : la route `/ressources` est intentionnellement une page
d'orientation vitrine statique. Elle n'est ni un blog, ni une bibliothèque
publique de contenu. Voir
[`docs/decisions/ARC-15-positionnement-page-ressources-vitrine.md`](docs/decisions/ARC-15-positionnement-page-ressources-vitrine.md).

## Statut de phase

- Statut actuel: **vitrine publique close** (scope gelé).
- Prochaine phase: implementation et durcissement des **routes protegees**.
- Règle de gouvernance: aucune nouvelle route publique sans decision ARC
  explicite.

---

## Scripts disponibles

| Commande                    | Description                                               |
| --------------------------- | --------------------------------------------------------- |
| `pnpm dev`                  | Lancer web, mobile et API avec ports auto pour web/mobile |
| `pnpm clean`                | Nettoyer les artefacts générés dans tout le monorepo      |
| `pnpm build`                | Builder tous les projets buildables                       |
| `pnpm test`                 | Lancer tous les tests disponibles                         |
| `pnpm test:workspace`       | Vérifier le workflow du runner de test racine             |
| `pnpm dev:web`              | Lancer le site web en dev (port 4200 par défaut)          |
| `pnpm dev:web:staging`      | Lancer le site web avec la configuration staging          |
| `pnpm dev:api`              | Lancer l'API en dev (port 3000)                           |
| `pnpm dev:api:staging`      | Lancer l'API avec la configuration staging                |
| `pnpm dev:mobile`           | Lancer l'app mobile en dev (port 4300)                    |
| `pnpm dev:mobile:staging`   | Lancer l'app mobile avec la configuration staging         |
| `pnpm build:web`            | Builder le site web                                       |
| `pnpm build:web:local`      | Builder le site web avec l'environnement local            |
| `pnpm build:web:staging`    | Builder le site web avec l'environnement staging          |
| `pnpm build:api`            | Builder l'API                                             |
| `pnpm build:mobile`         | Builder l'app mobile                                      |
| `pnpm build:mobile:local`   | Builder l'app mobile avec l'environnement local           |
| `pnpm build:mobile:staging` | Builder l'app mobile avec l'environnement staging         |
| `pnpm test:api`             | Tests unitaires API                                       |
| `pnpm test:api:unit`        | Tests unitaires API hors intégration                      |
| `pnpm test:integration`     | Tests d'intégration API                                   |
| `pnpm splinter:local`       | Lancer Splinter (Supabase Advisors) sur la DB locale      |
| `pnpm splinter:linked`      | Lancer Splinter (Supabase Advisors) sur le projet lié     |
| `pnpm splinter:sec`         | Lancer les checks sécurité Splinter sur le projet lié     |
| `pnpm splinter:perf`        | Lancer les checks performance Splinter sur le projet lié  |
| `pnpm sonar`                | Lancer l'analyse SonarCloud locale avec `.env.local`      |
| `pnpm typecheck`            | Vérifier le typage web, mobile et API                     |
| `pnpm test:unit`            | Tests unitaires client                                    |
| `pnpm test:e2e`             | Tests E2E (Playwright)                                    |
| `pnpm lint`                 | Linter tous les projets                                   |
| `pnpm format`               | Formater le code (Prettier)                               |
| `pnpm format:check`         | Vérifier le formatage                                     |
| `pnpm commit`               | Ouvrir le prompt interactif Commitizen                    |

---

## Contribuer

Voir [`CONTRIBUTING.md`](CONTRIBUTING.md) pour le workflow complet (branches, commits, PR, hooks).

**Résumé rapide :**

1. Créer une branche depuis `main` : `git checkout -b feat/ma-feature`
2. Implémenter + tester
3. Commiter avec un message [Conventional Commits](https://www.conventionalcommits.org/) via `pnpm commit` ou en respectant le format `feat(web): ajouter le formulaire de contact`
4. Pousser et ouvrir une PR

Règle documentaire : toute évolution du codebase qui rend la documentation
inexacte doit inclure la mise à jour des fichiers `.md` concernés dans le même
changement.

---

## Documentation complémentaire

### Validation API

- [`docs/runbooks/CLI_TOOLS.md`](docs/runbooks/CLI_TOOLS.md) — commandes de validation API et de régression
- [`docs/runbooks/NIGHTLY_REGRESSION.md`](docs/runbooks/NIGHTLY_REGRESSION.md) — workflow nocturne de régression stricte

| Document                                                                                             | Contenu                                            |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| [`CONTRIBUTING.md`](CONTRIBUTING.md)                                                                 | Workflow Git, conventions de commits, hooks, PR    |
| [`ARCHITECTURE.md`](ARCHITECTURE.md)                                                                 | Décisions d'architecture validées                  |
| [`AGENTS.md`](AGENTS.md)                                                                             | Règles de fonctionnement pour les assistants IA    |
| [`docs/runbooks/ENVIRONMENT_VARIABLES.md`](docs/runbooks/ENVIRONMENT_VARIABLES.md)                   | Variables d'environnement                          |
| [`docs/runbooks/SUPABASE_AUTH_SETUP.md`](docs/runbooks/SUPABASE_AUTH_SETUP.md)                       | Configuration Auth Supabase du MVP                 |
| [`docs/runbooks/DEV_MODE.md`](docs/runbooks/DEV_MODE.md)                                             | Guide détaillé du mode développement               |
| [`docs/runbooks/TECH_OVERVIEW.md`](docs/runbooks/TECH_OVERVIEW.md)                                   | Vue d'ensemble de la stack pour débutants          |
| [`docs/runbooks/OFFICIAL_DOCUMENTATION_SOURCES.md`](docs/runbooks/OFFICIAL_DOCUMENTATION_SOURCES.md) | Sources officielles des documentations de la stack |
| [`docs/runbooks/GITHUB_PROJECT_BOARD.md`](docs/runbooks/GITHUB_PROJECT_BOARD.md)                     | Pilotage du board GitHub Project                   |
| [`docs/specs/erd_mvp.md`](docs/specs/erd_mvp.md)                                                     | ERD complet commenté du modèle de données MVP      |
