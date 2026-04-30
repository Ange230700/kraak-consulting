# Evidence DEP-04 - Distribution mobile test

Date: 2026-04-30  
Issue: #121

## 1) Validation dependance MOB-04

Commande executee:

```bash
pnpm build:debug:android
```

Resultat:

- statut: succes
- build mobile Angular: OK
- sync Capacitor Android: OK
- plugin detecte: `@capacitor/push-notifications@7.0.6`
- warning connu: budget initial mobile depasse (`703.79 kB` vs budget `600.00 kB`)

Indicateurs observables:

- output mobile genere dans `apps/client/dist/mobile`
- synchronisation Android terminee sans erreur

Reference infrastructure:

- job CI Android debug APK present dans `.github/workflows/ci.yml` (job `android-debug`)
- artefact CI attendu: `debug-apk`

## 2) Validation dependance QAT-04

Commande executee:

```bash
pnpm --filter @kraak/client e2e tests/e2e/participant-core-journey.spec.ts
```

Resultat:

- statut: succes
- tests executes: 2
- tests passes: 2
- echec: 0
- duree: ~34s

Scenario couvert:

- `Given un visiteur non authentifie, When il tente l acces dashboard participant, Then il est redirige vers l accueil et oriente vers des pages publiques`
- `Given un visiteur en parcours participant, When il soumet une demande de contact, Then il recoit un message de confirmation`

## 3) Statut acceptance DEP-04

- scope DEP-04 implemente: oui (runbook de distribution interne Android/iOS)
- dependances satisfaites (MOB-04, QAT-04): oui (preuves ci-dessus)
- evidence ajoutee: oui (ce document + runbook DEP-04)
