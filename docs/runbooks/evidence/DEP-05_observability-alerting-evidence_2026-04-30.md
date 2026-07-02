# Evidence DEP-05 - Observabilité et alerting minimum

Date: 2026-04-30

## Validation exécutée

### API health contract

Commande:

```bash
pnpm --filter @kraak/api test -- --runInBand src/app.controller.spec.ts src/app.service.spec.ts
```

Résultat:

- 2 suites passées
- 4 tests passés
- contrat `/health` valide avec `status`, `service`, `environment`, `timestamp`, `version`, `uptimeSeconds`

### Script d'observabilité

Commande:

```bash
node --test ./scripts/check-observability.test.mjs
```

Résultat attendu:

- generation correcte des cibles web/API
- rejet explicite si le type de contenu ne correspond pas
- validation du payload `api-health`

### Typecheck cible

Commande:

```bash
pnpm typecheck:api
```

Résultat attendu:

- aucune erreur TypeScript sur le contrat de santé enrichi

## Couverture DEP-02 / DEP-03 vérifiée

- DEP-02: déploiement web alimente le endpoint surveillé `https://kraak-web-prod.onrender.com`
- DEP-03: déploiement API expose `/health` et `render.yaml` référence `healthCheckPath: /health`

## Preuve structurelle ajoutée

- workflow GitHub planifie: `.github/workflows/observability.yml`
- runbook opérationnel: `docs/runbooks/DEP-05_OBSERVABILITY_ALERTING_2026-04-30.md`
