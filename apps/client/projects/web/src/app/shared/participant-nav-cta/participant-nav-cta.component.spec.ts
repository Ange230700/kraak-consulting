// apps\client\projects\web\src\app\shared\participant-nav-cta\participant-nav-cta.component.spec.ts

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ParticipantNavCta } from './participant-nav-cta.component';

async function compile(): Promise<void> {
  await TestBed.configureTestingModule({
    imports: [ParticipantNavCta],
    providers: [provideRouter([{ path: 'participant', children: [] }])],
  }).compileComponents();
}

describe('ParticipantNavCta', () => {
  const originalConfig = globalThis.__KRAAK_RUNTIME_CONFIG__;

  afterEach(() => {
    globalThis.__KRAAK_RUNTIME_CONFIG__ = originalConfig;
  });

  describe('Given the participant area feature flag is enabled at runtime', () => {
    beforeEach(async () => {
      globalThis.__KRAAK_RUNTIME_CONFIG__ = { enableParticipantArea: true };
      await compile();
    });

    it('When the CTA wrapper renders Then it exposes the participant link', () => {
      const fixture = TestBed.createComponent(ParticipantNavCta);
      fixture.detectChanges();

      const participantCta = (
        fixture.nativeElement as HTMLElement
      ).querySelector('a[aria-label="Espace participant"]');

      expect(participantCta).toBeTruthy();
      expect(participantCta?.textContent).toContain('Espace participant');
    });

    it('When the CTA link is clicked Then the wrapper emits the activation event', () => {
      const fixture = TestBed.createComponent(ParticipantNavCta);
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

    it('When the wrapper notifies activation directly Then it emits the activation event', () => {
      const fixture = TestBed.createComponent(ParticipantNavCta);
      const emitSpy = vi.fn();

      fixture.componentInstance.activated.subscribe(emitSpy);
      fixture.componentInstance['notifyActivated']();

      expect(emitSpy).toHaveBeenCalled();
    });
  });

  describe('Given the participant area feature flag is disabled at runtime', () => {
    beforeEach(async () => {
      globalThis.__KRAAK_RUNTIME_CONFIG__ = { enableParticipantArea: false };
      await compile();
    });

    it('When the CTA wrapper renders Then it stays hidden', () => {
      const fixture = TestBed.createComponent(ParticipantNavCta);
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

    it('When the CTA wrapper renders Then it still includes the child CTA component', () => {
      const fixture = TestBed.createComponent(ParticipantNavCta);
      fixture.detectChanges();

      expect(
        (fixture.nativeElement as HTMLElement).querySelector(
          'kraak-participant-nav-cta-link',
        ),
      ).toBeTruthy();
    });
  });
});
