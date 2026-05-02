# DEP-08 - Epic Deployment: lancement pilote maitrise

Date: 2026-04-30
Issue: #158
Scope: cloture epic DEP (preparation + execution pilote + verification de controle)

## Objectif

Consolider la cloture de l epic Deployment en validant les prerequis DEP-01 a DEP-08,
en rejouant les controles techniques critiques, et en statuant de maniere explicite
sur la capacite de lancement pilote maitrise.

## Etat des taches DEP

- DEP-01: CLOSED
- DEP-02: CLOSED
- DEP-03: CLOSED
- DEP-04: CLOSED
- DEP-05: CLOSED
- DEP-06: CLOSED
- DEP-07: CLOSED
- DEP-08: CLOSED

Verification realisee via GitHub CLI sur les issues `[TASK][DEP-*]`.

## Commandes executees (reverification)

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test:workspace`
4. `KRAAK_OBSERVABILITY_WEB_URL=https://kraak-group.vercel.app KRAAK_OBSERVABILITY_API_URL=https://kraak-api-staging.onrender.com pnpm check:observability`
5. `curl -sS -o /tmp/api_health.json -w "%{http_code}\\n" https://kraak-api-staging.onrender.com/health`

## Resultats

### Qualite statique et robustesse scripts

- `pnpm lint`: passe
- `pnpm typecheck`: passe
- `pnpm test:workspace`: passe (15 tests, 15 passes)

### Reverifications runtime pilote

- API pilot (`https://kraak-api-staging.onrender.com/health`): HTTP 200, payload observe `{"status":"ok"}`
- Web pilot (`https://kraak-group.vercel.app/`): HTTP 401 pendant le check d observabilite

## Decision de lancement maitrise

Decision: GO conditionnel avec action immediate de deblocage web.

Justification:

1. Le socle qualite local est vert (lint, typecheck, tests scripts).
2. Les dependances DEP sont toutes cloturees cote backlog.
3. Un ecart d exposition runtime est present sur la home web (401), ce qui doit etre traite avant execution pilote public sans friction.

## Actions de deblocage obligatoires

1. Verifier la configuration de protection du projet Vercel (Deployment Protection / Password / Trusted Access).
2. Restaurer un acces HTTP 200 public pour les routes critiques pilote (`/`, `/services`, `/programmes`, `/contact`).
3. Rejouer `pnpm check:observability` avec URLs pilote en variables d environnement.
4. Archiver la preuve de recheck dans `docs/runbooks/evidence/`.

## Blocages PR et contraintes de review

- Controle initial: aucune PR ouverte detectee pour l issue #158 au demarrage de cette execution.
- Traitement attendu pour cloture complete: ouvrir une PR de cloture EPIC DEP, laisser tourner les checks, traiter quality gate et contrainte de review obligatoire, puis merger et supprimer la branche.

## References

- `docs/runbooks/DEP-04_MOBILE_TEST_DISTRIBUTION_2026-04-30.md`
- `docs/runbooks/DEP-05_OBSERVABILITY_ALERTING_2026-04-30.md`
- `docs/runbooks/DEP-06_INCIDENT_ROLLBACK_PILOT_CHECKLIST_2026-04-30.md`
- `docs/runbooks/DEP-07_GO_NO_GO_PILOT_RELEASE_2026-04-30.md`
- `docs/runbooks/evidence/DEP-04_mobile-test-distribution-evidence_2026-04-30.md`
- `docs/runbooks/evidence/DEP-05_observability-alerting-evidence_2026-04-30.md`
- `docs/runbooks/evidence/DEP-06_incident-rollback-pilot-evidence_2026-04-30.md`
- `docs/runbooks/evidence/DEP-07_go-no-go-pilot-release-evidence_2026-04-30.md`
- `docs/runbooks/evidence/DEP-08_epic-deployment-pilot-launch-evidence_2026-04-30.md`
