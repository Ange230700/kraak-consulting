# Evidence DEP-07 - Go/No-Go Pilote et Release Pilote

Date: 2026-04-30  
Issue: #124

## Résumé de décision

**Décision** : ✅ **GO**  
**Date** : 2026-04-30  
**Tag release** : `pilot-2026-04-30`

---

## 1. Validation des dépendances

### DEP-02 — Pipeline déploiement web

**Statut** : ✅ Satisfaite

- Site pilote accessible : `https://kraak-consulting.vercel.app`
- Déploiements automatiques Vercel actifs sur `main`
- Routes critiques HTTP 200 validées par QAT-06

### DEP-03 — Pipeline déploiement API

**Statut** : ✅ Satisfaite

- API pilote accessible : `https://kraak-api-staging.onrender.com`
- `GET /health` opérationnel avec payload enrichi
- `render.yaml` configure `healthCheckPath: /health`
- Validation unitaire : 2 suites, 4 tests passés

### DEP-04 — Distribution mobile test

**Statut** : ✅ Satisfaite

- Runbook livré : `docs/runbooks/DEP-04_MOBILE_TEST_DISTRIBUTION_2026-04-30.md`
- Build Android debug validé
- E2E parcours participant : 2/2 passés
- Evidence : `docs/runbooks/evidence/DEP-04_mobile-test-distribution-evidence_2026-04-30.md`

### DEP-06 — Runbook incident + rollback + checklist

**Statut** : ✅ Satisfaite

- Runbook livré : `docs/runbooks/DEP-06_INCIDENT_ROLLBACK_PILOT_CHECKLIST_2026-04-30.md`
- Procédures d'incident et rollback documentées
- Checklist lancement pilot incluse
- Evidence : `docs/runbooks/evidence/DEP-06_incident-rollback-pilot-evidence_2026-04-30.md`

---

## 2. Grille go/no-go - Résultats

| #   | Critère                                       | Résultat | Source               |
| --- | --------------------------------------------- | -------- | -------------------- |
| 1   | Routes critiques web HTTP 200                 | ✅ GO    | DEP-02 / QAT-06      |
| 2   | `GET /health` API opérationnel                | ✅ GO    | DEP-03 / DEP-05      |
| 3   | Zéro violation accessibilité critical/serious | ✅ GO    | QAT-06 evidence JSON |
| 4   | E2E parcours cœur participant vert            | ✅ GO    | DEP-04 / QAT-04      |
| 5   | Runbook incident + rollback disponible        | ✅ GO    | DEP-06               |
| 6   | Workflow observabilité actif                  | ✅ GO    | DEP-05               |
| 7   | Distribution mobile test préparée             | ✅ GO    | DEP-04               |
| 8   | Tests unitaires critiques API passés          | ✅ GO    | QAT-03               |
| 9   | Tests de régression passés                    | ✅ GO    | QAT-05               |

## Résumé critères P0 : ✅ GO

---

## 3. Commandes de validation exécutées

### Vérification observabilité

```bash
KRAAK_OBSERVABILITY_WEB_URL=https://kraak-consulting.vercel.app \
KRAAK_OBSERVABILITY_API_URL=https://kraak-api-staging.onrender.com \
pnpm check:observability
```

Résultat attendu :

- `web-home: 200`
- `api-health: 200`
- résumé incluant `env=production` et `version=pilot-2026-04-30`

### Vérification test observabilité local

```bash
node --test ./scripts/check-observability.test.mjs
```

Résultat :

- validation correcte des cibles web/API
- rejet explicite si content-type incorrect
- validation du payload `api-health`

### Typecheck API

```bash
pnpm typecheck:api
```

Résultat : aucune erreur TypeScript

### Tests unitaires API

```bash
pnpm --filter @kraak/api test -- --runInBand src/app.controller.spec.ts src/app.service.spec.ts
```

Résultat : 2 suites, 4 tests passés

### E2E parcours participant

```bash
pnpm --filter @kraak/client e2e tests/e2e/participant-core-journey.spec.ts
```

Résultat : 2 tests passés en ~34s

---

## 4. Tag Git de release

```text
Tag : pilot-2026-04-30
Branche source : main
Commit : afb9ee2 (merge DEP-07)
```

Commandes exécutées :

```bash
git tag -a pilot-2026-04-30 -m "Release pilote KRAAK — 2026-04-30

Go/No-Go : GO
Périmètre : web (Vercel) + API (Render) + mobile debug (APK)
"
git push origin pilot-2026-04-30
```

---

## 5. Statut acceptance DEP-07

- [x] Scope DEP-07 implémenté : runbook go/no-go + evidence + tag release
- [x] Dépendances satisfaites (DEP-02, DEP-03, DEP-04, DEP-06) : oui (preuves ci-dessus)
- [x] Evidence de validation ajoutée : oui (ce document + runbook DEP-07)
