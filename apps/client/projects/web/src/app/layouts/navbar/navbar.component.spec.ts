// apps\client\projects\web\src\app\layouts\navbar\navbar.component.spec.ts

import { Location } from '@angular/common';
import { ApplicationInitStatus, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { KraakI18nService, provideKraakI18n } from '../../../../../shared/i18n';
import { Navbar } from './navbar.component';

@Component({
  standalone: true,
  template: '',
})
class BlankRouteComponent {}

interface NavbarInternals {
  links: { labelKey: string; pageId: string }[];
  mobileMenuOpen: () => boolean;
}

async function renderNavbarAt(
  path: string,
  locale: 'fr-CI' | 'en-GB',
): Promise<HTMLElement> {
  await TestBed.inject(Router).navigateByUrl(path);
  await TestBed.inject(KraakI18nService).setLocale(locale);

  const fixture = TestBed.createComponent(Navbar);
  fixture.detectChanges();

  return fixture.nativeElement as HTMLElement;
}

describe('Navbar', () => {
  const originalConfig = globalThis.__KRAAK_RUNTIME_CONFIG__;

  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.__KRAAK_RUNTIME_CONFIG__ = originalConfig;
  });
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [
        provideRouter([{ path: '**', component: BlankRouteComponent }]),
        provideKraakI18n(),
      ],
    }).compileComponents();

    await TestBed.inject(ApplicationInitStatus).donePromise;
  });

  it('Given la navbar est créée, When Angular initialise le composant, Then la configuration de base existe', () => {
    const fixture = TestBed.createComponent(Navbar);
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as NavbarInternals;
    expect(component.links).toHaveLength(5);
    expect(component.mobileMenuOpen()).toBe(false);
  });

  it('Given le rendu desktop, When la navbar est affichée, Then les liens principaux sont visibles', () => {
    const fixture = TestBed.createComponent(Navbar);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const navLinks = Array.from(host.querySelectorAll('a.kr-nav-link'));

    expect(navLinks.map((link) => link.textContent?.trim())).toEqual([
      'ACCUEIL',
      'SERVICES',
      'PROGRAMMES',
      'À PROPOS',
      'CONTACT',
    ]);

    const brandLink =
      host.querySelector<HTMLAnchorElement>('a.kr-navbar-brand');
    const companyName = brandLink?.querySelector('span') ?? null;

    expect(brandLink?.getAttribute('href')).toMatch(/^\/fr\/?$/);
    expect(companyName).not.toBeNull();
    expect(companyName?.classList.contains('hidden')).toBe(true);
    expect(companyName?.classList.contains('lg:inline')).toBe(true);
    expect(host.textContent).toContain('KRAAK Consulting');
  });

  it('Given le symbole KRAAK de la navbar, When le template est rendu, Then il est affiché avec un fond transparent', () => {
    const fixture = TestBed.createComponent(Navbar);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const symbol = host.querySelector('img[alt="Symbole KRAAK"]');

    expect(symbol).not.toBeNull();
    expect(symbol?.getAttribute('src')).toBe('/kraak_symbol.svg');
    expect(symbol?.classList.contains('bg-transparent')).toBe(true);
  });

  it('Given le menu mobile est fermé, When on clique sur le bouton menu, Then il s ouvre puis se referme au clic sur un lien', () => {
    const fixture = TestBed.createComponent(Navbar);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const button = host.querySelector(
      'button[aria-label="Ouvrir le menu de navigation"]',
    );
    expect(button).not.toBeNull();

    expect(button?.getAttribute('aria-expanded')).toBe('false');

    button?.dispatchEvent(new Event('click'));
    fixture.detectChanges();

    expect(button?.getAttribute('aria-expanded')).toBe('true');
    expect(button?.getAttribute('aria-label')).toBe(
      'Fermer le menu de navigation',
    );

    const firstNavLink = host.querySelector('a.kr-nav-link');
    expect(firstNavLink).not.toBeNull();
    firstNavLink?.dispatchEvent(new Event('click'));
    fixture.detectChanges();

    expect(button?.getAttribute('aria-expanded')).toBe('false');
    expect(button?.getAttribute('aria-label')).toBe(
      'Ouvrir le menu de navigation',
    );
  });

  it('Given a French public page with URL state When the navbar renders Then its labels, paths, and language selector are localized', async () => {
    const host = await renderNavbarAt(
      '/fr/programmes?utm_campaign=summer#offres',
      'fr-CI',
    );
    const navLinks = Array.from(
      host.querySelectorAll<HTMLAnchorElement>('a.kr-nav-link'),
    );
    const languageGroup = host.querySelector<HTMLElement>('[role="group"]');
    const frenchLink = languageGroup?.querySelector<HTMLAnchorElement>(
      'a[hreflang="fr-CI"]',
    );
    const englishLink = languageGroup?.querySelector<HTMLAnchorElement>(
      'a[hreflang="en-GB"]',
    );

    expect(navLinks.map((link) => link.textContent?.trim())).toEqual([
      'ACCUEIL',
      'SERVICES',
      'PROGRAMMES',
      'À PROPOS',
      'CONTACT',
    ]);
    expect(navLinks.map((link) => link.getAttribute('href'))).toEqual([
      '/fr',
      '/fr/services',
      '/fr/programmes',
      '/fr/a-propos',
      '/fr/contact',
    ]);
    expect(languageGroup?.getAttribute('aria-label')).toBe('Choisir la langue');
    expect(frenchLink?.hasAttribute('lang')).toBe(false);
    expect(frenchLink?.querySelector('[lang="fr-CI"]')).not.toBeNull();
    expect(frenchLink?.getAttribute('aria-current')).toBe('page');
    expect(frenchLink?.getAttribute('href')).toBe(
      '/fr/programmes?utm_campaign=summer#offres',
    );
    expect(englishLink?.hasAttribute('lang')).toBe(false);
    expect(englishLink?.querySelector('[lang="en-GB"]')).not.toBeNull();
    expect(englishLink?.hasAttribute('aria-current')).toBe(false);
    expect(englishLink?.getAttribute('href')).toBe(
      '/en/programs?utm_campaign=summer#offres',
    );
  });

  it('Given an English public page with URL state When the navbar renders Then its labels, paths, and language selector are localized', async () => {
    const host = await renderNavbarAt('/en/about?ref=nav#team', 'en-GB');
    const navLinks = Array.from(
      host.querySelectorAll<HTMLAnchorElement>('a.kr-nav-link'),
    );
    const languageGroup = host.querySelector<HTMLElement>('[role="group"]');
    const frenchLink = languageGroup?.querySelector<HTMLAnchorElement>(
      'a[hreflang="fr-CI"]',
    );
    const englishLink = languageGroup?.querySelector<HTMLAnchorElement>(
      'a[hreflang="en-GB"]',
    );

    expect(navLinks.map((link) => link.textContent?.trim())).toEqual([
      'HOME',
      'SERVICES',
      'PROGRAMMES',
      'ABOUT',
      'CONTACT',
    ]);
    expect(navLinks.map((link) => link.getAttribute('href'))).toEqual([
      '/en',
      '/en/services',
      '/en/programs',
      '/en/about',
      '/en/contact',
    ]);
    expect(languageGroup?.getAttribute('aria-label')).toBe('Choose language');
    expect(englishLink?.hasAttribute('lang')).toBe(false);
    expect(englishLink?.querySelector('[lang="en-GB"]')).not.toBeNull();
    expect(englishLink?.getAttribute('aria-current')).toBe('page');
    expect(englishLink?.getAttribute('href')).toBe('/en/about?ref=nav#team');
    expect(frenchLink?.hasAttribute('lang')).toBe(false);
    expect(frenchLink?.querySelector('[lang="fr-CI"]')).not.toBeNull();
    expect(frenchLink?.hasAttribute('aria-current')).toBe(false);
    expect(frenchLink?.getAttribute('href')).toBe('/fr/a-propos?ref=nav#team');
  });

  it('Given the address bar has advanced while the router URL is transitional When the navbar renders Then the language href uses the address-bar URL', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/fr/');
    vi.spyOn(TestBed.inject(Location), 'path').mockReturnValue(
      '/en/programs?campaign=summer#offres',
    );

    const fixture = TestBed.createComponent(Navbar);
    fixture.detectChanges();

    const frenchLink = fixture.nativeElement.querySelector(
      'a[hreflang="fr-CI"]',
    ) as HTMLAnchorElement;
    expect(frenchLink.getAttribute('href')).toBe(
      '/fr/programmes?campaign=summer#offres',
    );
  });

  it('Given the participant area is enabled, When the navbar renders, Then the participant CTA is visible', () => {
    globalThis.__KRAAK_RUNTIME_CONFIG__ = { enableParticipantArea: true };

    const fixture = TestBed.createComponent(Navbar);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const participantCta = host.querySelector(
      'a[aria-label="Espace participant"]',
    );

    expect(participantCta).not.toBeNull();
    expect(participantCta?.textContent).toContain('Espace participant');
    expect(participantCta?.getAttribute('href')).toBe('/participant/dashboard');
  });

  it('Given the participant area is disabled, When the navbar renders, Then the participant CTA is hidden', () => {
    globalThis.__KRAAK_RUNTIME_CONFIG__ = { enableParticipantArea: false };

    const fixture = TestBed.createComponent(Navbar);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('a[aria-label="Espace participant"]')).toBeNull();
  });
});
