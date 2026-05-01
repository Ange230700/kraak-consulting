# ARC-06 — Gating natif des notifications push mobile sur Firebase

- Statut : Accepte
- Date : 2026-04-10
- Portee : `apps/client/projects/mobile`, `apps/client/capacitor.config.ts`, build Android Capacitor

## Contexte

Le service `MobilePushNotificationsService` integre `@capacitor/push-notifications` pour preparer l'experience d'annonces prioritaires (`MOB-05`, `ANN-04`). Le plugin natif Android contribue, via la fusion de manifeste (`merged AndroidManifest.xml`), un service `FirebaseMessagingService` instancie au demarrage de l'application.

Or, le projet Firebase Cloud Messaging de KRAAK n'est pas encore provisionne :

- aucun fichier `apps/client/android/app/google-services.json` n'est present ;
- le plugin Gradle `com.google.gms.google-services` n'est applique que sous condition (`if (project.file('google-services.json').exists())`), donc actuellement non applique ;
- aucune metadonnee Firebase n'est presente dans le manifeste applicatif.

Resultat observe : a l'ouverture de l'APK staging sur appareil Android reel, Android tente d'instancier `FirebaseMessagingService` avant le rendu de la WebView, l'initialisation echoue (`Default FirebaseApp is not initialized in this process`) et le systeme affiche le dialogue « KRAAK closed because this app has a bug ». Le `try/catch` JavaScript du service ne peut pas intercepter cette exception native.

## Decision

Tant que Firebase n'est pas pleinement provisionne pour KRAAK Android, le build Capacitor exclut explicitement tous les plugins natifs Android via :

```ts
// apps/client/capacitor.config.ts
android: {
  includePlugins: [],
}
```

Ce whitelist vide empeche `cap sync` d'inclure `@capacitor/push-notifications` (et tout autre plugin natif futur) dans `capacitor.settings.gradle` / `capacitor.build.gradle`. Le manifest fusionne ne reference plus de `FirebaseMessagingService` et l'APK demarre normalement.

Cote JavaScript, aucun changement n'est necessaire : `MobilePushNotificationsService` bascule deja automatiquement sur son token stub lorsque le bridge natif n'expose pas le plugin (chemins `non-native`, `registration-error`, `initialization-error`).

## Consequences

Positives :

- Suppression immediate du crash au demarrage de l'APK staging.
- L'experience web et le service JS restent fonctionnels avec leur fallback stub.
- L'ajout futur de Firebase devient explicite et controlable via une seule liste.

Negatives / a surveiller :

- Toute fonctionnalite mobile dependant d'un plugin natif Android (par ex. `@capacitor/app`, `@capacitor/haptics`, futurs plugins) doit etre ajoutee explicitement a `includePlugins` quand elle sera utilisee. La regle est testee par `scripts/verify-capacitor-android-plugins.test.mjs`.
- Les notifications push natives Android sont desactivees jusqu'a la mise en place de Firebase.

## Conditions de levee

Le whitelist sera ouvert (ou supprime) lorsque les conditions suivantes seront reunies :

1. Un projet Firebase est cree pour KRAAK et `google-services.json` est present sous `apps/client/android/app/`.
2. Le plugin Gradle `com.google.gms.google-services` est applique inconditionnellement dans `apps/client/android/app/build.gradle`.
3. Les permissions Android `POST_NOTIFICATIONS` et la metadata FCM par defaut sont declarees dans le manifeste applicatif.
4. Une validation manuelle confirme que l'APK demarre et qu'un token FCM est obtenu.

Le test de garde `scripts/verify-capacitor-android-plugins.test.mjs` se desactive automatiquement des qu'il detecte la presence de `google-services.json`, ce qui permet de retirer le whitelist sans casser la suite de tests.

## Liens

- Service concerne : `apps/client/projects/mobile/src/app/core/mobile-push-notifications.service.ts`
- Configuration Capacitor : `apps/client/capacitor.config.ts`
- Test de garde : `scripts/verify-capacitor-android-plugins.test.mjs`
- Runbook : `docs/runbooks/MOBILE_BUILD.md`
- Reference Capacitor : option `includePlugins` (`@capacitor/cli` v7.x)
