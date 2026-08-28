import { ApplicationInitStatus, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { KraakI18nService, provideKraakI18n } from '../../../../../shared/i18n';
import { GsapAnimationsService } from '../../core/animations/gsap-animations.service';
import HomePage from './home.page';

@Component({
  standalone: true,
  template: '',
})
class BlankRouteComponent {}

function normalizedText(element: Element | null): string {
  return (element?.textContent ?? '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.!?])/g, '$1')
    .trim();
}

const gsapAnimationsServiceMock: Pick<
  GsapAnimationsService,
  | 'animatePageIn'
  | 'initializeFigureAnimations'
  | 'initializeInteractiveCardAnimations'
  | 'initializeButtonTransitions'
  | 'initializeSectionAnimations'
  | 'initializeIconAnimations'
  | 'killAllAnimations'
> = {
  animatePageIn: () => undefined,
  initializeFigureAnimations: () => undefined,
  initializeInteractiveCardAnimations: () => undefined,
  initializeButtonTransitions: () => undefined,
  initializeSectionAnimations: () => undefined,
  initializeIconAnimations: () => undefined,
  killAllAnimations: () => undefined,
};

describe('HomePage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideRouter([{ path: '**', component: BlankRouteComponent }]),
        provideKraakI18n(),
        {
          provide: GsapAnimationsService,
          useValue: gsapAnimationsServiceMock,
        },
      ],
    }).compileComponents();

    await TestBed.inject(ApplicationInitStatus).donePromise;
  });

  it('Given the home page component When it is created Then the instance exists', () => {
    const fixture = TestBed.createComponent(HomePage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given the home page When it renders Then it shows the consulting hero promise', () => {
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
    const heading = fixture.nativeElement.querySelector('h1');
    expect(heading?.textContent).toContain('Développez vos compétences.');
  });

  it('Given the home page When it renders Then it shows the primary consulting calls to action', () => {
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Réserver une consultation');
    expect(element.textContent).toContain('Découvrir nos programmes');
    expect(element.textContent).toContain('Recherche & Gestion de projets');
  });

  it('Given the French public homepage When it renders Then the hero and primary action come from the French catalog', async () => {
    await TestBed.inject(Router).navigateByUrl('/fr/');
    await TestBed.inject(KraakI18nService).setLocale('fr-CI');

    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const hero = normalizedText(host.querySelector('h1'));

    expect(hero).toContain('Développez vos compétences.');
    expect(hero).toContain('Lancez vos projets.');
    expect(hero).toContain('Accédez aux opportunités internationales.');
    expect(normalizedText(host)).toContain('Réserver une consultation');
  });

  it('Given the English public homepage When it renders Then the hero and primary action come from the English catalog', async () => {
    await TestBed.inject(Router).navigateByUrl('/en/');
    await TestBed.inject(KraakI18nService).setLocale('en-GB');

    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const hero = normalizedText(host.querySelector('h1'));

    expect(hero).toContain('Build your skills.');
    expect(hero).toContain('Launch your projects.');
    expect(hero).toContain('Access international opportunities.');
    expect(normalizedText(host)).toContain('Book a consultation');
  });

  it('Given the English public homepage When every section renders Then representative content and FAQ copy come from the English catalog', async () => {
    await TestBed.inject(Router).navigateByUrl('/en/');
    await TestBed.inject(KraakI18nService).setLocale('en-GB');

    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const content = normalizedText(fixture.nativeElement as HTMLElement);

    expect(content).toContain('Our three areas of expertise');
    expect(content).toContain('Research & Project Management');
    expect(content).toContain('Personal and professional development');
    expect(content).toContain('Employability and career integration');
    expect(content).toContain('Internationally recognised expertise');
    expect(content).toContain(
      'I am not sure where to start. What is the first step?',
    );
    expect(content).toContain('You know where you want to go.');
    expect(content).not.toContain('[missing:web.home.');
  });

  it('Given an already rendered French homepage When the locale changes to English Then the FAQ content updates in the same fixture', async () => {
    const i18n = TestBed.inject(KraakI18nService);
    await i18n.setLocale('fr-CI');

    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(normalizedText(host)).toContain(
      'Je ne sais pas par où commencer. Quelle est la première étape?',
    );

    await i18n.setLocale('en-GB');
    fixture.detectChanges();

    const content = normalizedText(host);
    expect(content).toContain(
      'I am not sure where to start. What is the first step?',
    );
    expect(content).toContain('A first step towards clarity');
    expect(content).toContain(
      'Review the answers to our most frequently asked questions',
    );
    expect(
      host.querySelector('kraak-faq-accordion img')?.getAttribute('alt'),
    ).toBe('A KRAAK adviser guiding a participant through her options');
    expect(content).not.toContain(
      'Je ne sais pas par où commencer. Quelle est la première étape?',
    );
  });

  it('Given the home page When the hero renders Then it presents the KRAAK workshop as real media', () => {
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const image = fixture.nativeElement.querySelector(
      'img[src="/assets/site-visuals/photos/programs-workshop.avif"]',
    ) as HTMLImageElement | null;

    expect(image).not.toBeNull();
    expect(image?.getAttribute('alt')).toContain('atelier KRAAK Consulting');
  });

  it('Given the home page When it renders Then it lists the key solutions without collapsing them into one service label', () => {
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Développement personnel et professionnel');
    expect(content).toContain('Anglais et français professionnels');
    expect(content).toContain('Leadership et prise de parole');
    expect(content).toContain('Préparation aux entretiens');
    expect(content).toContain('Structuration de projets');
    expect(content).toContain("Accompagnement d'entreprises et startups");
    expect(content).toContain('Conseils en mobilité internationale');
    expect(content).toContain('Recrutement et placement en emploi');
  });

  it('Given the home page When it renders Then it shows a single home-specific FAQ section', () => {
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const faqAccordion = element.querySelector('kraak-faq-accordion');

    expect(faqAccordion).not.toBeNull();
    expect(element.querySelectorAll('kraak-faq-accordion')).toHaveLength(1);
    expect(element.textContent).toContain('Questions fréquentes');
  });

  it("Given the home page When it renders Then it exposes proof blocks grounded in KRAAK's real positioning", () => {
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Insertion socioprofessionnelle');
    expect(content).toContain('Approche bidirectionnelle');
    expect(content).toContain('Expérience internationale');
    expect(content).toContain('Accompagnement structuré');
  });

  it('Given the home page When it renders Then it highlights why to choose KRAAK with concrete differentiators', () => {
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Pourquoi choisir KRAAK ?');
    expect(content).toContain("Expertise reconnue à l'international");
    expect(content).toContain('Résultats concrets et mesurables');
    expect(content).not.toContain('Réseau de partenaires stratégiques');
  });

  it('Given the home page When it renders Then it reprises the final conversion block with the collaborator wording', () => {
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Vous savez où vous voulez aller.');
    expect(content).toContain('Nous savons comment vous y amener.');
    expect(content).toContain('Prendre rendez-vous maintenant');
  });

  it('Given the home page When its FAQ renders Then it shows the home-specific questions', () => {
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Questions fréquentes');
    expect(content).toContain(
      'Je ne sais pas par où commencer. Quelle est la première étape ?',
    );
  });
});
