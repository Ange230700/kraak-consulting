import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { KraakI18nService, provideKraakI18n } from '../../../../../shared/i18n';
import { GsapAnimationsService } from '../../core/animations/gsap-animations.service';
import { AnalyticsService } from '../../core/analytics/analytics.service';
import { CtaBanner } from '../../shared/cta-banner/cta-banner.component';
import { FaqAccordion } from '../../shared/faq-accordion/faq-accordion.component';

import ServicesPage from './services.page';

function normalizedText(element: Element | null): string {
  return (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

const gsapAnimationsServiceMock: Pick<
  GsapAnimationsService,
  | 'animatePageIn'
  | 'initializeFigureAnimations'
  | 'initializeInteractiveCardAnimations'
  | 'initializeButtonTransitions'
  | 'initializeIconAnimations'
  | 'initializeReversibleScrollAnimations'
  | 'killAllAnimations'
> = {
  animatePageIn: () => undefined,
  initializeFigureAnimations: () => undefined,
  initializeInteractiveCardAnimations: () => undefined,
  initializeButtonTransitions: () => undefined,
  initializeIconAnimations: () => undefined,
  initializeReversibleScrollAnimations: () => undefined,
  killAllAnimations: () => undefined,
};

describe('ServicesPage', () => {
  let analyticsService: Pick<AnalyticsService, 'trackEvent'>;

  beforeEach(async () => {
    analyticsService = {
      trackEvent: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ServicesPage],
      providers: [
        provideRouter([]),
        provideKraakI18n(),
        {
          provide: AnalyticsService,
          useValue: analyticsService,
        },
        {
          provide: GsapAnimationsService,
          useValue: gsapAnimationsServiceMock,
        },
      ],
    }).compileComponents();

    await TestBed.inject(ApplicationInitStatus).donePromise;
  });

  it('Given the services page When the component is created Then the instance exists', () => {
    const fixture = TestBed.createComponent(ServicesPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given the services page When it renders Then the page heading is visible', () => {
    const fixture = TestBed.createComponent(ServicesPage);
    fixture.detectChanges();
    const heading = fixture.nativeElement.querySelector('h1');
    expect(heading?.textContent).toContain(
      'Des offres claires pour renforcer les parcours, les projets et les organisations',
    );
  }, 45000);

  it('Given the French Services route When the complete page renders Then representative source copy FAQ chrome and the localized CTA remain French', async () => {
    await TestBed.inject(KraakI18nService).setLocale('fr-CI');

    const fixture = TestBed.createComponent(ServicesPage);
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    const content = normalizedText(page);
    const finalCta = page.querySelector(
      'kraak-cta-banner a',
    ) as HTMLAnchorElement | null;

    expect(normalizedText(page.querySelector('h1'))).toBe(
      'Des offres claires pour renforcer les parcours, les projets et les organisations.',
    );
    expect(content).toContain('KRAAK Training Centre');
    expect(content).toContain("Centre de Recherche et d'Innovation");
    expect(content).toContain('Centre de Conseils en Immigration');
    expect(content).toContain('Offres entreprises');
    expect(content).toContain('Pour qui');
    expect(content).toContain('Problématique');
    expect(content).toContain('Ce que nous livrons');
    expect(content).toContain('Prochaine étape');
    expect(content).toContain("Notre méthode d'intervention");
    expect(content).toContain('Clarifier');
    expect(content).toContain('Structurer');
    expect(content).toContain('Avancer');
    expect(content).toContain('Questions fréquentes');
    expect(content).toContain(
      'Comment choisir le service le plus adapté à mon objectif ?',
    );
    expect(content).toContain(
      "Choisissez le bon point d'entrée pour votre besoin.",
    );
    expect(finalCta?.textContent).toContain('Réserver une consultation');
    expect(finalCta?.getAttribute('href')).toBe('/fr/contact');
    expect(content).not.toContain('[missing:web.services.');
  });

  it('Given the English Services route When every service family method FAQ and CTA render Then all visitor-facing content comes from the English catalog', async () => {
    vi.spyOn(TestBed.inject(Router), 'url', 'get').mockReturnValue(
      '/en/services',
    );
    await TestBed.inject(KraakI18nService).setLocale('en-GB');

    const fixture = TestBed.createComponent(ServicesPage);
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    const content = normalizedText(page);
    const finalCta = page.querySelector(
      'kraak-cta-banner a',
    ) as HTMLAnchorElement | null;

    expect(normalizedText(page.querySelector('h1'))).toBe(
      'Clear solutions to strengthen careers, projects and organisations.',
    );
    expect(content).toContain('KRAAK Training Centre');
    expect(content).toContain('Research and Innovation Centre');
    expect(content).toContain('Immigration Advisory Centre');
    expect(content).toContain('Business solutions');
    expect(content).toContain('Who it is for');
    expect(content).toContain('Your challenge');
    expect(content).toContain('What we deliver');
    expect(content).toContain('Next step');
    expect(content).toContain(
      'Help people present themselves with confidence, clarity and job-ready skills.',
    );
    expect(content).toContain('Business and start-up support');
    expect(content).toContain(
      'Prepare for international study, work and mobility with a clear method.',
    );
    expect(content).toContain(
      'Workplace culture and healthy working relationships',
    );
    expect(content).toContain('Our approach');
    expect(content).toContain('Clarify');
    expect(content).toContain('Structure');
    expect(content).toContain('Move forward');
    expect(content).toContain('Frequently asked questions');
    expect(content).toContain(
      'How do I choose the service best suited to my goal?',
    );
    expect(content).toContain(
      'Choose the right starting point for your needs.',
    );
    expect(finalCta?.textContent).toContain('Book a consultation');
    expect(finalCta?.getAttribute('href')).toBe('/en/contact');
    expect(content).not.toContain('Des offres claires');
    expect(content).not.toContain('Pour qui');
    expect(content).not.toContain('Questions fréquentes');
    expect(content).not.toContain('[missing:web.services.');
  });

  it('Given one rendered French Services fixture When the locale changes to English Then FAQ inputs and shared card chrome react without recreating the page', async () => {
    const i18n = TestBed.inject(KraakI18nService);
    await i18n.setLocale('fr-CI');

    const fixture = TestBed.createComponent(ServicesPage);
    fixture.detectChanges();

    const faqDebugElement = fixture.debugElement.query(
      By.directive(FaqAccordion),
    );
    const faq = faqDebugElement.componentInstance as FaqAccordion;

    expect(faq.heading).toBe('Questions fréquentes');
    expect(faq.items[0]?.question).toBe(
      'Comment choisir le service le plus adapté à mon objectif ?',
    );
    expect(normalizedText(fixture.nativeElement as HTMLElement)).toContain(
      'Pour qui',
    );

    await i18n.setLocale('en-GB');
    fixture.detectChanges();

    const content = normalizedText(fixture.nativeElement as HTMLElement);

    expect(faq.heading).toBe('Frequently asked questions');
    expect(faq.description).toBe(
      'Find quick answers to common questions about our services, support formats and response times.',
    );
    expect(faq.backgroundAlt).toBe('');
    expect(faq.items[0]?.question).toBe(
      'How do I choose the service best suited to my goal?',
    );
    expect(content).toContain('Who it is for');
    expect(content).toContain('Your challenge');
    expect(content).not.toContain('Pour qui');
    expect(content).not.toContain(
      'Comment choisir le service le plus adapté à mon objectif ?',
    );
    expect(content).not.toContain('[missing:web.services.');
  });

  it('Given the English Services CTA When its conversion handler runs Then analytics keeps a stable event and context with localized label and URL', async () => {
    vi.spyOn(TestBed.inject(Router), 'url', 'get').mockReturnValue(
      '/en/services',
    );
    await TestBed.inject(KraakI18nService).setLocale('en-GB');

    const fixture = TestBed.createComponent(ServicesPage);
    fixture.detectChanges();

    const cta = fixture.debugElement.query(By.directive(CtaBanner))
      .componentInstance as CtaBanner;

    expect(cta.ctaLabel).toBe('Book a consultation');
    expect(cta.ctaLink).toBe('/contact');

    cta.onCtaClick();

    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      'conversion_cta_click',
      {
        cta_context: 'services_main_cta',
        cta_label: 'Book a consultation',
        cta_link: '/en/contact',
      },
    );
  });

  it('Given the services page When it renders Then the four consulting service families are visible', () => {
    const fixture = TestBed.createComponent(ServicesPage);
    fixture.detectChanges();
    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('KRAAK Training Centre');
    expect(content).toContain("Centre de Recherche et d'Innovation");
    expect(content).toContain('Centre de Conseils en Immigration');
    expect(content).toContain('Offres entreprises');
    expect(content).toContain('Pour qui');
    expect(content).toContain('Ce que nous livrons');
    expect(content).toContain('Prochaine \u00e9tape');
  });

  it('Given the services page When it renders Then it shows a single service-specific FAQ section', () => {
    const fixture = TestBed.createComponent(ServicesPage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const faqAccordion = element.querySelector('kraak-faq-accordion');

    expect(faqAccordion).not.toBeNull();
    expect(element.querySelectorAll('kraak-faq-accordion')).toHaveLength(1);
    expect(element.textContent).toContain('Questions fréquentes');
  });

  it('Given the services page When its FAQ renders Then the service-specific question is visible', () => {
    const fixture = TestBed.createComponent(ServicesPage);
    fixture.detectChanges();
    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Questions fréquentes');
    expect(content).toContain(
      'Comment choisir le service le plus adapté à mon objectif ?',
    );
  });
});
