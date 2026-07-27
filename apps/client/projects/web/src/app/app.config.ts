// apps\client\projects\web\src\app\app.config.ts

import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  provideRouter,
  TitleStrategy,
  withViewTransitions,
} from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
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
import { MlRuntimeService } from './core/ml/ml-runtime.service';
import { TFJS_CONFIG } from './core/ml/tfjs-config';
import { environment } from '../environments/environment';
import { SeoTitleStrategy } from './seo/seo-title.strategy';
import {
  provideKraakI18n,
  provideKraakPrimeNgI18nBridge,
} from '../../../shared/i18n';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    {
      provide: ErrorHandler,
      useClass: KraakErrorHandler,
    },
    provideRouter(routes, withViewTransitions()),
    provideClientHydration(),
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
    provideKraakI18n(),
    provideKraakPrimeNgI18nBridge(),
    MessageService,
    {
      provide: TitleStrategy,
      useClass: SeoTitleStrategy,
    },
    { provide: GA4_MEASUREMENT_ID, useValue: environment.ga4Id },
    {
      provide: TFJS_CONFIG,
      useValue: {
        backend: environment.tfjsBackend,
      },
    },
    provideAppInitializer(() => {
      inject(AnalyticsService).initialize();
    }),
    provideAppInitializer(() => inject(MlRuntimeService).initOnce()),
  ],
};
