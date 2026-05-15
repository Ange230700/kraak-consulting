# DEP-04 - Distribution mobile de test (APK / TestFlight interne)

Date: 2026-04-30  
Issue: #121  
Epic: DEP

## Objectif

Préparer un circuit de distribution interne pour le pilote mobile KRAAK:

- Android: APK debug partageable en interne
- iOS: build interne TestFlight (Internal Testing)
- procédure reproductible et traçable pour l'équipe

## Dépendances

- MOB-04: Capacitor Android/iOS et builds debug
- QAT-04: E2E Given/When/Then du parcours cœur participant

Statut pour DEP-04:

- MOB-04: satisfaite (scripts de build/debug mobiles disponibles et valides)
- QAT-04: satisfaite (suite E2E cœur participant exécutée et verte)

## Portée DEP-04

Cette tâche couvre:

- préparation des artefacts de test mobile pour partage interne
- standardisation des étapes de livraison Android/iOS en mode test
- collecte des preuves de validation avant bascule vers DEP-07

Cette tâche ne couvre pas:

- publication stores production
- signature/release finale publique

## Distribution Android interne (APK)

### Variante A - CI (recommande)

Le workflow GitHub Actions génère déjà un APK debug:

- workflow: `.github/workflows/ci.yml`
- job: `android-debug`
- artefact: `debug-apk`
- chemin artefact dans le build: `apps/client/android/app/build/outputs/apk/debug/app-debug.apk`

Procédure:

1. Push de la branche avec CI active.
2. Ouvrir l'onglet Actions du dépôt.
3. Attendre le succès du job `android-debug`.
4. Télécharger l'artefact `debug-apk`.
5. Partager l'APK au panel test interne (Drive/Slack/outil interne).

### Variante B - local (fallback)

Preconditions:

- JDK 21+
- Android SDK / Android Studio

Commandes:

```bash
pnpm build:debug:android
cd apps/client/android
./gradlew assembleDebug
```

APK produit:

- `apps/client/android/app/build/outputs/apk/debug/app-debug.apk`

## Distribution iOS interne (TestFlight)

Contrainte:

- le packaging TestFlight requiert macOS + Xcode + compte Apple Developer.

Preconditions macOS:

- Xcode 16+
- Apple Developer Team configurée
- App Store Connect accès Internal Testing

Procédure recommandée:

1. Préparer les assets web mobiles:

```bash
pnpm build:mobile
pnpm build:debug:ios
```

1. Ouvrir le projet iOS natif:

```bash
pnpm --filter @kraak/client cap:open:ios
```

1. Dans Xcode:

- sélectionner le scheme applicatif
- incrémenter `Version` / `Build`
- `Product > Archive`

1. Uploader l'archive vers App Store Connect.
2. Dans TestFlight:

- assigner le build au groupe `Internal Testing`
- ajouter les testeurs internes
- publier le build interne

## Checklist de validation DEP-04

- [x] Procédure APK interne documentée
- [x] Procédure TestFlight interne documentée
- [x] Dependance MOB-04 reliée à des commandes/scripts effectifs
- [x] Dependance QAT-04 vérifiée sur une suite E2E cœur participant
- [x] Preuves de validation ajoutées

## Artefacts de preuve

- `docs/runbooks/evidence/DEP-04_mobile-test-distribution-evidence_2026-04-30.md`
- `docs/runbooks/QAT-05_REGRESSION_2026-04-30.md`
- `docs/runbooks/MOBILE_BUILD.md`

## Risques résiduels

- iOS TestFlight non executable sur environnement Windows local.
- Signature iOS/Apple provisioning a réaliser sur machine macOS de release.

## Prochaine étape

- DEP-07: go/no-go pilote avec vérification de disponibilité des deux canaux de distribution interne.
