import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { environment } from '../../../environments/environment';
import { Navbar } from './navbar.component';

async function compile(): Promise<void> {
  await TestBed.configureTestingModule({
    imports: [Navbar],
    providers: [provideRouter([])],
  }).compileComponents();
}

describe('Navbar', () => {
  const originalConfig = globalThis.__KRAAK_RUNTIME_CONFIG__;

  afterEach(() => {
    globalThis.__KRAAK_RUNTIME_CONFIG__ = originalConfig;
  });

  describe('Given the participant area feature flag is enabled at runtime', () => {
    beforeEach(async () => {
      globalThis.__KRAAK_RUNTIME_CONFIG__ = { enableParticipantArea: true };
      await compile();
    });

    it('When the navbar renders Then it shows the participant CTA', () => {
      const fixture = TestBed.createComponent(Navbar);
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      const brandImage = element.querySelector(
        'img[alt="Logo KRAAK Consulting"]',
      ) as HTMLImageElement | null;
      const participantCta = element.querySelector(
        'a[aria-label="Espace participant"]',
      ) as HTMLAnchorElement | null;
      const menuToggle = element.querySelector(
        'button[aria-label="Menu de navigation"]',
      ) as HTMLButtonElement | null;

      expect(element.querySelectorAll('.p-button').length).toBe(0);
      expect(menuToggle).toBeTruthy();
      expect(element.textContent).toContain('Espace participant');
      expect(brandImage?.getAttribute('src')).toContain('kraak-logo.png');
      expect(participantCta).toBeTruthy();
      expect(element.textContent).not.toContain('Accueil');
      expect(element.textContent).toContain('À propos');
    });
  });

  describe('Given the participant area feature flag is disabled at runtime', () => {
    beforeEach(async () => {
      globalThis.__KRAAK_RUNTIME_CONFIG__ = { enableParticipantArea: false };
      await compile();
    });

    it('When the navbar renders Then the participant CTA is hidden', () => {
      const fixture = TestBed.createComponent(Navbar);
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      const participantCta = element.querySelector(
        'a[aria-label="Espace participant"]',
      );
      const menuToggle = element.querySelector(
        'button[aria-label="Menu de navigation"]',
      );

      expect(participantCta).toBeNull();
      expect(element.textContent).not.toContain('Espace participant');
      expect(menuToggle).toBeTruthy();
      expect(element.textContent).toContain('À propos');
    });
  });

  describe('Given the runtime config is missing', () => {
    beforeEach(async () => {
      globalThis.__KRAAK_RUNTIME_CONFIG__ = undefined;
      await compile();
    });

    it('When the navbar renders Then it provides a named navigation landmark', () => {
      const fixture = TestBed.createComponent(Navbar);
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      const navigation = element.querySelector('nav');

      expect(navigation?.getAttribute('aria-label')).toBe(
        'Navigation principale',
      );
    });

    it('When the navbar renders Then the participant CTA follows the environment default', () => {
      const fixture = TestBed.createComponent(Navbar);
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      const participantCta = element.querySelector(
        'a[aria-label="Espace participant"]',
      );

      if (environment.enableParticipantArea) {
        expect(participantCta).toBeTruthy();
      } else {
        expect(participantCta).toBeNull();
      }
    });

    it('When toggleMobileMenu is called Then mobileMenuOpen toggles', () => {
      const fixture = TestBed.createComponent(Navbar);
      fixture.detectChanges();

      const component = fixture.componentInstance as unknown as {
        mobileMenuOpen: () => boolean;
        toggleMobileMenu: () => void;
        closeMobileMenu: () => void;
      };

      expect(component.mobileMenuOpen()).toBe(false);
      component.toggleMobileMenu();
      fixture.detectChanges();
      expect(component.mobileMenuOpen()).toBe(true);
      component.toggleMobileMenu();
      fixture.detectChanges();
      expect(component.mobileMenuOpen()).toBe(false);
    });

    it('When closeMobileMenu is called Then mobileMenuOpen is false', () => {
      const fixture = TestBed.createComponent(Navbar);
      fixture.detectChanges();

      const component = fixture.componentInstance as unknown as {
        mobileMenuOpen: () => boolean;
        toggleMobileMenu: () => void;
        closeMobileMenu: () => void;
      };

      component.toggleMobileMenu();
      fixture.detectChanges();
      expect(component.mobileMenuOpen()).toBe(true);

      component.closeMobileMenu();
      fixture.detectChanges();
      expect(component.mobileMenuOpen()).toBe(false);
    });
  });
});
