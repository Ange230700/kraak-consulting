import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { afterEach, vi } from 'vitest';

import { KraakI18nService, provideKraakI18n } from '../../../../../shared/i18n';
import { AnalyticsService } from '../../core/analytics/analytics.service';
import { GsapAnimationsService } from '../../core/animations/gsap-animations.service';
import { CtaBanner } from '../../shared/cta-banner/cta-banner.component';

import AboutPage from './about.page';

const FRENCH_FOCUS_TITLES = [
  'Développement des compétences',
  'Structuration des projets',
  'Accès aux opportunités internationales',
] as const;

const ENGLISH_FOCUS_TITLES = [
  'Skills development',
  'Project structuring',
  'Access to international opportunities',
] as const;

const FRENCH_VALUE_TITLES = [
  'Humanisme',
  'Responsabilité personnelle',
  'Leadership par le service',
  'Solidarité et esprit collectif',
  'Résilience et courage',
  'Ouverture et connexion globale',
] as const;

const ENGLISH_VALUE_TITLES = [
  'Humanism',
  'Personal responsibility',
  'Servant leadership',
  'Solidarity and collective strength',
  'Resilience and courage',
  'Openness and global connection',
] as const;

const FRENCH_COMPLETE_COPY = [
  'À propos de KRAAK',
  "KRAAK Consulting renforce les capacités des jeunes, accompagne les organisations et construit des passerelles utiles entre potentiel, opportunités et impact durable en Côte d'Ivoire et à l'international.",
  'Développement des compétences',
  'Des formations utiles pour gagner en clarté, en confiance et en compétitivité professionnelle.',
  'Structuration des projets',
  'Une méthode pour transformer les intentions en initiatives lisibles, suivies et capables de produire des résultats.',
  'Accès aux opportunités internationales',
  'Un accompagnement fiable pour aborder les études, le travail et la mobilité avec une stratégie cohérente.',
  'Notre cap',
  'Une mission claire, une vision utile.',
  'Ces repères donnent une direction lisible à nos accompagnements et à nos partenariats.',
  'Révéler, former et accompagner les jeunes dans leur transformation.',
  'KRAAK Consulting a pour mission de révéler le potentiel des jeunes, de développer des compétences techniques et interpersonnelles solides, de faciliter leur intégration dans des environnements exigeants et de soutenir la création de valeur durable pour eux-mêmes, leurs communautés et les générations futures.',
  'Ce que nous activons',
  'Découverte et affirmation du potentiel',
  'Compétences solides et utiles',
  'Résultat attendu',
  'Des trajectoires plus lisibles, plus confiantes et plus durables pour les jeunes que nous accompagnons.',
  'Un acteur de référence pour les jeunes professionnels africains.',
  "KRAAK Consulting se projette comme un acteur de référence dans la formation et l'accompagnement des jeunes professionnels africains, capable de faire émerger une génération consciente de sa valeur, prête à exercer un leadership utile et à contribuer à une société plus juste, plus inclusive et plus ouverte aux opportunités.",
  'Ambition',
  'Former des leaders conscients de leur valeur et utiles à leur environnement.',
  'Impact',
  "Contribuer à une société plus inclusive et porteuse d'opportunités durables.",
  'Nos valeurs',
  'Humanisme',
  "Nous défendons le respect de chaque individu, la dignité humaine et l'inclusion, sans discrimination.",
  'Responsabilité personnelle',
  'Nous encourageons chacun à prendre en main son développement, ses choix et son avenir.',
  'Leadership par le service',
  "Nous formons des leaders qui s'élèvent, élèvent les autres et créent un impact positif.",
  'Solidarité et esprit collectif',
  "Nous croyons à la force du collectif, de la collaboration et de l'entraide.",
  'Résilience et courage',
  'Nous préparons les jeunes et les organisations à affronter les défis, dépasser les barrières et progresser.',
  'Ouverture et connexion globale',
  "Nous favorisons les échanges interculturels, l'apprentissage continu et les compétences transférables.",
  "\"KRAAK Consulting n'est pas qu'un projet commercial, c'est une mission de vie. Nous sommes ici pour briser les barrières qui empêchent le talent africain de s'exprimer sur la scène mondiale.\"",
  'Mr AKA',
  'Directeur Général /Co-Fondateur',
  'Vous partagez cette ambition ?',
  'Découvrons ensemble comment KRAAK peut contribuer à votre trajectoire ou à votre organisation.',
  'Nous contacter',
] as const;

