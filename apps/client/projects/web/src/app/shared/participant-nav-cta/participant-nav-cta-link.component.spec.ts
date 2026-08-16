// apps\client\projects\web\src\app\shared\participant-nav-cta\participant-nav-cta-link.component.spec.ts

import { ApplicationInitStatus, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { environment } from '../../../environments/environment';
import { KraakI18nService, provideKraakI18n } from '../../../../../shared/i18n';
import { ParticipantNavCtaLink } from './participant-nav-cta-link.component';

@Component({
  standalone: true,
  template: '',
})
class BlankRouteComponent {}

async function compile(): Promise<void> {
  await TestBed.configureTestingModule({
    imports: [ParticipantNavCtaLink],
    providers: [
      provideKraakI18n(),
      provideRouter([
        {
          path: 'participant',
          children: [
            {
              path: 'dashboard',
              component: BlankRouteComponent,
            },
          ],
        },
      ]),
    ],
  }).compileComponents();

  await TestBed.inject(ApplicationInitStatus).donePromise;
}

describe('ParticipantNavCtaLink', () => {
  const originalConfig = globalThis.__KRAAK_RUNTIME_CONFIG__;

  afterEach(() => {
    globalThis.__KRAAK_RUNTIME_CONFIG__ = originalConfig;
  });

  describe('Given the participant area feature flag is enabled at runtime', () => {
    beforeEach(async () => {
      globalThis.__KRAAK_RUNTIME_CONFIG__ = { enableParticipantArea: true };
      await compile();
    });

    it('When the CTA renders in French Then it exposes the localized participant dashboard link', async () => {
      await TestBed.inject(KraakI18nService).setLocale('fr-CI');

      const fixture = TestBed.createComponent(ParticipantNavCtaLink);
      fixture.detectChanges();

      const participantCta = (
        fixture.nativeElement as HTMLElement
      ).querySelector('a[aria-label="Espace participant"]');

      expect(participantCta).toBeTruthy();
      expect(participantCta?.textContent).toContain('Espace participant');
      expect(participantCta?.getAttribute('href')).toBe(
        '/participant/dashboard',
      );
    });

    it('When the CTA renders in English Then it exposes the localized participant dashboard link', async () => {
      await TestBed.inject(KraakI18nService).setLocale('en-GB');

      const fixture = TestBed.createComponent(ParticipantNavCtaLink);
      fixture.detectChanges();

      const participantCta = (
        fixture.nativeElement as HTMLElement
      ).querySelector<HTMLAnchorElement>('a[aria-label="Participant area"]');

      expect(participantCta).toBeTruthy();
      expect(participantCta?.textContent?.trim()).toBe('Participant area');
      expect(participantCta?.getAttribute('href')).toBe(
        '/participant/dashboard',
      );
    });

    it('When the CTA is clicked Then it emits the activation event', async () => {
      const fixture = TestBed.createComponent(ParticipantNavCtaLink);
      const emitSpy = vi.fn();

      fixture.componentInstance.activated.subscribe(emitSpy);
      fixture.detectChanges();

      (
        fixture.nativeElement.querySelector(
          'a[aria-label="Espace participant"]',
        ) as HTMLAnchorElement
      ).click();

      await fixture.whenStable();

      expect(emitSpy).toHaveBeenCalled();
    });
  });

  describe('Given the participant area feature flag is disabled at runtime', () => {
    beforeEach(async () => {
      globalThis.__KRAAK_RUNTIME_CONFIG__ = { enableParticipantArea: false };
      await compile();
    });

    it('When the CTA renders Then it stays hidden', () => {
      const fixture = TestBed.createComponent(ParticipantNavCtaLink);
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;

      expect(
        element.querySelector('a[aria-label="Espace participant"]'),
      ).toBeNull();
      expect(element.textContent).not.toContain('Espace participant');
    });
  });

  describe('Given the runtime config is missing', () => {
    beforeEach(async () => {
      globalThis.__KRAAK_RUNTIME_CONFIG__ = undefined;
      await compile();
    });

    it('When the CTA renders Then it follows the environment default', () => {
      const fixture = TestBed.createComponent(ParticipantNavCtaLink);
      fixture.detectChanges();

      const participantCta = (
        fixture.nativeElement as HTMLElement
      ).querySelector('a[aria-label="Espace participant"]');

      if (environment.enableParticipantArea) {
        expect(participantCta).toBeTruthy();
        expect(participantCta?.getAttribute('href')).toBe(
          '/participant/dashboard',
        );
      } else {
        expect(participantCta).toBeNull();
      }
    });
  });

  describe('Given the runtime config arrives after the component is created', () => {
    beforeEach(async () => {
      globalThis.__KRAAK_RUNTIME_CONFIG__ = undefined;
      await compile();
    });

    it('When the CTA renders before runtime config is available Then it stays visible once the config arrives', () => {
      const fixture = TestBed.createComponent(ParticipantNavCtaLink);

      fixture.detectChanges();
      expect(
        (fixture.nativeElement as HTMLElement).querySelector(
          'a[aria-label="Espace participant"]',
        ),
      ).toBeTruthy();

      globalThis.__KRAAK_RUNTIME_CONFIG__ = { enableParticipantArea: true };

      fixture.detectChanges();

      expect(
        (fixture.nativeElement as HTMLElement).querySelector(
          'a[aria-label="Espace participant"]',
        ),
      ).toBeTruthy();
    });
  });
});
