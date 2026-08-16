import { ApplicationInitStatus } from '@angular/core';
import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { KraakI18nService, provideKraakI18n } from '../../../../../shared/i18n';
import { AnalyticsService } from '../../core/analytics/analytics.service';
import { PublicConversionTrackingDirective } from '../../shared/analytics/public-conversion-tracking.directive';
import { Footer } from './footer.component';

interface FooterAnimationInternals {
  activateFooterAnimations: () => void;
  handleScroll: () => void;
}

const analyticsServiceMock = {
  trackEvent: vi.fn(),
} satisfies Pick<AnalyticsService, 'trackEvent'>;

describe('Footer', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Footer],
      providers: [
        provideRouter([]),
        provideKraakI18n(),
        { provide: AnalyticsService, useValue: analyticsServiceMock },
      ],
    }).compileComponents();

    await TestBed.inject(ApplicationInitStatus).donePromise;
    analyticsServiceMock.trackEvent.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Given the footer is rendered, When it enters the viewport, Then both animation classes are activated and the scroll listener is cleaned', () => {
    const addListenerSpy = vi.spyOn(globalThis.window, 'addEventListener');
    const removeListenerSpy = vi.spyOn(
      globalThis.window,
      'removeEventListener',
    );
    const fixture = TestBed.createComponent(Footer);

    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const fadeRightElement = element.querySelector('.kr-footer-fade-right');
    const fadeLeftElement = element.querySelector('.kr-footer-fade-left');

    expect(addListenerSpy).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function),
      { passive: true },
    );
    expect(fadeRightElement?.classList).toContain(
      'kr-footer-fade-right-visible',
    );
    expect(fadeLeftElement?.classList).toContain('kr-footer-fade-left-visible');
    expect(removeListenerSpy).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function),
    );

    const component =
      fixture.componentInstance as unknown as FooterAnimationInternals;
    component.handleScroll();

    expect(removeListenerSpy).toHaveBeenCalledTimes(1);
  });

  it('Given the footer remains below the viewport, When the scroll handler runs, Then animations stay pending', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      bottom: 1_200,
      height: 300,
      left: 0,
      right: 0,
      top: 1_000,
      width: 1_000,
      x: 0,
      y: 1_000,
      toJSON: () => ({}),
    });
    const removeListenerSpy = vi.spyOn(
      globalThis.window,
      'removeEventListener',
    );
    const fixture = TestBed.createComponent(Footer);

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(
      element
        .querySelector('.kr-footer-fade-right')
        ?.classList.contains('kr-footer-fade-right-visible'),
    ).toBe(false);
    expect(
      element
        .querySelector('.kr-footer-fade-left')
        ?.classList.contains('kr-footer-fade-left-visible'),
    ).toBe(false);
    expect(removeListenerSpy).not.toHaveBeenCalled();
  });

  it('Given the view child is unavailable, When view initialization and animation activation run, Then no scroll listener is registered and no error is thrown', () => {
    const addListenerSpy = vi.spyOn(globalThis.window, 'addEventListener');
    const fixture = TestBed.createComponent(Footer);
    const component = fixture.componentInstance;
    const animationInternals =
      fixture.componentInstance as unknown as FooterAnimationInternals;

    expect(() => component.ngAfterViewInit()).not.toThrow();
    expect(() => animationInternals.handleScroll()).not.toThrow();
    expect(() => animationInternals.activateFooterAnimations()).not.toThrow();
    expect(addListenerSpy).not.toHaveBeenCalledWith(
      'scroll',
      expect.any(Function),
      expect.anything(),
    );
  });

  it('Given the browser window is unavailable, When the footer is destroyed, Then cleanup exits without accessing the listener API', () => {
    const windowGetterSpy = vi
      .spyOn(globalThis, 'window', 'get')
      .mockImplementation(
        () => undefined as unknown as Window & typeof globalThis,
      );
    const fixture = TestBed.createComponent(Footer);

    expect(() => fixture.componentInstance.ngOnDestroy()).not.toThrow();

    windowGetterSpy.mockRestore();
  });

  it('Given the French public shell When the footer renders Then its content and accessible names use the French catalog copy', async () => {
    vi.spyOn(TestBed.inject(Router), 'url', 'get').mockReturnValue('/fr/');
    await TestBed.inject(KraakI18nService).setLocale('fr-CI');

    const fixture = TestBed.createComponent(Footer);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const content = (host.textContent ?? '').replace(/\s+/g, ' ').trim();
    const brandLink = host.querySelector<HTMLAnchorElement>(
      'a[aria-label="Retour à l\'accueil KRAAK"]',
    );
    const socialNavigation = host.querySelector<HTMLElement>(
      'nav[aria-label="Réseaux sociaux"]',
    );

    expect(content).toContain("Prêt à passer à l'action ?");
    expect(content).toContain('Nous contacter');
    expect(content).toContain('Formation professionnelle');
    expect(content).toContain('Pilotage de projets');
    expect(content).toContain('Mobilité internationale');
    expect(content).toContain('Tous droits réservés.');
    expect(content).toContain('Mentions légales');
    expect(content).toContain('Politique de confidentialité');
    expect(brandLink).not.toBeNull();
    expect(host.querySelector('img[alt="Symbole KRAAK"]')).not.toBeNull();
    expect(socialNavigation).not.toBeNull();
  });

  it('Given the English public shell When the footer renders Then all visitor-facing content and accessible names use the English catalog copy', async () => {
    vi.spyOn(TestBed.inject(Router), 'url', 'get').mockReturnValue('/en/');
    await TestBed.inject(KraakI18nService).setLocale('en-GB');

    const fixture = TestBed.createComponent(Footer);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const content = (host.textContent ?? '').replace(/\s+/g, ' ').trim();
    const footerLinks = Array.from(
      host.querySelectorAll<HTMLAnchorElement>('footer a'),
    );
    const brandLink = host.querySelector<HTMLAnchorElement>(
      'a[aria-label="Back to the KRAAK homepage"]',
    );
    const socialNavigation = host.querySelector<HTMLElement>(
      'nav[aria-label="Social media"]',
    );

    expect(content).toContain('Ready to take action?');
    expect(content).toContain(
      'Join the KRAAK ecosystem and take your ambitions further.',
    );
    expect(content).toContain('Contact us');
    expect(content).toContain(
      'Operational excellence in service of human development.',
    );
    expect(content).toContain('Professional training');
    expect(content).toContain('Project management');
    expect(content).toContain('International mobility');
    expect(content).toContain('Offices');
    expect(content).toContain('All rights reserved.');
    expect(content).toContain('Legal notice');
    expect(content).toContain('Privacy policy');
    for (const label of [
      'Home',
      'Services',
      'Programmes',
      'About',
      'Contact',
    ]) {
      expect(footerLinks.map((link) => link.textContent?.trim())).toContain(
        label,
      );
    }
    for (const label of ['Navigation', 'Expertise', 'Offices']) {
      expect(content).toContain(label);
    }
    expect(footerLinks.map((link) => link.textContent?.trim())).toContain(
      'FAQ',
    );
    expect(content).not.toContain("Prêt à passer à l'action ?");
    expect(content).not.toContain('[missing:web.');
    expect(brandLink).not.toBeNull();
    expect(brandLink?.getAttribute('href')).toMatch(/^\/en\/?$/);
    expect(host.querySelector('img[alt="KRAAK symbol"]')).not.toBeNull();
    expect(socialNavigation).not.toBeNull();
    expect(
      footerLinks
        .find((link) => link.textContent?.trim() === 'Contact us')
        ?.getAttribute('href'),
    ).toBe('/en/contact');
  });

  it('Given an English footer CTA When the visitor activates it Then analytics receives its localized label and path', async () => {
    vi.spyOn(TestBed.inject(Router), 'url', 'get').mockReturnValue('/en/');
    await TestBed.inject(KraakI18nService).setLocale('en-GB');

    const fixture = TestBed.createComponent(Footer);
    fixture.detectChanges();

    const ctaTracking = fixture.debugElement
      .queryAll(By.directive(PublicConversionTrackingDirective))
      .map((debugElement) =>
        debugElement.injector.get(PublicConversionTrackingDirective),
      )
      .find((tracking) => tracking.eventName === 'footer_cta_click');

    ctaTracking?.trackClick();

    expect(analyticsServiceMock.trackEvent).toHaveBeenCalledWith(
      'footer_cta_click',
      {
        cta_label: 'Contact us',
        cta_surface: 'footer_top_band',
        cta_path: '/en/contact',
      },
    );
  });
});