const ENGLISH_COMPLETE_COPY = [
  'About KRAAK',
  "KRAAK Consulting builds young people's capabilities, supports organisations and creates valuable bridges between potential, opportunity and lasting impact in Côte d'Ivoire and internationally.",
  'Skills development',
  'Practical training to build clarity, confidence and professional competitiveness.',
  'Project structuring',
  'A method for turning intentions into clear, monitored initiatives capable of delivering results.',
  'Access to international opportunities',
  'Reliable support for approaching study, work and mobility with a coherent strategy.',
  'Our direction',
  'A clear mission and a meaningful vision.',
  'These guideposts give our support and partnerships a clear direction.',
  'Unlock potential, build skills and support young people through transformation.',
  "KRAAK Consulting's mission is to unlock young people's potential, build strong technical and interpersonal skills, help them integrate into demanding environments and support lasting value creation for themselves, their communities and future generations.",
  'What we set in motion',
  'Discovering and asserting potential',
  'Strong, practical skills',
  'Intended outcome',
  'Clearer, more confident and more sustainable pathways for the young people we support.',
  'A leading partner for young African professionals.',
  'KRAAK Consulting aims to become a leading organisation in the training and support of young African professionals, helping to shape a generation that understands its value, is ready to practise purposeful leadership and contributes to a fairer, more inclusive society that is open to opportunity.',
  'Ambition',
  'Develop leaders who understand their value and serve their communities.',
  'Impact',
  'Contribute to a more inclusive society with sustainable opportunities.',
  'Our values',
  'Humanism',
  'We uphold respect for every individual, human dignity and inclusion, without discrimination.',
  'Personal responsibility',
  'We encourage everyone to take ownership of their development, choices and future.',
  'Servant leadership',
  'We develop leaders who rise, lift others and create positive impact.',
  'Solidarity and collective strength',
  'We believe in collective strength, collaboration and mutual support.',
  'Resilience and courage',
  'We prepare young people and organisations to face challenges, overcome barriers and make progress.',
  'Openness and global connection',
  'We foster intercultural exchange, lifelong learning and transferable skills.',
  '"KRAAK Consulting is more than a business venture; it is a life mission. We are here to break down the barriers that prevent African talent from expressing itself on the global stage."',
  'Mr AKA',
  'Chief Executive Officer / Co-Founder',
  'Do you share this ambition?',
  'Let us explore how KRAAK can contribute to your journey or organisation.',
  'Contact us',
] as const;

