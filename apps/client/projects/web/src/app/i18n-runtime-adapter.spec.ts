import { ApplicationInitStatus, Component, inject } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { renderApplication } from '@angular/platform-server';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PrimeNG, providePrimeNG } from 'primeng/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  KRAAK_TRANSLATION_CATALOGS,
  KRAAK_I18N_PROVIDER_MARKER,
  KraakPrimeNgI18nBridge,
  KraakI18nService,
  KraakTranslatePipe,
  provideKraakI18n,
  provideKraakPrimeNgI18nBridge,
} from '../../../shared/i18n';
import { appConfig } from './app.config';

@Component({
  imports: [KraakTranslatePipe],
  selector: 'kraak-web-i18n-host',
  standalone: true,
  template:
    '<p id="message">{{ "shared.prototype.greeting" | kraakTranslate: { name: name } }}</p>',
})
class WebI18nHost {
  readonly name = 'Awa';
  readonly i18n = inject(KraakI18nService);
}

async function waitForInitializers(): Promise<void> {
  await TestBed.inject(ApplicationInitStatus).donePromise;
}

describe('Given the web runtime i18n adapter', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('When the web app configuration is inspected, Then it declares the KRAAK i18n provider', () => {
    TestBed.configureTestingModule({
      providers: appConfig.providers,
    });

    expect(TestBed.inject(KRAAK_I18N_PROVIDER_MARKER)).toBe(true);
  });

  it('When the web provider is initialized, Then the adapter resolves with fr-CI as default locale', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        providePrimeNG({}),
        provideKraakI18n(),
        provideKraakPrimeNgI18nBridge(),
      ],
    });

    await waitForInitializers();

    const i18n = TestBed.inject(KraakI18nService);

    expect(i18n.locale()).toBe('fr-CI');
    expect(i18n.ready()).toBe(true);
  });

  it('When a translated host component renders, Then the French prototype value is visible', async () => {
    TestBed.configureTestingModule({
      imports: [WebI18nHost],
      providers: [provideRouter([]), provideKraakI18n()],
    });
    await waitForInitializers();

    const fixture = TestBed.createComponent(WebI18nHost);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('#message')?.textContent,
    ).toContain('Bonjour Awa');
  });

  it('When the locale switches to en-GB, Then the translated template updates', async () => {
    TestBed.configureTestingModule({
      imports: [WebI18nHost],
      providers: [provideRouter([]), provideKraakI18n()],
    });
    await waitForInitializers();

    const fixture = TestBed.createComponent(WebI18nHost);
    fixture.detectChanges();

    await fixture.componentInstance.i18n.setLocale('en-GB');
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('#message')?.textContent,
    ).toContain('Hello Awa');
  });

  it('When a named interpolation is translated in TypeScript, Then the parameter value is inserted', async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideKraakI18n()],
    });
    await waitForInitializers();

    const i18n = TestBed.inject(KraakI18nService);

    expect(i18n.translate('shared.prototype.greeting', { name: 'Koffi' })).toBe(
      'Bonjour Koffi',
    );
  });

  it('When a key is absent from every catalog, Then the missing-key policy is deterministic', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
      return undefined;
    });
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideKraakI18n()],
    });
    await waitForInitializers();

    const i18n = TestBed.inject(KraakI18nService);

    expect(i18n.translate('shared.prototype.absent')).toBe(
      '[missing:shared.prototype.absent]',
    );
    expect(warnSpy).toHaveBeenCalledWith('client.i18n.missing-key', {
      key: 'shared.prototype.absent',
    });
  });

  it('When the active catalog misses a key, Then fr-CI fallback text is returned', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideKraakI18n(),
        {
          provide: KRAAK_TRANSLATION_CATALOGS,
          useValue: {
            'fr-CI': {
              shared: { prototype: { greeting: 'Bonjour {{ name }}' } },
              primeng: { accept: 'Accepter' },
            },
            'en-GB': {
              shared: { prototype: {} },
              primeng: { accept: 'Accept' },
            },
          },
        },
      ],
    });
    await waitForInitializers();

    const i18n = TestBed.inject(KraakI18nService);
    await i18n.setLocale('en-GB');

    expect(i18n.translate('shared.prototype.greeting', { name: 'Awa' })).toBe(
      'Bonjour Awa',
    );
  });

  it('When an unsupported locale candidate is selected, Then the domain fallback locale is used', async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideKraakI18n()],
    });
    await waitForInitializers();

    const i18n = TestBed.inject(KraakI18nService);
    await i18n.setLocale('de-DE');

    expect(i18n.locale()).toBe('fr-CI');
  });

  it('When the selected catalog cannot load, Then the adapter falls back to fr-CI', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
      return undefined;
    });
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideKraakI18n(),
        {
          provide: KRAAK_TRANSLATION_CATALOGS,
          useValue: {
            'fr-CI': {
              shared: { prototype: { greeting: 'Bonjour {{ name }}' } },
              primeng: { accept: 'Accepter' },
            },
          },
        },
      ],
    });
    await waitForInitializers();

    const i18n = TestBed.inject(KraakI18nService);
    await i18n.setLocale('en-GB');

    expect(i18n.locale()).toBe('fr-CI');
    expect(warnSpy).toHaveBeenCalledWith(
      'client.i18n.locale-switch-fallback',
      expect.objectContaining({ locale: 'en-GB' }),
    );
  });

  it('When the same locale is selected repeatedly, Then the adapter remains ready and stable', async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideKraakI18n()],
    });
    await waitForInitializers();

    const i18n = TestBed.inject(KraakI18nService);

    await i18n.setLocale('fr-CI');
    await i18n.setLocale('fr-CI');

    expect(i18n.locale()).toBe('fr-CI');
    expect(i18n.ready()).toBe(true);
  });

  it('When concurrent locale selections target en-GB, Then both complete with the English locale active', async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideKraakI18n()],
    });
    await waitForInitializers();

    const i18n = TestBed.inject(KraakI18nService);

    await Promise.all([i18n.setLocale('en-GB'), i18n.setLocale('en-GB')]);

    expect(i18n.locale()).toBe('en-GB');
    expect(i18n.translate('shared.prototype.status')).toBe(
      'i18n adapter ready',
    );
  });

  it('When PrimeNG is initialized in French, Then the global translation table is applied', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        providePrimeNG({}),
        provideKraakI18n(),
        provideKraakPrimeNgI18nBridge(),
      ],
    });
    await waitForInitializers();

    TestBed.inject(KraakPrimeNgI18nBridge);
    const primeNg = TestBed.inject(PrimeNG);

    expect(primeNg.getTranslation('accept')).toBe('Accepter');
    expect(primeNg.translation.aria?.close).toBe('Fermer');
  });

  it('When the locale switches to en-GB, Then PrimeNG receives the English runtime translation', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        providePrimeNG({}),
        provideKraakI18n(),
        provideKraakPrimeNgI18nBridge(),
      ],
    });
    await waitForInitializers();

    const i18n = TestBed.inject(KraakI18nService);
    TestBed.inject(KraakPrimeNgI18nBridge);
    const primeNg = TestBed.inject(PrimeNG);

    await i18n.setLocale('en-GB');
    TestBed.tick();

    expect(primeNg.getTranslation('accept')).toBe('Accept');
    expect(primeNg.translation.aria?.close).toBe('Close');
  });

  it('When rendered on the server, Then the initial HTML contains translated French text', async () => {
    const html = await renderApplication(
      (context) =>
        bootstrapApplication(
          WebI18nHost,
          {
            providers: [provideKraakI18n()],
          },
          context,
        ),
      {
        document:
          '<!doctype html><html><body><kraak-web-i18n-host></kraak-web-i18n-host></body></html>',
        url: '/',
      },
    );

    expect(html).toContain('Bonjour Awa');
    expect(html).not.toContain('shared.prototype.greeting');
  });
});
