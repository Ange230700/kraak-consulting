import { InjectionToken } from '@angular/core';
import {
  FALLBACK_LOCALE,
  type SupportedLocale,
  resolveSupportedLocale,
} from '@kraak/domain';
import type { TranslationObject } from '@ngx-translate/core';

import enGbCatalog from './catalogs/en-GB.json';
import frCiCatalog from './catalogs/fr-CI.json';

export type KraakTranslationCatalog = TranslationObject;

export type KraakTranslationCatalogs = Partial<
  Readonly<Record<SupportedLocale, KraakTranslationCatalog>>
>;

export const KRAAK_TRANSLATION_CATALOGS =
  new InjectionToken<KraakTranslationCatalogs>('KRAAK_TRANSLATION_CATALOGS', {
    providedIn: 'root',
    factory: () => KRAAK_STATIC_TRANSLATION_CATALOGS,
  });

export const KRAAK_STATIC_TRANSLATION_CATALOGS = Object.freeze({
  'fr-CI': frCiCatalog as KraakTranslationCatalog,
  'en-GB': enGbCatalog as KraakTranslationCatalog,
}) satisfies Readonly<Record<SupportedLocale, KraakTranslationCatalog>>;

export function resolveKraakTranslationCatalog(
  catalogs: KraakTranslationCatalogs,
  localeCandidate: string | null | undefined,
): KraakTranslationCatalog {
  const locale = resolveSupportedLocale(localeCandidate);
  const catalog = catalogs[locale] ?? catalogs[FALLBACK_LOCALE];

  if (!catalog) {
    throw new Error(`Missing ${FALLBACK_LOCALE} i18n catalog.`);
  }

  return catalog;
}

export function readKraakCatalogValue(
  catalog: KraakTranslationCatalog,
  key: string,
): unknown {
  return key.split('.').reduce<unknown>((currentValue, segment) => {
    if (!isRecord(currentValue)) {
      return undefined;
    }

    return currentValue[segment];
  }, catalog);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
