import { InjectionToken } from '@angular/core';
import {
  FALLBACK_LOCALE,
  type SupportedLocale,
  resolveSupportedLocale,
} from '@kraak/domain';
import type { TranslationObject } from '@ngx-translate/core';

export type KraakTranslationCatalog = TranslationObject;

export type KraakTranslationCatalogs = Partial<
  Readonly<Record<SupportedLocale, KraakTranslationCatalog>>
>;

const EMPTY_KRAAK_TRANSLATION_CATALOGS = Object.freeze(
  {},
) satisfies KraakTranslationCatalogs;

/**
 * Optional in-memory catalog overrides.
 *
 * Production uses an empty override map and lazy-loads the locale JSON files.
 * Tests may override this token with deterministic in-memory catalogs.
 */
export const KRAAK_TRANSLATION_CATALOGS =
  new InjectionToken<KraakTranslationCatalogs>('KRAAK_TRANSLATION_CATALOGS', {
    providedIn: 'root',
    factory: () => EMPTY_KRAAK_TRANSLATION_CATALOGS,
  });

export async function loadKraakTranslationCatalog(
  catalogs: KraakTranslationCatalogs,
  localeCandidate: string | null | undefined,
): Promise<KraakTranslationCatalog> {
  const locale = resolveSupportedLocale(localeCandidate);
  const override = catalogs[locale];

  if (override) {
    return override;
  }

  /**
   * A non-empty injected map is an explicit override.
   *
   * If the requested locale is missing from it, fail instead of silently
   * loading production JSON. This preserves deterministic test behavior and
   * lets KraakI18nService exercise its normal fallback path.
   */
  if (Object.keys(catalogs).length > 0) {
    throw new Error(`Missing ${locale} i18n catalog.`);
  }

  switch (locale) {
    case 'fr-CI':
      return (await import('./catalogs/fr-CI.json'))
        .default as KraakTranslationCatalog;

    case 'en-GB':
      return (await import('./catalogs/en-GB.json'))
        .default as KraakTranslationCatalog;
  }
}

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