function normalizedText(element: Element | null): string {
  return (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function textList(page: HTMLElement, selector: string): string[] {
  return Array.from(page.querySelectorAll(selector)).map((element) =>
    normalizedText(element),
  );
}

const gsapAnimationsServiceMock: Pick<
  GsapAnimationsService,
  | 'animatePageIn'
  | 'initializeFigureAnimations'
  | 'initializeReversibleScrollAnimations'
  | 'initializeInteractiveCardAnimations'
  | 'initializeButtonTransitions'
  | 'initializeIconAnimations'
  | 'killAllAnimations'
> = {
  animatePageIn: () => undefined,
  initializeFigureAnimations: () => undefined,
  initializeReversibleScrollAnimations: () => undefined,
  initializeInteractiveCardAnimations: () => undefined,
  initializeButtonTransitions: () => undefined,
  initializeIconAnimations: () => undefined,
  killAllAnimations: () => undefined,
};

describe('AboutPage', () => {
  let analyticsService: Pick<AnalyticsService, 'trackEvent'>;

  beforeEach(async () => {
    analyticsService = { trackEvent: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [AboutPage],
      providers: [
        provideRouter([]),
        provideKraakI18n(),
        { provide: AnalyticsService, useValue: analyticsService },
        {
          provide: GsapAnimationsService,
          useValue: gsapAnimationsServiceMock,
        },
      ],
    }).compileComponents();

    await TestBed.inject(ApplicationInitStatus).donePromise;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Given the About page route When the component initializes Then the page instance is created', () => {
    const fixture = TestBed.createComponent(AboutPage);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given the canonical French About route When the complete page renders Then all historical narrative accessibility copy and CTA remain French', async () => {
    vi.spyOn(TestBed.inject(Router), 'url', 'get').mockReturnValue(
      '/fr/a-propos',
    );
    await TestBed.inject(KraakI18nService).setLocale('fr-CI');

    const fixture = TestBed.createComponent(AboutPage);
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    const content = normalizedText(page);
    const quote = page.querySelector('section:nth-of-type(5) article');
    const images = page.querySelectorAll('section:nth-of-type(5) img');
    const cta = fixture.debugElement.query(By.directive(CtaBanner))
      .componentInstance as CtaBanner;

    expect(normalizedText(page.querySelector('h1'))).toBe(
      'Une structure engagée pour le capital humain et les trajectoires durables.',
    );
    for (const expectedCopy of FRENCH_COMPLETE_COPY) {
      expect(content).toContain(expectedCopy);
    }
    expect(quote?.getAttribute('aria-label')).toBe(
      'Citation du Directeur Général',
    );
    expect(images[0]?.getAttribute('alt')).toBe(
      'Portrait de Mr AKA, Directeur Général et Co-Fondateur de KRAAK',
    );
    expect(images[1]?.getAttribute('alt')).toBe('Symbole KRAAK');
    expect(cta.ctaLink).toBe('/contact');
    expect(cta.ctaContext).toBe('about_main_cta');
    expect(page.querySelector('kraak-cta-banner a')?.getAttribute('href')).toBe(
      '/fr/contact',
    );
    expect(content).not.toContain("L'équipe KRAAK");
    expect(content).not.toContain('[missing:web.about.');
  });

  it('Given the English About route When every narrative and leadership section renders Then all visitor-facing and accessibility copy comes from the English catalog', async () => {
    vi.spyOn(TestBed.inject(Router), 'url', 'get').mockReturnValue('/en/about');
    await TestBed.inject(KraakI18nService).setLocale('en-GB');

    const fixture = TestBed.createComponent(AboutPage);
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    const content = normalizedText(page);
    const quote = page.querySelector('section:nth-of-type(5) article');
    const images = page.querySelectorAll('section:nth-of-type(5) img');

    expect(normalizedText(page.querySelector('h1'))).toBe(
      'A purpose-driven organisation for human capital and sustainable pathways.',
    );
    for (const expectedCopy of ENGLISH_COMPLETE_COPY) {
      expect(content).toContain(expectedCopy);
    }
    expect(quote?.getAttribute('aria-label')).toBe(
      'Quote from the Chief Executive Officer',
    );
    expect(images[0]?.getAttribute('alt')).toBe(
      'Portrait of Mr AKA, Chief Executive Officer and Co-Founder of KRAAK',
    );
    expect(images[1]?.getAttribute('alt')).toBe('KRAAK symbol');
    expect(page.querySelector('kraak-cta-banner a')?.getAttribute('href')).toBe(
      '/en/contact',
    );
    expect(content).not.toContain('Une structure engagée');
    expect(content).not.toContain('Notre cap');
    expect(content).not.toContain('Nos valeurs');
    expect(content).not.toContain('Directeur Général');
    expect(content).not.toContain('[missing:web.about.');
  });

  it('Given one rendered French About fixture with the English route stubbed When the locale changes to English Then sections accessibility copy and CTA inputs update without recreating components', async () => {
    const router = TestBed.inject(Router);
    const i18n = TestBed.inject(KraakI18nService);
    vi.spyOn(router, 'url', 'get').mockReturnValue('/en/about');
    await i18n.setLocale('fr-CI');

    const fixture = TestBed.createComponent(AboutPage);
    const aboutPage = fixture.componentInstance;
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    const cta = fixture.debugElement.query(By.directive(CtaBanner))
      .componentInstance as CtaBanner;

    expect(textList(page, 'section:nth-of-type(2) article h2')).toEqual(
      FRENCH_FOCUS_TITLES,
    );
    expect(
      textList(page, 'section:nth-of-type(4) article > p:first-child'),
    ).toEqual(FRENCH_VALUE_TITLES);
    expect(cta.ctaLabel).toBe('Nous contacter');

    await i18n.setLocale('en-GB');
    fixture.detectChanges();

    expect(fixture.componentInstance).toBe(aboutPage);
    expect(
      fixture.debugElement.query(By.directive(CtaBanner)).componentInstance,
    ).toBe(cta);
    expect(textList(page, 'section:nth-of-type(2) article h2')).toEqual(
      ENGLISH_FOCUS_TITLES,
    );
    expect(
      textList(page, 'section:nth-of-type(4) article > p:first-child'),
    ).toEqual(ENGLISH_VALUE_TITLES);
    expect(
      page
        .querySelector('section:nth-of-type(5) article')
        ?.getAttribute('aria-label'),
    ).toBe('Quote from the Chief Executive Officer');
    expect(
      page.querySelector('section:nth-of-type(5) img')?.getAttribute('alt'),
    ).toBe(
      'Portrait of Mr AKA, Chief Executive Officer and Co-Founder of KRAAK',
    );
    expect(cta.heading).toBe('Do you share this ambition?');
    expect(cta.body).toBe(
      'Let us explore how KRAAK can contribute to your journey or organisation.',
    );
    expect(cta.ctaLabel).toBe('Contact us');
    expect(page.querySelector('kraak-cta-banner a')?.getAttribute('href')).toBe(
      '/en/contact',
    );
    expect(normalizedText(page)).not.toContain('[missing:web.about.');
  });

  it('Given the About narrative structure When the French page renders Then focus mission vision values icons and leadership assets remain intact', async () => {
    await TestBed.inject(KraakI18nService).setLocale('fr-CI');

    const fixture = TestBed.createComponent(AboutPage);
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    const directionArticles = page.querySelectorAll(
      'article[data-motion="reversible"]',
    );
    const leadershipImages = page.querySelectorAll(
      'section:nth-of-type(5) img',
    );

    expect(
      page.querySelectorAll('section:nth-of-type(2) article'),
    ).toHaveLength(3);
    expect(directionArticles).toHaveLength(2);
    expect(textList(page, 'article[data-motion="reversible"] h3')).toEqual([
      'Révéler, former et accompagner les jeunes dans leur transformation.',
      'Un acteur de référence pour les jeunes professionnels africains.',
    ]);
    expect(
      page.querySelectorAll('section:nth-of-type(4) article'),
    ).toHaveLength(6);
    expect(page.querySelectorAll('i[aria-hidden="true"]')).not.toHaveLength(0);
    expect(leadershipImages[0]?.getAttribute('src')).toBe(
      '/assets/site-visuals/photos/about-ceo-mr-aka.png',
    );
    expect(leadershipImages[1]?.getAttribute('src')).toBe('/kraak-symbol.png');
  });

  it('Given the English About CTA When its conversion handler runs Then analytics keeps a stable event and context with a localized label and URL', async () => {
    vi.spyOn(TestBed.inject(Router), 'url', 'get').mockReturnValue('/en/about');
    await TestBed.inject(KraakI18nService).setLocale('en-GB');

    const fixture = TestBed.createComponent(AboutPage);
    fixture.detectChanges();

    const cta = fixture.debugElement.query(By.directive(CtaBanner))
      .componentInstance as CtaBanner;

    expect(cta.ctaLabel).toBe('Contact us');
    expect(cta.ctaLink).toBe('/contact');

    cta.onCtaClick();

    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      'conversion_cta_click',
      {
        cta_context: 'about_main_cta',
        cta_label: 'Contact us',
        cta_link: '/en/contact',
      },
    );
  });
});
