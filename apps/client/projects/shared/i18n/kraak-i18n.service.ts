import {
  computed,
  inject,
  Injectable,
  signal,
  type Signal,
} from '@angular/core';
import {
  FALLBACK_LOCALE,
  SOURCE_LOCALE,
  SUPPORTED_LOCALES,
  type SupportedLocale,
  normalizeLocaleCandidate,
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
import { firstValueFrom, from, type Observable } from 'rxjs';

import {
  KRAAK_TRANSLATION_CATALOGS,
  type KraakTranslationCatalog,
  type KraakTranslationCatalogs,
  isRecord,
  loadKraakTranslationCatalog,
  readKraakCatalogValue,
  resolveKraakTranslationCatalog,
} from './kraak-i18n.catalogs';

const KRAAK_LOCALE_STORAGE_KEY = 'kraak:locale';

function readStoredLocalePreference(): SupportedLocale | undefined {
  if (globalThis.window === undefined) {
    return undefined;
  }

  try {
    return normalizeLocaleCandidate(
      globalThis.window.localStorage.getItem(KRAAK_LOCALE_STORAGE_KEY),
    );
  } catch (error) {
    console.warn('client.i18n.preference-read-failed', { error });
    return undefined;
  }
}

function readBrowserLocalePreference(): SupportedLocale | undefined {
  if (globalThis.window === undefined || globalThis.navigator === undefined) {
    return undefined;
  }

  const candidates = [
    ...(globalThis.navigator.languages ?? []),
    globalThis.navigator.language,
  ];

  for (const candidate of candidates) {
    const locale = normalizeLocaleCandidate(candidate);

    if (locale) {
      return locale;
    }
  }

  return undefined;
}

function resolveInitialLocale(): SupportedLocale {
  return (
    readStoredLocalePreference() ??
    readBrowserLocalePreference() ??
    SOURCE_LOCALE
  );
}

function persistLocalePreference(locale: SupportedLocale): void {
  if (globalThis.window === undefined) {
    return;
  }

  try {
    globalThis.window.localStorage.setItem(KRAAK_LOCALE_STORAGE_KEY, locale);
  } catch (error) {
    console.warn('client.i18n.preference-write-failed', { error });
  }
}

function synchronizeDocumentLocale(locale: SupportedLocale): void {
  if (!globalThis.document?.documentElement) {
    return;
  }

  globalThis.document.documentElement.lang = locale;
}

export interface KraakI18n {
  readonly locale: Signal<SupportedLocale>;
  readonly ready: Signal<boolean>;

  setLocale(locale: string | null | undefined): Promise<void>;
  translate(key: string, params?: Readonly<Record<string, unknown>>): string;
}

export class KraakStaticTranslateLoader extends TranslateLoader {
  constructor(private readonly catalogs: KraakTranslationCatalogs) {
    super();
  }

  override getTranslation(lang: string): Observable<TranslationObject> {
    return from(
      loadKraakTranslationCatalog(this.catalogs, lang).catch((error) => {
        console.warn('client.i18n.catalog-load-failed', { lang, error });
        throw error;
      }),
    );
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
  private readonly loadedCatalogs: Partial<
    Record<SupportedLocale, KraakTranslationCatalog>
  > = {};
  private readonly registeredLocales = new Set<SupportedLocale>();
  private readonly pendingCatalogLoads = new Map<
    SupportedLocale,
    Promise<void>
  >();
  private readonly initialized = signal(false);
  private initializationPromise: Promise<void> | undefined;
  private localeSelectionSequence = 0;

  readonly locale = computed<SupportedLocale>(() =>
    resolveSupportedLocale(
      this.translateService.currentLang() ?? SOURCE_LOCALE,
    ),
  );

  readonly ready = computed(
    () =>
      this.initialized() &&
      !this.translateService.isLoading() &&
      this.translateService.getCurrentLang() !== null,
  );

  async initialize(): Promise<void> {
    if (this.initialized()) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    const initialization = this.initializeOnce().finally(() => {
      this.initializationPromise = undefined;
    });

    this.initializationPromise = initialization;

    return initialization;
  }

  private async initializeOnce(): Promise<void> {
    this.translateService.addLangs([...SUPPORTED_LOCALES]);

    await this.registerCatalog(FALLBACK_LOCALE);

    await firstValueFrom(
      this.translateService.setFallbackLang(FALLBACK_LOCALE),
    );

    await this.selectLocale(resolveInitialLocale());

    synchronizeDocumentLocale(this.locale());

    this.initialized.set(true);
  }

  async setLocale(localeCandidate: string | null | undefined): Promise<void> {
    await this.selectLocale(resolveSupportedLocale(localeCandidate));

    const effectiveLocale = this.locale();
    persistLocalePreference(effectiveLocale);
    synchronizeDocumentLocale(effectiveLocale);
  }

  translate(
    key: string,
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
    const availableCatalogs: KraakTranslationCatalogs = {
      ...this.catalogs,
      ...this.loadedCatalogs,
    };

    const catalog = resolveKraakTranslationCatalog(
      availableCatalogs,
      localeCandidate,
    );

    const value = readKraakCatalogValue(catalog, 'primeng');

    if (isRecord(value)) {
      return value;
    }

    const fallbackValue = readKraakCatalogValue(
      resolveKraakTranslationCatalog(availableCatalogs, FALLBACK_LOCALE),
      'primeng',
    );

    return isRecord(fallbackValue) ? fallbackValue : {};
  }

  private selectLocale(locale: SupportedLocale): Promise<void> {
    const selectionSequence = ++this.localeSelectionSequence;

    return this.selectLocaleOnce(locale, selectionSequence);
  }

  private async selectLocaleOnce(
    locale: SupportedLocale,
    selectionSequence: number,
  ): Promise<void> {
    if (this.locale() === locale && this.ready()) {
      return;
    }

    try {
      await this.registerCatalog(locale);

      if (selectionSequence !== this.localeSelectionSequence) {
        return;
      }

      await firstValueFrom(this.translateService.use(locale));
    } catch (error) {
      if (selectionSequence !== this.localeSelectionSequence) {
        return;
      }

      console.warn('client.i18n.locale-switch-fallback', {
        locale,
        error,
      });

      await this.registerCatalog(FALLBACK_LOCALE);

      if (selectionSequence !== this.localeSelectionSequence) {
        return;
      }

      await firstValueFrom(this.translateService.use(FALLBACK_LOCALE));
    }
  }

  private async registerCatalog(locale: SupportedLocale): Promise<void> {
    if (this.registeredLocales.has(locale)) {
      return;
    }

    const catalog = await loadKraakTranslationCatalog(this.catalogs, locale);

    this.loadedCatalogs[locale] = catalog;

    this.translateService.setTranslation(locale, catalog, false);

    this.registeredLocales.add(locale);
  }
}

function stringifyTranslation(value: Translation, key: string): string {
  if (typeof value === 'string') {
    return value;
  }

  if (value === undefined || value === null) {
    return missingKeyValue(key);
  }

  return String(value);
}

function missingKeyValue(key: string): string {
  return `[missing:${key}]`;
}
