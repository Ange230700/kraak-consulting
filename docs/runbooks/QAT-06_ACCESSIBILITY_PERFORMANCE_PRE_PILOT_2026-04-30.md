# QAT-06 - Checks accessibilité/performance pré-pilot

Date: 2026-04-30
Issue: #117
Scope: vérification pré-pilot web (routes marketing MVP)

## Objectif

Exécuter des checks accessibilité et performance sur les pages critiques MVP avant passage pilote, puis produire un plan d'action pour les écarts détectés.

## Dependances

- QAT-05: validé (campagne de régression exécutée et verte, voir `docs/runbooks/QAT-05_REGRESSION_2026-04-30.md`)
- WEB-05: checks a11y/performance exécutés sur les routes coeur web et evidence capturée dans ce runbook

## Commande executee

1. `pnpm check:prepilot:web`

Implementation technique associee:

- script npm: `check:prepilot:web` (workspace root)
- test Playwright dédié: `apps/client/tests/e2e/accessibility-performance.spec.ts`
- artefact JSON généré: `apps/client/test-results/qat-06/accessibility-performance-summary.json`
- artefact JSON conservé pour suivi: `docs/runbooks/evidence/QAT-06_accessibility-performance-summary_2026-04-30.json`

## Resultats par route

| Route         | Axe critical | Axe serious | DCL (ms) | Load (ms) | FCP (ms) |
| ------------- | -----------: | ----------: | -------: | --------: | -------: |
| `/`           |            0 |           0 |      739 |      1252 |      576 |
| `/services`   |            0 |           0 |      451 |       490 |      408 |
| `/programmes` |            0 |           0 |      222 |       223 |      212 |
| `/contact`    |            0 |           0 |      428 |       429 |      408 |

## Ecart detecte

Aucun écart `critical` ou `serious` détecté sur les routes couvertes.

## Plan d'action ecarts

1. Maintenir le seuil bloquant déjà ajouté dans le test (`critical + serious = 0` requis).
2. Conserver une exécution systématique de `pnpm check:prepilot:web` avant pilot et avant release.
3. Étendre progressivement la couverture aux routes participant authentifiées.

## Conclusion

- Checks pré-pilot exécutés: oui
- Evidence de validation ajoutée: oui (test dédié + artefact JSON + runbook)
- Blocage actuel: aucun sur le scope QAT-06 couvert
