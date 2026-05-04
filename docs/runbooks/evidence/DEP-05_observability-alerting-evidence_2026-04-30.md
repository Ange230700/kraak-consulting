# Evidence DEP-05 - Observabilite et alerting minimum

Date: 2026-04-30

## Validation executee

### API health contract

Commande:

```bash
pnpm --filter @kraak/api test -- --runInBand src/app.controller.spec.ts src/app.service.spec.ts
```

Resultat:

- 2 suites passees
- 4 tests passes
- contrat `/health` valide avec `status`, `service`, `environment`, `timestamp`, `version`, `uptimeSeconds`

### Script d observabilite

Commande:

```bash
node --test ./scripts/check-observability.test.mjs
```

Resultat attendu:

- generation correcte des cibles web/API
- rejet explicite si le type de contenu ne correspond pas
- validation du payload `api-health`

### Typecheck cible

Commande:

```bash
pnpm typecheck:api
```

Resultat attendu:

- aucune erreur TypeScript sur le contrat de sante enrichi

## Couverture DEP-02 / DEP-03 verifiee

- DEP-02: deploiement web alimente le endpoint surveille `https://kraak-consulting.vercel.app`
- DEP-03: deploiement API expose `/health` et `render.yaml` reference `healthCheckPath: /health`

## Preuve structurelle ajoutee

- workflow GitHub planifie: `.github/workflows/observability.yml`
- runbook operationnel: `docs/runbooks/DEP-05_OBSERVABILITY_ALERTING_2026-04-30.md`
