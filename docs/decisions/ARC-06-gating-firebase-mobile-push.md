---
status: active
owner: platform
last_reviewed: 2026-07-23
source_of_truth: true
---

# ARC-06 — Gating natif des notifications push mobile sur Firebase

## Table des matières

- [ARC-06 — Gating natif des notifications push mobile sur Firebase](#arc-06-gating-natif-des-notifications-push-mobile-sur-firebase)
  - [Contexte](#contexte)
  - [Décision](#decision)
  - [Conséquences](#consequences)
  - [Conditions de levée](#conditions-de-levee)
  - [Liens](#liens)

- Statut : Acceptée
- Date : 2026-04-10
- Portée : `apps/client/projects/mobile`, `apps/client/capacitor.config.ts`, build Android Capacitor

## Contexte

Le service `MobilePushNotificationsService` intègre `@capacitor/push-notifications` pour préparer l'expérience d'annonces prioritaires (`MOB-05`, `ANN-04`). Le plugin natif Android contribue, via la fusion de manifeste (`merged AndroidManifest.xml`), un service `FirebaseMessagingService` instancié au démarrage de l'application.

Or, le projet Firebase Cloud Messaging de KRAAK n'est pas encore provisionné :

- aucun fichier `apps/client/android/app/google-services.json` n'est présent ;
- le plugin Gradle `com.google.gms.google-services` n'est appliqué que sous condition (`if (project.file('google-services.json').exists())`), donc actuellement non appliqué ;
- aucune métadonnée Firebase n'est présente dans le manifeste applicatif.

Résultat observé : à l'ouverture de l'APK staging sur appareil Android réel, Android tente d'instancier `FirebaseMessagingService` avant le rendu de la WebView, l'initialisation échoue (`Default FirebaseApp is not initialized in this process`) et le système affiche le dialogue « KRAAK closed because this app has a bug ». Le `try/catch` JavaScript du service ne peut pas intercepter cette exception native.

## Décision

Tant que Firebase n'est pas pleinement provisionné pour KRAAK Android, le build Capacitor exclut explicitement tous les plugins natifs Android via :

```ts
// apps/client/capacitor.config.ts
android: {
  includePlugins: [],
}
```

Ce whitelist vide empêche `cap sync` d'inclure `@capacitor/push-notifications` (et tout autre plugin natif futur) dans `capacitor.settings.gradle` / `capacitor.build.gradle`. Le manifest fusionné ne référence plus de `FirebaseMessagingService` et l'APK démarre normalement.

Côté JavaScript, aucun changement n'est nécessaire : `MobilePushNotificationsService` bascule déjà automatiquement sur son token stub lorsque le bridge natif n'expose pas le plugin (chemins `non-native`, `registration-error`, `initialization-error`).

## Conséquences

Positives :

- Suppression immédiate du crash au démarrage de l'APK staging.
- L'expérience web et le service JS restent fonctionnels avec leur fallback stub.
- L'ajout futur de Firebase devient explicite et contrôlable via une seule liste.

Négatives / à surveiller :

- Toute fonctionnalité mobile dépendant d'un plugin natif Android (par ex. `@capacitor/app`, `@capacitor/haptics`, futurs plugins) doit être ajoutée explicitement à `includePlugins` quand elle sera utilisée. La règle est testée par `scripts/verify-capacitor-android-plugins.test.mjs`.
- Les notifications push natives Android sont désactivées jusqu'à la mise en place de Firebase.

## Conditions de levée

Le whitelist sera ouvert (ou supprimé) lorsque les conditions suivantes seront réunies :

1. Un projet Firebase est créé pour KRAAK et `google-services.json` est présent sous `apps/client/android/app/`.
2. Le plugin Gradle `com.google.gms.google-services` est appliqué inconditionnellement dans `apps/client/android/app/build.gradle`.
3. Les permissions Android `POST_NOTIFICATIONS` et la métadonnée FCM par défaut sont déclarées dans le manifeste applicatif.
4. Une validation manuelle confirme que l'APK démarre et qu'un token FCM est obtenu.

Le test de garde `scripts/verify-capacitor-android-plugins.test.mjs` se désactive automatiquement dès qu'il détecte la présence de `google-services.json`, ce qui permet de retirer le whitelist sans casser la suite de tests.

## Liens

- Service concerné : `apps/client/projects/mobile/src/app/core/mobile-push-notifications.service.ts`
- Configuration Capacitor : `apps/client/capacitor.config.ts`
- Test de garde : `scripts/verify-capacitor-android-plugins.test.mjs`
- Runbook : `docs/operations/MOBILE_BUILD.md`
- Référence Capacitor : option `includePlugins` (`@capacitor/cli` v7.x)
