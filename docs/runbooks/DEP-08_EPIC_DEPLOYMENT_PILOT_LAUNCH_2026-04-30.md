# DEP-08 - Epic Deployment: lancement pilote maîtrisé

Date: 2026-04-30
Issue: #158
Scope: clôture epic DEP (préparation + exécution pilote + vérification de contrôle)

## Objectif

Consolider la clôture de l'epic Deployment en validant les prérequis DEP-01 à DEP-08,
en rejouant les contrôles techniques critiques, et en statuant de manière explicite
sur la capacité de lancement pilote maîtrisé.

## Etat des taches DEP

- DEP-01: CLOSED
- DEP-02: CLOSED
- DEP-03: CLOSED
- DEP-04: CLOSED
- DEP-05: CLOSED
- DEP-06: CLOSED
- DEP-07: CLOSED
- DEP-08: CLOSED

Vérification réalisée via GitHub CLI sur les issues `[TASK][DEP-*]`.

## Commandes exécutées (revérification)

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test:workspace`
4. `KRAAK_OBSERVABILITY_WEB_URL=https://kraak-consulting.vercel.app KRAAK_OBSERVABILITY_API_URL=https://kraak-api-staging.onrender.com pnpm check:observability`
5. `curl -sS -o /tmp/api_health.json -w "%{http_code}\\n" https://kraak-api-staging.onrender.com/health`

## Résultats

### Qualité statique et robustesse scripts

- `pnpm lint`: passe
- `pnpm typecheck`: passe
- `pnpm test:workspace`: passe (15 tests, 15 passes)

### Revérifications runtime pilote

- API pilot (`https://kraak-api-staging.onrender.com/health`): HTTP 200, payload observé `{"status":"ok"}`
- Web pilot (`https://kraak-consulting.vercel.app/`): HTTP 401 pendant le check d'observabilité

## Décision de lancement maîtrisé

Décision : GO conditionnel avec action immédiate de déblocage web.

Justification:

1. Le socle qualité local est vert (lint, typecheck, tests scripts).
2. Les dépendances DEP sont toutes clôturées côté backlog.
3. Un écart d'exposition runtime est présent sur la home web (401), ce qui doit être traité avant exécution pilote public sans friction.

## Actions de déblocage obligatoires

1. Vérifier la configuration de protection du projet Vercel (Deployment Protection / Password / Trusted Access).
2. Restaurer un accès HTTP 200 public pour les routes critiques pilote (`/`, `/services`, `/programmes`, `/contact`).
3. Rejouer `pnpm check:observability` avec URLs pilote en variables d'environnement.
4. Archiver la preuve de recheck dans `docs/runbooks/evidence/`.

## Blocages PR et contraintes de review

- Contrôle initial : aucune PR ouverte détectée pour l'issue #158 au démarrage de cette exécution.
- Traitement attendu pour clôture complète : ouvrir une PR de clôture EPIC DEP, laisser tourner les checks, traiter quality gate et contrainte de review obligatoire, puis merger et supprimer la branche.

## Références

- `docs/runbooks/DEP-04_MOBILE_TEST_DISTRIBUTION_2026-04-30.md`
- `docs/runbooks/DEP-05_OBSERVABILITY_ALERTING_2026-04-30.md`
- `docs/runbooks/DEP-06_INCIDENT_ROLLBACK_PILOT_CHECKLIST_2026-04-30.md`
- `docs/runbooks/DEP-07_GO_NO_GO_PILOT_RELEASE_2026-04-30.md`
- `docs/runbooks/evidence/DEP-04_mobile-test-distribution-evidence_2026-04-30.md`
- `docs/runbooks/evidence/DEP-05_observability-alerting-evidence_2026-04-30.md`
- `docs/runbooks/evidence/DEP-06_incident-rollback-pilot-evidence_2026-04-30.md`
- `docs/runbooks/evidence/DEP-07_go-no-go-pilot-release-evidence_2026-04-30.md`
- `docs/runbooks/evidence/DEP-08_epic-deployment-pilot-launch-evidence_2026-04-30.md`
