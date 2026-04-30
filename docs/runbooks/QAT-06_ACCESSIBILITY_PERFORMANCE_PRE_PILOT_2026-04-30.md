# QAT-06 - Checks accessibilite/performance pre-pilot

Date: 2026-04-30
Issue: #117
Scope: verification pre-pilot web (routes marketing MVP)

## Objectif

Executer des checks accessibilite et performance sur les pages critiques MVP avant passage pilote, puis produire un plan d'action pour les ecarts detectes.

## Dependances

- QAT-05: valide (campagne de regression executee et verte, voir `docs/runbooks/QAT-05_REGRESSION_2026-04-30.md`)
- WEB-05: checks a11y/performance executes sur les routes coeur web et evidence capturee dans ce runbook

## Commande executee

1. `pnpm check:prepilot:web`

Implementation technique associee:

- script npm: `check:prepilot:web` (workspace root)
- test Playwright dedie: `apps/client/tests/e2e/accessibility-performance.spec.ts`
- artefact JSON genere: `apps/client/test-results/qat-06/accessibility-performance-summary.json`
- artefact JSON conserve pour suivi: `docs/runbooks/evidence/QAT-06_accessibility-performance-summary_2026-04-30.json`

## Resultats par route

| Route         | Axe critical | Axe serious | DCL (ms) | Load (ms) | FCP (ms) |
| ------------- | -----------: | ----------: | -------: | --------: | -------: |
| `/`           |            0 |           0 |     1037 |      1154 |      836 |
| `/services`   |            0 |           0 |      390 |       415 |      360 |
| `/programmes` |            0 |           1 |      236 |       238 |      232 |
| `/contact`    |            0 |           0 |      399 |       400 |      376 |

## Ecart detecte

Un ecart accessibilite `serious` est detecte sur `/programmes`:

- Regle: `color-contrast`
- Description: Elements must meet minimum color contrast ratio thresholds
- Elements cibles:
  - `.rounded-card.p-6.bg-neutral-50:nth-child(1) > .text-4xl.text-accent.font-bold`
  - `.rounded-card.p-6.bg-neutral-50:nth-child(2) > .text-4xl.text-accent.font-bold`
  - `.rounded-card.p-6.bg-neutral-50:nth-child(3) > .text-4xl.text-accent.font-bold`

## Plan d'action ecarts

1. Ajuster la couleur du texte `.text-accent` (ou la couleur de fond des cartes) dans la section impact de la page Programmes pour atteindre le ratio de contraste minimum WCAG AA.
2. Reexecuter `pnpm check:prepilot:web` et verifier retour a `0` violation `critical/serious`.
3. Ajouter un check de seuil (fail build si `critical + serious > 0`) apres correction visuelle du point 1.

## Conclusion

- Checks pre-pilot executes: oui
- Evidence de validation ajoutee: oui (test dedie + artefact JSON + runbook)
- Blocage actuel: 1 ecart a11y `serious` a corriger avant passage pilote
