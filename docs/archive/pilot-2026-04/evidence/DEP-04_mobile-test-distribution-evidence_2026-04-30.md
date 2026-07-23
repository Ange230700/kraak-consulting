# Evidence DEP-04 - Distribution mobile test

Date: 2026-04-30  
Issue: #121

## 1) Validation dépendance MOB-04

Commande exécutée:

```bash
pnpm build:debug:android
```

Résultat:

- statut: succès
- build mobile Angular: OK
- sync Capacitor Android: OK
- plugin détecté: `@capacitor/push-notifications@7.0.6`
- warning connu: budget initial mobile dépassé (`703.79 kB` vs budget `600.00 kB`)

Indicateurs observables:

- output mobile généré dans `apps/client/dist/mobile`
- synchronisation Android terminée sans erreur

Référence infrastructure:

- job CI Android debug APK présent dans `.github/workflows/ci.yml` (job `android-debug`)
- artefact CI attendu: `debug-apk`

## 2) Validation dépendance QAT-04

Commande exécutée:

```bash
pnpm --filter @kraak/client e2e tests/e2e/participant-core-journey.spec.ts
```

Résultat:

- statut: succès
- tests exécutés: 2
- tests passés: 2
- échec: 0
- durée: ~34s

Scénario couvert:

- `Given un visiteur non authentifié, When il tente l'accès dashboard participant, Then il est redirigé vers l'accueil et orienté vers des pages publiques`
- `Given un visiteur en parcours participant, When il soumet une demande de contact, Then il reçoit un message de confirmation`

## 3) Statut acceptance DEP-04

- scope DEP-04 implémenté: oui (runbook de distribution interne Android/iOS)
- dépendances satisfaites (MOB-04, QAT-04): oui (preuves ci-dessus)
- evidence ajoutée: oui (ce document + runbook DEP-04)
