# Guide de build mobile (Capacitor Android / iOS)

Ce runbook decrit comment generer les projets natifs Android et iOS, lancer un build debug local, ouvrir le projet dans l'IDE natif, et tester avec le live-reload.

---

## Prerequis

| Outil          | Version recommandee / utilisee | Remarque                                                  |
| -------------- | ------------------------------ | --------------------------------------------------------- |
| Node.js        | 24.14.1                        | version utilisee via `.nvmrc`                             |
| pnpm           | 10.23.0                        | version utilisee via `packageManager` dans `package.json` |
| JDK            | 21+                            | Temurin recommande, necessaire pour Gradle / Android      |
| Android Studio | Hedgehog (2023.1.1)+           | Installe le SDK Android et les emulateurs                 |
| Xcode          | 16+                            | macOS uniquement, necessaire pour les builds iOS          |
| CocoaPods      | 1.13+                          | macOS uniquement, `sudo gem install cocoapods`            |

---

## Generation des projets natifs

Les dossiers `android/` et `ios/` ne sont pas generes automatiquement.
Dans l'etat actuel du depot, ils sont generes a la demande en local ou en CI.
Si vous devez preparer manuellement les plateformes natives, utilisez :

```bash
cd apps/client

# Generer le projet Android
npx cap add android

# Generer le projet iOS (macOS uniquement)
npx cap add ios
```

Le helper utilise par `pnpm build:debug:android` et `pnpm build:debug:ios` peut aussi creer la plateforme manquante automatiquement avant `cap sync`.
Les artefacts de build intermediaires restent exclus via `apps/client/.gitignore`.

---

## Build debug local

### Android

```bash
# Depuis la racine du monorepo
pnpm build:debug:android
```

Sous-jacent : `pnpm build:mobile`, creation de la plateforme Android si besoin, puis `cap sync android`

Pour assembler le debug APK via Gradle :

```bash
cd apps/client/android
./gradlew assembleDebug
```

APK genere dans `apps/client/android/app/build/outputs/apk/debug/app-debug.apk`.

### iOS (macOS uniquement)

```bash
# Depuis la racine du monorepo
pnpm build:debug:ios
```

Sous-jacent : `pnpm build:mobile`, creation de la plateforme iOS si besoin, puis `cap sync ios`

---

## Travailler avec un environnement precis

Les commandes `build:debug:*` s'appuient sur `pnpm build:mobile`, donc sur la configuration standard du workspace.

Si vous devez preparer explicitement un build mobile avec les variables `local` ou `staging`, utilisez d'abord :

```bash
pnpm build:mobile:local
# ou
pnpm build:mobile:staging
```

Puis synchronisez les assets vers le projet natif :

```bash
pnpm cap:sync
```

---

## Ouvrir dans l'IDE natif

### Android Studio

```bash
pnpm --filter @kraak/client cap:open:android
```

### Xcode (macOS uniquement)

```bash
pnpm --filter @kraak/client cap:open:ios
```

---

## Synchronisation du build web vers natif

Apres chaque modification du code Angular, synchroniser les assets vers les projets natifs :

```bash
pnpm cap:sync
```

Pour copier uniquement sans mettre a jour les plugins :

```bash
pnpm --filter @kraak/client cap:copy
```

---

## Notifications push stub (MOB-05)

Le mobile inclut un service de base `MobilePushNotificationsService` pour le wiring FCM initial.

Objectif du stub MVP :

- initialiser la chaine Capacitor Push Notifications au demarrage de l'application
- retourner un token device (token FCM en natif, token stub en fallback)
- preparer les listeners minimaux pour la suite des travaux (`ANN-04`)

Fichiers reliés :

- `apps/client/projects/mobile/src/app/core/mobile-push-notifications.service.ts`
- `apps/client/projects/mobile/src/app/core/mobile-push-notifications.service.spec.ts`
- `apps/client/projects/mobile/src/app/app.config.ts`

Comportement attendu :

- plateforme web ou permissions refusees : token stub `stub-mobile-token-<env>-<raison>`
- plateforme native + permissions accordees : tentative d'enregistrement FCM via `@capacitor/push-notifications`
- timeout d'enregistrement : fallback automatique vers token stub

Verification rapide :

```bash
pnpm --filter @kraak/client test:mobile
```

ANN-04 (notification push annonce prioritaire) ajoute sur ce wiring :

- detection des payloads `priority` en `high` ou `critical` pour les annonces
- conservation du dernier payload prioritaire recu via le signal `lastPriorityAnnouncementPush`
- navigation automatique vers `/tabs/annonces/:announcementId` lors de l'action utilisateur sur la notification

---

## Test avec live-reload (appareil physique ou emulateur)

1. Demarrer le serveur de developpement mobile :

```bash
pnpm dev:mobile
```

1. Dans `apps/client/capacitor.config.ts`, ajouter ou completer les proprietes `server.url` et `cleartext` dans l'objet `server` :

```typescript
server: {
  androidScheme: 'https',
  // Remplacer par l'adresse IP locale de votre machine :
  url: 'http://192.168.x.x:4300',
  cleartext: true,
},
```

1. Synchroniser la config puis ouvrir dans l'IDE :

```bash
pnpm cap:sync
pnpm --filter @kraak/client cap:open:android
# ou
pnpm --filter @kraak/client cap:open:ios
```

1. Lancer l'app depuis Android Studio ou Xcode sur un emulateur ou un appareil connecte.

Important : ne pas commiter le bloc `url` / `cleartext` dans le depot, il est reserve au developpement local.

---

## CI - Debug APK automatique

Le job `android-debug` du pipeline CI (`.github/workflows/ci.yml`) :

- se declenche apres le job `build`
- installe Java 21 (Temurin)
- execute `pnpm build:debug:android`
- assemble le debug APK via `./gradlew assembleDebug`
- publie l'APK comme artefact GitHub Actions (`debug-apk`, retention 14 jours)

Le debug APK est accessible dans l'onglet Actions du depot GitHub, dans le resume de chaque run CI reussi.

---

## Distribution interne de test (DEP-04)

Pour la procedure complete de distribution mobile interne (APK Android et TestFlight iOS), voir :

- `docs/runbooks/DEP-04_MOBILE_TEST_DISTRIBUTION_2026-04-30.md`
- `docs/runbooks/evidence/DEP-04_mobile-test-distribution-evidence_2026-04-30.md`
