# Guide de build mobile (Capacitor Android / iOS)

Ce runbook décrit comment générer les projets natifs Android et iOS, lancer un build debug local, ouvrir le projet dans l'IDE natif, et tester avec le live-reload.

---

## Prérequis

| Outil          | Version recommandee / utilisee | Remarque                                                  |
| -------------- | ------------------------------ | --------------------------------------------------------- |
| Node.js        | 24.14.1                        | version utilisee via `.nvmrc`                             |
| pnpm           | 10.23.0                        | version utilisee via `packageManager` dans `package.json` |
| JDK            | 21+                            | Temurin recommande, necessaire pour Gradle / Android      |
| Android Studio | Hedgehog (2023.1.1)+           | Installe le SDK Android et les emulateurs                 |
| Xcode          | 16+                            | macOS uniquement, necessaire pour les builds iOS          |
| CocoaPods      | 1.13+                          | macOS uniquement, `sudo gem install cocoapods`            |

---

## Configuration locale persistante

Pour que les builds Android fonctionnent sans specifier manuellement les chemins a chaque fois :

### Android SDK (`local.properties`)

Le fichier `apps/client/android/local.properties` est automatiquement généré à partir de votre installation locale d'Android Studio. Il ne doit pas être commité.

Vérification manuelle (si le build Gradle échoue sur "SDK location not found") :

```bash
# Verifier que le fichier existe
cat apps/client/android/local.properties

# Ou le recreer manuellement sur Windows
echo "sdk.dir=C:\\Users\\YOUR_USERNAME\\AppData\\Local\\Android\\Sdk" > apps/client/android/local.properties

# Sur macOS/Linux
echo "sdk.dir=$HOME/Library/Android/Sdk" > apps/client/android/local.properties
```

### JAVA_HOME et variables d'environnement

Si le build Gradle échoue sur "Unsupported class file major version" ou "Unknown Java version", le JDK actif est incompatible. Deux approches :

#### Option 1 : Configuration shell permanente (recommande)

Ajouter au profil shell (`.bashrc`, `.zshrc`, ou profil PowerShell) :

**Bash/Zsh** (~/.bashrc ou ~/.zshrc) :

```bash
export JAVA_HOME="$HOME/.jdks/openjdk-21" # ou le chemin vers votre JDK 21
export ANDROID_HOME="$HOME/Library/Android/Sdk" # macOS
# export ANDROID_HOME="$HOME/AppData/Local/Android/Sdk" # Windows
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$JAVA_HOME/bin:$PATH"
```

**PowerShell** ($PROFILE) :

```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
$env:ANDROID_HOME = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
```

#### Option 2 : Via helper script (siege)

Pour une approche isolee (une seule session) :

```bash
# Bash/Zsh
eval $(node scripts/setup-android-env.mjs --shell)

# PowerShell
node scripts/setup-android-env.mjs | Out-String | Invoke-Expression

# Ou executer directement une commande avec les envvars configures
node scripts/setup-android-env.mjs --run "pnpm build:debug:android"
```

---

## Generation des projets natifs

Les dossiers `android/` et `ios/` ne sont pas générés automatiquement.
Dans l'état actuel du dépôt, ils sont générés à la demande en local ou en CI.
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

APK généré dans `apps/client/android/app/build/outputs/apk/debug/app-debug.apk`.

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

> **Important : plugin natif désactivé temporairement.**
>
> Tant que le projet Firebase Cloud Messaging de KRAAK n'est pas provisionné (pas de `apps/client/android/app/google-services.json`, pas de plugin Gradle `com.google.gms.google-services` appliqué), le plugin `@capacitor/push-notifications` est explicitement exclu du build natif Android via `android.includePlugins: []` dans `apps/client/capacitor.config.ts`.
>
> Sans cette exclusion, Android tente d'instancier `FirebaseMessagingService` au démarrage, échoue avec `Default FirebaseApp is not initialized`, et fait planter l'APK avant le rendu de la WebView (dialogue système « KRAAK closed because this app has a bug »).
>
> Quand Firebase sera configuré, retirer `includePlugins: []` (ou y réintroduire `@capacitor/push-notifications`), commiter `google-services.json`, ajouter le plugin Gradle, puis ré-exécuter `pnpm cap:sync`. Le test de garde `scripts/verify-capacitor-android-plugins.test.mjs` se désactive automatiquement dès qu'il détecte la présence de `google-services.json`.

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

1. Démarrer le serveur de développement mobile :

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

Important : ne pas commiter le bloc `url` / `cleartext` dans le dépôt, il est réservé au développement local.

---

## CI - Debug APK automatique

Le job `android-debug` du pipeline CI (`.github/workflows/ci.yml`) :

- se declenche apres le job `build`
- installe Java 21 (Temurin)
- execute `pnpm build:debug:android`
- assemble le debug APK via `./gradlew assembleDebug`
- publie l'APK comme artefact GitHub Actions (`debug-apk`, retention 14 jours)

Le debug APK est accessible dans l'onglet Actions du dépôt GitHub, dans le résumé de chaque run CI réussi.

---

## Distribution interne de test (DEP-04)

Pour la procedure complete de distribution mobile interne (APK Android et TestFlight iOS), voir :

- `docs/runbooks/DEP-04_MOBILE_TEST_DISTRIBUTION_2026-04-30.md`
- `docs/runbooks/evidence/DEP-04_mobile-test-distribution-evidence_2026-04-30.md`
