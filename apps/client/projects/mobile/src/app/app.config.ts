import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideAppInitializer,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app.routes';
import { provideMobilePushNotificationsInitialization } from './core/mobile-push-notifications.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideIonicAngular(),
    provideAppInitializer(() => {
      const initializeMobilePushNotifications =
        provideMobilePushNotificationsInitialization();

      void Promise.resolve(initializeMobilePushNotifications()).catch(
        () => undefined,
      );
    }),
  ],
};
