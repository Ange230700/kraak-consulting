# Evidence DEP-08 - Epic Deployment pilot launch

Date: 2026-04-30
Issue: #158

## Commandes et sorties clefs

### 1) Lint

Commande:

```bash
pnpm lint
```

Resultat:

- succes sur les 6 projets du workspace (`apps/client`, `apps/api`, `packages/*`)

### 2) Typecheck

Commande:

```bash
pnpm typecheck
```

Resultat:

- succes sur web, mobile et api

### 3) Tests scripts workspace

Commande:

```bash
pnpm test:workspace
```

Resultat:

- 15 tests
- 15 passes
- 0 echec

### 4) Check observabilite pilote

Commande:

```bash
KRAAK_OBSERVABILITY_WEB_URL=https://kraak-consulting.vercel.app KRAAK_OBSERVABILITY_API_URL=https://kraak-api-staging.onrender.com pnpm check:observability
```

Resultat:

- echec: `web-home a retourne le statut HTTP 401 au lieu de 200.`

### 5) Verification directe API health

Commande:

```bash
curl -sS -o /tmp/api_health.json -w "%{http_code}\n" https://kraak-api-staging.onrender.com/health
cat /tmp/api_health.json
```

Resultat:

- HTTP: `200`
- payload: `{"status":"ok"}`

## Conclusion evidence

1. Le socle de qualite local est valide pour l epic DEP.
2. Le check runtime API est accessible.
3. Le check runtime web public est bloqué (401) et doit être corrigé avant validation finale sans réserve.
