import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { KraakI18nService, provideKraakI18n } from '../../../../../shared/i18n';
import { GsapAnimationsService } from '../../core/animations/gsap-animations.service';
import { AnalyticsService } from '../../core/analytics/analytics.service';
import { CtaBanner } from '../../shared/cta-banner/cta-banner.component';

import ProgramsPage from './programs.page';

const FRENCH_FORMAT_TITLES = [
  "Ateliers d'employabilité et de posture professionnelle",
  'Préparation linguistique et tests de langue',
  'Orientation études, travail et mobilité internationale',
  'Interventions collectives pour écoles, associations et entreprises',
] as const;

const ENGLISH_FORMAT_TITLES = [
  'Employability and professional presence workshops',
  'Language preparation and language testing',
  'Guidance for study, work and international mobility',
  'Group sessions for schools, associations and businesses',
] as const;

const FRENCH_CATALOG_TITLES = [
  'Intitulé exact',
  'Calendrier',
  'Éligibilité',
  'Modalités',
] as const;

const ENGLISH_CATALOG_TITLES = [
  'Exact title',
  'Schedule',
  'Eligibility',
  'Practical arrangements',
] as const;

const FRENCH_PROCESS_TITLES = [
  'Demande de contact',
  "Entretien d'orientation",
  'Proposition de format',
  'Confirmation',
] as const;

const ENGLISH_PROCESS_TITLES = [
  'Contact request',
  'Guidance conversation',
  'Format recommendation',
  'Confirmation',
] as const;

const FRENCH_COMPLETE_COPY = [
  'Programmes KRAAK',
  "Le catalogue public détaillé est en cours de finalisation. Aujourd'hui, KRAAK oriente chaque demande vers le bon format selon l'objectif, le profil, le pays concerné et la disponibilité des cohortes ou des partenaires.",
  'Formats actuellement proposés',
  'Ce que nous pouvons déjà orienter avec clarté.',
  'Nous publions ici les formats que nous activons déjà. Les intitulés détaillés, calendriers et modalités exactes sont confirmés après orientation.',
  "Ateliers d'employabilité et de posture professionnelle",
  'Format : atelier court ou mini-parcours.',
  'Public : jeunes, étudiants, jeunes professionnels.',
  'Cadence : sessions ponctuelles ou cohortes selon calendrier.',
  'Préparation linguistique et tests de langue',
  'Format : accompagnement ciblé ou atelier.',
  'Public : profils visant emploi, études ou mobilité.',
  'Cadence : selon niveau, objectif et disponibilité.',
  'Orientation études, travail et mobilité internationale',
  "Format : consultation d'orientation et préparation.",
  'Public : candidats à un projet international.',
  "Cadence : sur rendez-vous ou selon cohorte d'accompagnement.",
  'Interventions collectives pour écoles, associations et entreprises',
  'Format : conférence, forum, atelier ou module sur mesure.',
  'Public : structures éducatives, communautaires ou professionnelles.',
  'Cadence : sur demande ou via partenariat.',
  'Catalogue public',
  'Ce que nous confirmons après orientation.',
  "Pour rester honnêtes sur l'offre, nous ne publions pas encore un catalogue figé avec tous les détails. L'orientation permet de confirmer les bonnes informations au bon moment.",
  'Intitulé exact',
  'Le format ou le programme précis correspondant à votre besoin.',
  'Calendrier',
  "Les prochaines dates, cohortes ou fenêtres d'intervention disponibles.",
  'Éligibilité',
  "Les prérequis, le public visé et le niveau d'appui attendu.",
  'Modalités',
  'Le rythme, le cadre, les documents utiles et les conditions pratiques.',
  'Comment être orienté vers le bon programme ?',
  'Demande de contact',
  'Dites-nous votre objectif, votre pays et le type de besoin que vous cherchez à clarifier.',
  "Entretien d'orientation",
  "Un échange rapide permet de qualifier votre situation et le bon niveau d'appui.",
  'Proposition de format',
  'Nous vous orientons vers un atelier, une cohorte, une consultation ou une intervention collective.',
  'Confirmation',
  'Vous recevez les modalités utiles pour confirmer votre place ou votre prochaine étape.',
  "Vous n'avez pas à choisir seul dans un catalogue inachevé.",
  "Le bon programme dépend souvent de votre objectif, de votre calendrier, de votre niveau de préparation et du cadre de votre projet. Nous assumons cette posture d'orientation pour vous donner une information utile, pas une liste floue.",
  'Demandez une orientation KRAAK.',
  'Expliquez votre objectif et nous vous dirons quel format, quel rythme et quelle prochaine étape sont les plus pertinents.',
  'Demander une orientation',
] as const;

