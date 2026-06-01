import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { environment } from '../../../environments/environment';
import { ParticipantNavCtaLink } from './participant-nav-cta-link.component';

async function compile(): Promise<void> {
  await TestBed.configureTestingModule({
    imports: [ParticipantNavCtaLink],
    providers: [provideRouter([{ path: 'participant', children: [] }])],
  }).compileComponents();
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

    it('When the CTA renders Then it exposes the participant link', () => {
      const fixture = TestBed.createComponent(ParticipantNavCtaLink);
      fixture.detectChanges();

      const participantCta = (
        fixture.nativeElement as HTMLElement
      ).querySelector('a[aria-label="Espace participant"]');

      expect(participantCta).toBeTruthy();
      expect(participantCta?.textContent).toContain('Espace participant');
    });

    it('When the CTA is clicked Then it emits the activation event', () => {
      const fixture = TestBed.createComponent(ParticipantNavCtaLink);
      const emitSpy = vi.fn();

      fixture.componentInstance.activated.subscribe(emitSpy);
      fixture.detectChanges();

      (
        fixture.nativeElement.querySelector(
          'a[aria-label="Espace participant"]',
        ) as HTMLAnchorElement
      ).click();

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
