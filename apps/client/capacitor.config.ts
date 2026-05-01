import type { CapacitorConfig } from '@capacitor/cli';

// Filtrage volontairement vide des plugins natifs Android.
//
// Le plugin @capacitor/push-notifications intègre des composants Firebase
// Cloud Messaging (FirebaseMessagingService) qui sont initialisés par
// Android au démarrage de l'application. Sans google-services.json valide
// et sans application du plugin Gradle com.google.gms.google-services,
// l'initialisation de Firebase échoue ("Default FirebaseApp is not
// initialized") et fait planter l'APK avant le rendu de la WebView.
//
// Tant que Firebase n'est pas provisionné pour l'app KRAAK Android, on
// retire le plugin du build natif via includePlugins. Côté JS, le service
// MobilePushNotificationsService bascule alors automatiquement sur son
// stub de fallback. La liste sera réactivée une fois Firebase configuré.
const config: CapacitorConfig = {
  appId: 'com.kraak.mobile',
  appName: 'KRAAK',
  webDir: 'dist/mobile/browser',
  server: {
    androidScheme: 'https',
  },
  android: {
    includePlugins: [],
  },
};

export default config;
