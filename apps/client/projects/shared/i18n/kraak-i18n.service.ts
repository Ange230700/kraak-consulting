import { computed, inject, Injectable, type Signal } from '@angular/core';
import {
  FALLBACK_LOCALE,
  SOURCE_LOCALE,
  SUPPORTED_LOCALES,
  type SupportedLocale,
  resolveSupportedLocale,
} from '@kraak/domain';
import {
  MissingTranslationHandler,
  TranslateLoader,
  TranslateService,
  type MissingTranslationHandlerParams,
  type Translation,
  type TranslationObject,
} from '@ngx-translate/core';
import { firstValueFrom, of, throwError, type Observable } from 'rxjs';

import {
  KRAAK_TRANSLATION_CATALOGS,
  type KraakTranslationCatalogs,
  isRecord,
  readKraakCatalogValue,
  resolveKraakTranslationCatalog,
} from './kraak-i18n.catalogs';

export type TranslationKey = string;

export interface KraakI18n {
  readonly locale: Signal<SupportedLocale>;
  readonly ready: Signal<boolean>;

  setLocale(locale: SupportedLocale | string | null | undefined): Promise<void>;
  translate(
    key: TranslationKey,
    params?: Readonly<Record<string, unknown>>,
  ): string;
}

export class KraakStaticTranslateLoader extends TranslateLoader {
  constructor(private readonly catalogs: KraakTranslationCatalogs) {
    super();
  }

  override getTranslation(lang: string): Observable<TranslationObject> {
    try {
      return of(resolveKraakTranslationCatalog(this.catalogs, lang));
    } catch (error) {
      console.warn('client.i18n.catalog-load-failed', { lang, error });
      return throwError(() => error);
    }
  }
}

@Injectable()
export class KraakMissingTranslationHandler extends MissingTranslationHandler {
  override handle(params: MissingTranslationHandlerParams): string {
    console.warn('client.i18n.missing-key', { key: params.key });
    return missingKeyValue(params.key);
  }
}

@Injectable()
export class KraakI18nService implements KraakI18n {
  private readonly translateService = inject(TranslateService);
  private readonly catalogs = inject(KRAAK_TRANSLATION_CATALOGS);
  private readonly registeredLocales = new Set<SupportedLocale>();
  private readonly pendingLocaleSelections = new Map<
    SupportedLocale,
    Promise<void>
  >();
  private initialized = false;

  readonly locale = computed<SupportedLocale>(() =>
    resolveSupportedLocale(
      this.translateService.currentLang() ?? SOURCE_LOCALE,
    ),
  );

  readonly ready = computed(
    () =>
      !this.translateService.isLoading() &&
      this.translateService.getCurrentLang() !== null,
  );

  constructor() {
    this.registerCatalog(FALLBACK_LOCALE);
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.translateService.addLangs([...SUPPORTED_LOCALES]);
    await firstValueFrom(
      this.translateService.setFallbackLang(FALLBACK_LOCALE),
    );
    await this.selectLocale(SOURCE_LOCALE);
    this.initialized = true;
  }

  setLocale(
    localeCandidate: SupportedLocale | string | null | undefined,
  ): Promise<void> {
    return this.selectLocale(resolveSupportedLocale(localeCandidate));
  }

  translate(
    key: TranslationKey,
    params: Readonly<Record<string, unknown>> = {},
  ): string {
    return stringifyTranslation(
      this.translateService.instant(key, params as Record<string, unknown>),
      key,
    );
  }

  primeNgTranslation(
    localeCandidate: string = this.locale(),
  ): Record<string, unknown> {
    const catalog = resolveKraakTranslationCatalog(
      this.catalogs,
      localeCandidate,
    );
    const value = readKraakCatalogValue(catalog, 'primeng');

    if (isRecord(value)) {
      return value;
    }

    const fallbackValue = readKraakCatalogValue(
      resolveKraakTranslationCatalog(this.catalogs, FALLBACK_LOCALE),
      'primeng',
    );

    return isRecord(fallbackValue) ? fallbackValue : {};
  }

  private selectLocale(locale: SupportedLocale): Promise<void> {
    const pendingSelection = this.pendingLocaleSelections.get(locale);

    if (pendingSelection) {
      return pendingSelection;
    }

    const selection = this.selectLocaleOnce(locale).finally(() => {
      this.pendingLocaleSelections.delete(locale);
    });

    this.pendingLocaleSelections.set(locale, selection);

    return selection;
  }

  private async selectLocaleOnce(locale: SupportedLocale): Promise<void> {
    if (this.locale() === locale && this.ready()) {
      return;
    }

    try {
      this.registerCatalog(locale);
      await firstValueFrom(this.translateService.use(locale));
    } catch (error) {
      console.warn('client.i18n.locale-switch-fallback', {
        locale,
        error,
      });
      this.registerCatalog(FALLBACK_LOCALE);
      await firstValueFrom(this.translateService.use(FALLBACK_LOCALE));
    }
  }

  private registerCatalog(locale: SupportedLocale): void {
    if (this.registeredLocales.has(locale)) {
      return;
    }

    const catalog = this.catalogs[locale];

    if (!catalog) {
      throw new Error(`Missing ${locale} i18n catalog.`);
    }

    this.translateService.setTranslation(locale, catalog, false);
    this.registeredLocales.add(locale);
  }
}

function stringifyTranslation(value: Translation, key: TranslationKey): string {
  if (typeof value === 'string') {
    return value;
  }

  if (value === undefined || value === null) {
    return missingKeyValue(key);
  }

  return String(value);
}

function missingKeyValue(key: TranslationKey): string {
  return `[missing:${key}]`;
}
