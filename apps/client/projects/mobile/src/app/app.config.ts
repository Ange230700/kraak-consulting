import {
  ApplicationConfig,
  inject,
  Injector,
  provideAppInitializer,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app.routes';

function scheduleAfterFirstRender(task: () => void): void {
  if (
    globalThis.window !== undefined &&
    'requestIdleCallback' in globalThis.window
  ) {
    globalThis.window.requestIdleCallback(() => task());
    return;
  }

  setTimeout(task, 0);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideIonicAngular(),
    provideAppInitializer(() => {
      const injector = inject(Injector);

      scheduleAfterFirstRender(() => {
        void import('./core/mobile-push-notifications.service')
          .then(({ MobilePushNotificationsService }) =>
            injector.get(MobilePushNotificationsService).initialize(),
          )
          .catch((error) => {
            console.warn(
              'Mobile push notifications initialization skipped after first render.',
              error,
            );
            return undefined;
          });
      });
    }),
  ],
};
