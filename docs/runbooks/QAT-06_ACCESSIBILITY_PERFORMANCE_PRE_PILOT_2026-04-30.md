# QAT-06 - Checks accessibilité/performance pré-pilot

Date: 2026-04-30
Issue: #117
Scope: vérification pré-pilot web (surface vitrine publique complète + pages support statut)

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

| Route                           | Axe critical | Axe serious | Axe moderate | DCL (ms) | Load (ms) | FCP (ms) |
| ------------------------------- | -----------: | ----------: | -----------: | -------: | --------: | -------: |
| `/`                             |            0 |           0 |            0 |     3935 |      4213 |     2993 |
| `/a-propos`                     |            0 |           0 |            0 |     1765 |      2090 |      774 |
| `/services`                     |            0 |           0 |            0 |     1555 |      2113 |      365 |
| `/faq`                          |            0 |           0 |            0 |     1265 |      1606 |      689 |
| `/programmes`                   |            0 |           0 |            0 |      959 |      1154 |      459 |
| `/ressources`                   |            0 |           0 |            0 |      820 |      1021 |      249 |
| `/contact`                      |            0 |           0 |            0 |      867 |      1242 |      307 |
| `/mentions-legales`             |            0 |           0 |            3 |      618 |       750 |      185 |
| `/politique-de-confidentialite` |            0 |           0 |            3 |      797 |      1011 |      263 |
| `/401`                          |            0 |           0 |            0 |      561 |       663 |      176 |
| `/403`                          |            0 |           0 |            0 |      609 |       681 |      201 |
| `/404`                          |            0 |           0 |            0 |      533 |       612 |      167 |
| `/500`                          |            0 |           0 |            0 |      717 |       812 |      309 |

## Ecart detecte

Aucun écart `critical` ou `serious` détecté sur les routes couvertes.

Écarts `moderate` relevés:

1. `/mentions-legales`: 3 violations landmarks (`landmark-main-is-top-level`, `landmark-no-duplicate-main`, `landmark-unique`).
2. `/politique-de-confidentialite`: 3 violations landmarks (`landmark-main-is-top-level`, `landmark-no-duplicate-main`, `landmark-unique`).

## Plan d'action ecarts

1. Maintenir le seuil bloquant déjà ajouté dans le test (`critical + serious = 0` requis).
2. Corriger la structure landmarks des pages légales pour éliminer les violations `moderate` sans régression SEO/UI.
3. Conserver une exécution systématique de `pnpm check:prepilot:web` avant pilot et avant release.
4. Étendre la même logique de contrôle aux routes protégées dans la phase suivante.

## Conclusion

- Checks pré-pilot exécutés: oui
- Evidence de validation ajoutée: oui (test dédié + artefact JSON + runbook)
- Blocage actuel: aucun sur le scope QAT-06 couvert
