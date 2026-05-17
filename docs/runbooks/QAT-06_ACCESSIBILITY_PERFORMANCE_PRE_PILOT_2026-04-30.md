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
| `/`                             |            0 |           0 |            0 |     3239 |      3521 |     2466 |
| `/a-propos`                     |            0 |           0 |            0 |      651 |       823 |      224 |
| `/services`                     |            0 |           0 |            0 |      920 |      1152 |      346 |
| `/faq`                          |            0 |           0 |            0 |      833 |      1167 |      278 |
| `/programmes`                   |            0 |           0 |            0 |      812 |      1017 |      293 |
| `/ressources`                   |            0 |           0 |            0 |      741 |      1008 |      242 |
| `/contact`                      |            0 |           0 |            0 |      910 |      1167 |      359 |
| `/mentions-legales`             |            0 |           0 |            3 |      486 |       585 |      184 |
| `/politique-de-confidentialite` |            0 |           0 |            3 |      523 |       636 |      206 |
| `/401`                          |            0 |           0 |            0 |      543 |       642 |      164 |
| `/403`                          |            0 |           0 |            0 |      537 |       641 |      186 |
| `/404`                          |            0 |           0 |            0 |      509 |       591 |      168 |
| `/500`                          |            0 |           0 |            0 |      564 |       623 |      210 |

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
