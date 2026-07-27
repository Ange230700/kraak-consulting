import { ApplicationInitStatus, Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { describe, expect, it, beforeEach } from 'vitest';

import {
  KRAAK_I18N_PROVIDER_MARKER,
  KraakI18nService,
  KraakTranslatePipe,
  provideKraakI18n,
} from '../../../shared/i18n';
import { appConfig } from './app.config';

@Component({
  imports: [KraakTranslatePipe],
  selector: 'kraak-mobile-i18n-host',
  standalone: true,
  template:
    '<p id="message">{{ "shared.prototype.greeting" | kraakTranslate: { name: name } }}</p>',
})
class MobileI18nHost {
  readonly name = 'Awa';
  readonly i18n = inject(KraakI18nService);
}

async function waitForInitializers(): Promise<void> {
  await TestBed.inject(ApplicationInitStatus).donePromise;
}

describe('Given the mobile runtime i18n adapter', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('When the mobile app configuration is inspected, Then it declares the KRAAK i18n provider', () => {
    TestBed.configureTestingModule({
      providers: appConfig.providers,
    });

    expect(TestBed.inject(KRAAK_I18N_PROVIDER_MARKER)).toBe(true);
  });

  it('When the mobile provider is initialized, Then the adapter resolves with fr-CI as default locale', async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideKraakI18n()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });
    await waitForInitializers();

    const i18n = TestBed.inject(KraakI18nService);

    expect(i18n.locale()).toBe('fr-CI');
    expect(i18n.ready()).toBe(true);
  });

  it('When a translated mobile host renders, Then the French prototype text is visible', async () => {
    TestBed.configureTestingModule({
      imports: [MobileI18nHost],
      providers: [provideRouter([]), provideKraakI18n()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });
    await waitForInitializers();

    const fixture = TestBed.createComponent(MobileI18nHost);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('#message')?.textContent,
    ).toContain('Bonjour Awa');
  });

  it('When the mobile runtime switches to en-GB, Then the rendered value updates', async () => {
    TestBed.configureTestingModule({
      imports: [MobileI18nHost],
      providers: [provideRouter([]), provideKraakI18n()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });
    await waitForInitializers();

    const fixture = TestBed.createComponent(MobileI18nHost);
    fixture.detectChanges();

    await fixture.componentInstance.i18n.setLocale('en-GB');
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('#message')?.textContent,
    ).toContain('Hello Awa');
  });

  it('When an unsupported mobile locale is selected, Then fr-CI fallback remains active', async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideKraakI18n()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });
    await waitForInitializers();

    const i18n = TestBed.inject(KraakI18nService);
    await i18n.setLocale('es-ES');

    expect(i18n.locale()).toBe('fr-CI');
    expect(i18n.translate('shared.prototype.status')).toBe(
      'Adaptateur i18n prêt',
    );
  });

  it('When initialized without browser-only globals, Then the adapter still resolves translations', async () => {
    const originalWindowDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      'window',
    );

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: undefined,
    });

    try {
      TestBed.configureTestingModule({
        providers: [provideRouter([]), provideKraakI18n()],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
      });
      await waitForInitializers();

      const i18n = TestBed.inject(KraakI18nService);

      expect(i18n.translate('shared.prototype.greeting', { name: 'Awa' })).toBe(
        'Bonjour Awa',
      );
    } finally {
      if (originalWindowDescriptor) {
        Object.defineProperty(globalThis, 'window', originalWindowDescriptor);
      }
    }
  });
});
