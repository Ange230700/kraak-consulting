import { ApplicationInitStatus, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, of } from 'rxjs';
import { vi } from 'vitest';
import { PrimeNG } from 'primeng/config';
import { KraakPrimeNgI18nBridge } from '../../../shared/i18n/kraak-primeng-i18n';
import { KraakStaticTranslateLoader } from '../../../shared/i18n/kraak-i18n.service';
import {
  readKraakCatalogValue,
  resolveKraakTranslationCatalog,
} from '../../../shared/i18n/kraak-i18n.catalogs';

import { KRAAK_TRANSLATION_CATALOGS } from '../../../shared/i18n/kraak-i18n.catalogs';
import { provideKraakI18n } from '../../../shared/i18n/kraak-i18n.providers';
import { KraakI18nService } from '../../../shared/i18n/kraak-i18n.service';

describe('KraakI18nService', () => {
  beforeEach(async () => {
    globalThis.window.localStorage.setItem('kraak:locale', 'fr-CI');

    await TestBed.configureTestingModule({
      providers: [
        provideKraakI18n(),
        {
          provide: KRAAK_TRANSLATION_CATALOGS,
          useValue: {
            'fr-CI': {
              test: {
                locale: 'fr',
              },
            },
            'en-GB': {
              test: {
                locale: 'en',
              },
            },
          },
        },
      ],
    }).compileComponents();

    await TestBed.inject(ApplicationInitStatus).donePromise;
  });

  it('Given a locale is selected again while its earlier selection is pending, When competing selections overlap, Then the latest repeated locale wins', async () => {
    const i18n = TestBed.inject(KraakI18nService);

    const firstEnglishSelection = i18n.setLocale('en-GB');
    const frenchSelection = i18n.setLocale('fr-CI');
    const latestEnglishSelection = i18n.setLocale('en-GB');

    await Promise.all([
      firstEnglishSelection,
      frenchSelection,
      latestEnglishSelection,
    ]);

    expect(i18n.locale()).toBe('en-GB');
    expect(i18n.translate('test.locale')).toBe('en');
  });

  it('Given overlapping locale changes, When an older catalogue load resolves after the latest selection, Then the latest locale remains active', async () => {
    const i18n = TestBed.inject(KraakI18nService);

    expect(i18n.locale()).toBe('fr-CI');

    const olderSelection = i18n.setLocale('en-GB');
    const latestSelection = i18n.setLocale('fr-CI');

    await Promise.all([olderSelection, latestSelection]);

    expect(i18n.locale()).toBe('fr-CI');
    expect(i18n.translate('test.locale')).toBe('fr');
  });
});

