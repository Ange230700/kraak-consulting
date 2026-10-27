# Evidence DEP-08 - Epic Deployment pilot launch

## Table des matières

- [Evidence DEP-08 - Epic Deployment pilot launch](#evidence-dep-08-epic-deployment-pilot-launch)
  - [Commandes et sorties clefs](#commandes-et-sorties-clefs)
    - [1) Lint](#1-lint)
    - [2) Typecheck](#2-typecheck)
    - [3) Tests scripts workspace](#3-tests-scripts-workspace)
    - [4) Check observabilité pilote](#4-check-observabilite-pilote)
    - [5) Vérification directe API health](#5-verification-directe-api-health)
  - [Conclusion evidence](#conclusion-evidence)

Date: 2026-04-30
Issue: #158

## Commandes et sorties clefs

### 1) Lint

Commande:

```bash
pnpm lint
```

Résultat:

- succès sur les 6 projets du workspace (`apps/client`, `apps/api`, `packages/*`)

### 2) Typecheck

Commande:

```bash
pnpm typecheck
```

Résultat:

- succès sur web, mobile et api

### 3) Tests scripts workspace

Commande:

```bash
pnpm test:workspace
```

Résultat:

- 15 tests
- 15 passes
- 0 échec

### 4) Check observabilité pilote

Commande:

```bash
KRAAK_OBSERVABILITY_WEB_URL=https://kraak-web-prod.onrender.com KRAAK_OBSERVABILITY_API_URL=https://kraak-api-staging.onrender.com pnpm check:observability
```

Résultat:

- échec: `web-home a retourné le statut HTTP 401 au lieu de 200.`

### 5) Vérification directe API health

Commande:

```bash
curl -sS -o /tmp/api_health.json -w "%{http_code}\n" https://kraak-api-staging.onrender.com/health
cat /tmp/api_health.json
```

Résultat:

- HTTP: `200`
- payload: `{"status":"ok"}`

## Conclusion evidence

1. Le socle de qualité local est valide pour l'epic DEP.
2. Le check runtime API est accessible.
3. Le check runtime web public est bloqué (401) et doit être corrigé avant validation finale sans réserve.
