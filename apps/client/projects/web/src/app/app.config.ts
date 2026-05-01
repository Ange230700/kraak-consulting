import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, TitleStrategy } from '@angular/router';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';

import { routes } from './app.routes';
import { KraakPreset } from './config/kraak-preset';
import { KraakErrorHandler } from './core/error-handler/kraak-error-handler';
import {
  AnalyticsService,
  GA4_MEASUREMENT_ID,
} from './core/analytics/analytics.service';
import { environment } from '../environments/environment';
import { SeoTitleStrategy } from './seo/seo-title.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    {
      provide: ErrorHandler,
      useClass: KraakErrorHandler,
    },
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch()),
    providePrimeNG({
      theme: {
        preset: KraakPreset,
        options: {
          darkModeSelector: false,
          cssLayer: {
            name: 'primeng',
            order: 'tailwind, primeng',
          },
        },
      },
    }),
    MessageService,
    {
      provide: TitleStrategy,
      useClass: SeoTitleStrategy,
    },
    { provide: GA4_MEASUREMENT_ID, useValue: environment.ga4Id },
    provideAppInitializer(() => {
      inject(AnalyticsService).initialize();
    }),
  ],
};