describe('KraakI18nService cas de repli', () => {
  const catalogs = {
    'fr-CI': { message: 'Bonjour', primeng: { accept: 'Oui' } },
    'en-GB': { message: 'Hello' },
  };
  function setup(overrides: object = catalogs) {
    const currentLang = signal<string | null>(null);
    const translator = {
      currentLang,
      isLoading: signal(false),
      getCurrentLang: () => currentLang(),
      addLangs: vi.fn(),
      setFallbackLang: vi.fn(() => of({})),
      setTranslation: vi.fn(),
      use: vi.fn((locale: string) => {
        currentLang.set(locale);
        return of({});
      }),
      instant: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        KraakI18nService,
        { provide: TranslateService, useValue: translator },
        { provide: KRAAK_TRANSLATION_CATALOGS, useValue: overrides },
      ],
    });
    return { service: TestBed.inject(KraakI18nService), translator };
  }
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('Given une initialisation concurrente, When les deux appels aboutissent, Then le catalogue est enregistré une seule fois', async () => {
    const { service, translator } = setup();
    expect(service.locale()).toBe('fr-CI');
    await Promise.all([service.initialize(), service.initialize()]);
    await service.initialize();
    expect(translator.addLangs).toHaveBeenCalledTimes(1);
    expect(service.ready()).toBe(true);
  });

  it('Given un rendu serveur sans navigateur, When la langue est initialisée et modifiée, Then le français reste disponible', async () => {
    const { service } = setup();
    vi.stubGlobal('window', undefined);
    vi.stubGlobal('document', undefined);
    await service.initialize();
    await service.setLocale('fr-CI');
    expect(service.locale()).toBe('fr-CI');
  });

  it('Given un stockage inaccessible et aucun navigateur, When la langue est initialisée, Then le repli français fonctionne', async () => {
    const { service } = setup();
    vi.stubGlobal('window', {
      localStorage: {
        getItem: () => {
          throw new Error('Stockage inaccessible');
        },
        setItem: () => {
          throw new Error('Stockage inaccessible');
        },
      },
    });
    vi.stubGlobal('navigator', undefined);
    vi.stubGlobal('document', {});
    await service.initialize();
    await service.setLocale('en-GB');
    expect(service.locale()).toBe('en-GB');
  });

  it('Given une langue navigateur non prise en charge sans liste de langues, When la langue est initialisée, Then le français est retenu', async () => {
    const { service } = setup();
    vi.stubGlobal('window', { localStorage: { getItem: () => null } });
    vi.stubGlobal('navigator', { language: 'xx' });
    await service.initialize();
    expect(service.locale()).toBe('fr-CI');
  });

  it('Given un catalogue PrimeNG incomplet, When les traductions sont demandées, Then le catalogue français sert de repli', () => {
    const { service } = setup();
    expect(service.primeNgTranslation('en-GB')).toEqual({ accept: 'Oui' });
  });
  it('Given aucun contenu PrimeNG, When les traductions sont demandées, Then une table vide est retournée', () => {
    const { service } = setup({ 'fr-CI': {} });
    expect(service.primeNgTranslation()).toEqual({});
  });
  it('Given des valeurs traduites non textuelles, When elles sont affichées, Then les valeurs et clés manquantes sont converties explicitement', () => {
    const { service, translator } = setup();
    for (const [value, expected] of [
      [undefined, '[missing:test]'],
      [null, '[missing:test]'],
      [42, '42'],
    ] as const) {
      translator.instant.mockReturnValue(value);
      expect(service.translate('test')).toBe(expected);
    }
  });
  it('Given un catalogue manquant, When le chargeur est appelé, Then le rejet est tracé et propagé', async () => {
    const warning = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);
    await expect(
      firstValueFrom(
        new KraakStaticTranslateLoader({ 'fr-CI': {} }).getTranslation('en-GB'),
      ),
    ).rejects.toThrow('Missing en-GB');
    expect(warning).toHaveBeenCalled();
  });
  it('Given un catalogue absent ou une clé traversant un scalaire, When la valeur est résolue, Then le repli ou une absence explicite est retourné', () => {
    expect(
      resolveKraakTranslationCatalog(
        { 'fr-CI': { message: 'Bonjour' } },
        'en-GB',
      ),
    ).toEqual({ message: 'Bonjour' });
    expect(() => resolveKraakTranslationCatalog({}, 'en-GB')).toThrow(
      'Missing fr-CI',
    );
    expect(
      readKraakCatalogValue({ message: 'Bonjour' }, 'message.child'),
    ).toBeUndefined();
  });
  it('Given une ancienne sélection rejetée, When une sélection plus récente existe, Then cette dernière conserve la priorité', async () => {
    const { service } = setup({ 'fr-CI': {} });
    await Promise.all([service.setLocale('en-GB'), service.setLocale('fr-CI')]);
    expect(service.locale()).toBe('fr-CI');
  });
  it('Given une sélection interrompue pendant son repli, When une nouvelle langue est choisie, Then le repli obsolète ne remplace pas cette langue', async () => {
    const warning = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);
    const { service, translator } = setup({ 'fr-CI': {} });
    let latestSelection: Promise<void> | undefined;
    warning.mockImplementation(() => {
      latestSelection = service.setLocale('fr-CI');
    });
    await service.setLocale('en-GB');
    await latestSelection;
    expect(service.locale()).toBe('fr-CI');
    expect(translator.use).toHaveBeenCalledTimes(1);
    expect(warning).toHaveBeenCalled();
  });
  it('Given des traductions encore en chargement, When le pont PrimeNG est sollicité, Then aucune table incomplète n’est appliquée', () => {
    const ready = signal(false);
    const setTranslation = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        KraakPrimeNgI18nBridge,
        { provide: KraakI18nService, useValue: { ready } },
        { provide: PrimeNG, useValue: { setTranslation } },
      ],
    });
    const bridge = TestBed.inject(KraakPrimeNgI18nBridge);
    bridge.applyCurrentTranslations();
    TestBed.tick();
    expect(setTranslation).not.toHaveBeenCalled();
  });
});