const ENGLISH_COMPLETE_COPY = [
  'KRAAK programmes',
  'Our detailed public catalogue is currently being finalised. For now, KRAAK guides each enquiry towards the right format based on the goal, profile, country involved and the availability of cohorts or partners.',
  'Formats currently offered',
  'What we can already recommend with confidence.',
  'Here are the formats we already offer. Detailed titles, schedules and exact arrangements are confirmed after a guidance conversation.',
  'Employability and professional presence workshops',
  'Format: short workshop or mini-programme.',
  'Audience: young people, students and early-career professionals.',
  'Schedule: one-off sessions or cohorts, depending on the calendar.',
  'Language preparation and language testing',
  'Format: targeted support or a workshop.',
  'Audience: people preparing for work, study or mobility.',
  'Schedule: based on level, goal and availability.',
  'Guidance for study, work and international mobility',
  'Format: guidance consultation and preparation.',
  'Audience: people pursuing an international plan.',
  'Schedule: by appointment or as part of a support cohort.',
  'Group sessions for schools, associations and businesses',
  'Format: conference, forum, workshop or tailored module.',
  'Audience: educational, community or professional organisations.',
  'Schedule: on request or through a partnership.',
  'Public catalogue',
  'What we confirm after your guidance conversation.',
  'To be transparent about our offer, we do not yet publish a fixed catalogue with every detail. The guidance stage allows us to confirm the right information at the right time.',
  'Exact title',
  'The specific format or programme that matches your needs.',
  'Schedule',
  'Upcoming dates, cohorts or available delivery windows.',
  'Eligibility',
  'Prerequisites, intended audience and expected level of support.',
  'Practical arrangements',
  'Pace, setting, useful documents and practical requirements.',
  'How do you find the right programme?',
  'Contact request',
  'Tell us your goal, your country and the type of need you want to clarify.',
  'Guidance conversation',
  'A short conversation helps us understand your situation and identify the right level of support.',
  'Format recommendation',
  'We guide you towards a workshop, cohort, consultation or group session.',
  'Confirmation',
  'You receive the practical details you need to confirm your place or next step.',
  'You should not have to choose alone from an unfinished catalogue.',
  'The right programme often depends on your goal, schedule, level of preparation and the context of your project. We take responsibility for guiding you so that you receive useful information, not a vague list.',
  'Ask KRAAK for guidance.',
  'Tell us your goal and we will recommend the most suitable format, pace and next step.',
  'Request guidance',
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
  | 'initializeListItemAnimations'
  | 'killAllAnimations'
> = {
  animatePageIn: () => undefined,
  initializeFigureAnimations: () => undefined,
  initializeReversibleScrollAnimations: () => undefined,
  initializeInteractiveCardAnimations: () => undefined,
  initializeButtonTransitions: () => undefined,
  initializeListItemAnimations: () => undefined,
  killAllAnimations: () => undefined,
};

describe('ProgramsPage', () => {
  let analyticsService: Pick<AnalyticsService, 'trackEvent'>;

  beforeEach(async () => {
    analyticsService = {
      trackEvent: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ProgramsPage],
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

  it('Given the Programs page route When the component initializes Then the page instance is created', () => {
    const fixture = TestBed.createComponent(ProgramsPage);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given the canonical French Programs route When the complete page renders Then all historical copy and the localized CTA remain French', async () => {
    vi.spyOn(TestBed.inject(Router), 'url', 'get').mockReturnValue(
      '/fr/programmes',
    );
    await TestBed.inject(KraakI18nService).setLocale('fr-CI');

    const fixture = TestBed.createComponent(ProgramsPage);
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    const content = normalizedText(page);
    const cta = fixture.debugElement.query(By.directive(CtaBanner))
      .componentInstance as CtaBanner;
    const ctaLink = page.querySelector(
      'kraak-cta-banner a',
    ) as HTMLAnchorElement | null;

    expect(normalizedText(page.querySelector('h1'))).toBe(
      "Orientation d'abord, format adapté ensuite.",
    );
    for (const expectedCopy of FRENCH_COMPLETE_COPY) {
      expect(content).toContain(expectedCopy);
    }
    expect(cta.heading).toBe('Demandez une orientation KRAAK.');
    expect(cta.body).toBe(
      'Expliquez votre objectif et nous vous dirons quel format, quel rythme et quelle prochaine étape sont les plus pertinents.',
    );
    expect(cta.ctaLabel).toBe('Demander une orientation');
    expect(cta.ctaLink).toBe('/contact');
    expect(cta.ctaContext).toBe('programs_main_cta');
    expect(ctaLink?.getAttribute('href')).toBe('/fr/contact');
    expect(content).not.toContain('[missing:web.programs.');
  });

  it('Given the English Programs route When the hero formats catalogue process reassurance and CTA render Then all visitor-facing content comes from the English catalog', async () => {
    vi.spyOn(TestBed.inject(Router), 'url', 'get').mockReturnValue(
      '/en/programs',
    );
    await TestBed.inject(KraakI18nService).setLocale('en-GB');

    const fixture = TestBed.createComponent(ProgramsPage);
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    const content = normalizedText(page);
    const ctaLink = page.querySelector(
      'kraak-cta-banner a',
    ) as HTMLAnchorElement | null;

    expect(normalizedText(page.querySelector('h1'))).toBe(
      'Guidance first. The right format follows.',
    );
    for (const expectedCopy of ENGLISH_COMPLETE_COPY) {
      expect(content).toContain(expectedCopy);
    }
    expect(textList(page, 'article[data-motion="reversible"] h2')).toEqual(
      ENGLISH_FORMAT_TITLES,
    );
    expect(textList(page, 'h3')).toEqual(ENGLISH_PROCESS_TITLES);
    expect(ctaLink?.textContent).toContain('Request guidance');
    expect(ctaLink?.getAttribute('href')).toBe('/en/contact');
    expect(content).not.toContain("Orientation d'abord");
    expect(content).not.toContain('Format :');
    expect(content).not.toContain('Catalogue public');
    expect(content).not.toContain('Demande de contact');
    expect(content).not.toContain('Demander une orientation');
    expect(content).not.toContain('[missing:web.programs.');
  });

  it('Given one rendered French Programs fixture with the English route stubbed When the locale changes to English Then collections and the CTA react without recreating the page', async () => {
    const router = TestBed.inject(Router);
    const i18n = TestBed.inject(KraakI18nService);
    vi.spyOn(router, 'url', 'get').mockReturnValue('/en/programs');
    await i18n.setLocale('fr-CI');

    const fixture = TestBed.createComponent(ProgramsPage);
    const programsPage = fixture.componentInstance;
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    const cta = fixture.debugElement.query(By.directive(CtaBanner))
      .componentInstance as CtaBanner;

    expect(textList(page, 'article[data-motion="reversible"] h2')).toEqual(
      FRENCH_FORMAT_TITLES,
    );
    expect(textList(page, 'h3')).toEqual(FRENCH_PROCESS_TITLES);
    expect(cta.ctaLabel).toBe('Demander une orientation');

    await i18n.setLocale('en-GB');
    fixture.detectChanges();

    expect(fixture.componentInstance).toBe(programsPage);
    expect(
      fixture.debugElement.query(By.directive(CtaBanner)).componentInstance,
    ).toBe(cta);
    expect(textList(page, 'article[data-motion="reversible"] h2')).toEqual(
      ENGLISH_FORMAT_TITLES,
    );
    expect(
      textList(page, 'article:not([data-motion]) > p:first-child'),
    ).toEqual(ENGLISH_CATALOG_TITLES);
    expect(textList(page, 'h3')).toEqual(ENGLISH_PROCESS_TITLES);
    expect(cta.heading).toBe('Ask KRAAK for guidance.');
    expect(cta.body).toBe(
      'Tell us your goal and we will recommend the most suitable format, pace and next step.',
    );
    expect(cta.ctaLabel).toBe('Request guidance');
    expect(page.querySelector('kraak-cta-banner a')?.getAttribute('href')).toBe(
      '/en/contact',
    );
    expect(normalizedText(page)).not.toContain('Formats actuellement proposés');
    expect(normalizedText(page)).not.toContain('[missing:web.programs.');
  });

  it('Given the Programs content collections When the French page renders Then four reversible format articles and four ordered process steps remain intact', async () => {
    await TestBed.inject(KraakI18nService).setLocale('fr-CI');

    const fixture = TestBed.createComponent(ProgramsPage);
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;

    expect(
      page.querySelectorAll('article[data-motion="reversible"]'),
    ).toHaveLength(4);
    expect(textList(page, 'article[data-motion="reversible"] h2')).toEqual(
      FRENCH_FORMAT_TITLES,
    );
    expect(
      textList(page, 'article:not([data-motion]) > p:first-child'),
    ).toEqual(FRENCH_CATALOG_TITLES);
    expect(textList(page, 'h3')).toEqual(FRENCH_PROCESS_TITLES);
  });

  it('Given the English Programs CTA When its conversion handler runs Then analytics keeps a stable event and context with a localized label and URL', async () => {
    vi.spyOn(TestBed.inject(Router), 'url', 'get').mockReturnValue(
      '/en/programs',
    );
    await TestBed.inject(KraakI18nService).setLocale('en-GB');

    const fixture = TestBed.createComponent(ProgramsPage);
    fixture.detectChanges();

    const cta = fixture.debugElement.query(By.directive(CtaBanner))
      .componentInstance as CtaBanner;

    expect(cta.ctaLabel).toBe('Request guidance');
    expect(cta.ctaLink).toBe('/contact');

    cta.onCtaClick();

    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      'conversion_cta_click',
      {
        cta_context: 'programs_main_cta',
        cta_label: 'Request guidance',
        cta_link: '/en/contact',
      },
    );
  });
});
