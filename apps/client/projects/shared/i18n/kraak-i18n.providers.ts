import {
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  provideAppInitializer,
  type EnvironmentProviders,
} from '@angular/core';
import {
  provideMissingTranslationHandler,
  provideTranslateLoader,
  provideTranslateService,
} from '@ngx-translate/core';

import {
  KRAAK_TRANSLATION_CATALOGS,
  KRAAK_STATIC_TRANSLATION_CATALOGS,
} from './kraak-i18n.catalogs';
import {
  KraakI18nService,
  KraakMissingTranslationHandler,
  KraakStaticTranslateLoader,
} from './kraak-i18n.service';
import { FALLBACK_LOCALE, SOURCE_LOCALE } from '@kraak/domain';

export const KRAAK_I18N_PROVIDER_MARKER = new InjectionToken<boolean>(
  'KRAAK_I18N_PROVIDER_MARKER',
);

export function provideKraakI18n(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: KRAAK_I18N_PROVIDER_MARKER, useValue: true },
    {
      provide: KRAAK_TRANSLATION_CATALOGS,
      useValue: KRAAK_STATIC_TRANSLATION_CATALOGS,
    },
    provideTranslateService({
      fallbackLang: FALLBACK_LOCALE,
      lang: SOURCE_LOCALE,
      loader: provideTranslateLoader(
        () =>
          new KraakStaticTranslateLoader(inject(KRAAK_TRANSLATION_CATALOGS)),
      ),
      missingTranslationHandler: provideMissingTranslationHandler(
        KraakMissingTranslationHandler,
      ),
    }),
    KraakI18nService,
    provideAppInitializer(() => inject(KraakI18nService).initialize()),
  ]);
}
