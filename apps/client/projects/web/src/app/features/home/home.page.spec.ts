import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { GsapAnimationsService } from '../../core/animations/gsap-animations.service';
import HomePage from './home.page';

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
        provideRouter([]),
        {
          provide: GsapAnimationsService,
          useValue: gsapAnimationsServiceMock,
        },
      ],
    }).compileComponents();
  });

  it('Given the home page component When it is created Then the instance exists', () => {
    const fixture = TestBed.createComponent(HomePage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given the home page When it renders Then it shows the consulting hero promise', () => {
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
    const heading = fixture.nativeElement.querySelector('h1');
    expect(heading?.textContent).toContain(
      'D\u00e9veloppez vos comp\u00e9tences',
    );
  });

  it('Given the home page When it renders Then it shows the primary consulting calls to action', () => {
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('R\u00e9server une consultation');
    expect(element.textContent).toContain('D\u00e9couvrir nos services');
    expect(element.textContent).toContain('Recherche & Gestion de projets');
  });

  it('Given the home page component When reading the hero background Then it exposes the expected style object', () => {
    const fixture = TestBed.createComponent(HomePage);
    const component = fixture.componentInstance;

    expect(component.heroBackgroundStyle.background).toContain(
      'bw-hero-bg.jpg',
    );
    expect(component.heroBackgroundStyle.backgroundBlendMode).toBe(
      'normal, multiply, lighten, normal',
    );
  });

  it('Given the home page When it renders Then it lists the key solutions without collapsing them into one service label', () => {
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('D\u00e9veloppement personnel et professionnel');
    expect(content).toContain('Anglais et fran\u00e7ais professionnel');
    expect(content).toContain('Leadership et prise de parole');
    expect(content).toContain('Pr\u00e9paration aux entretiens');
    expect(content).toContain('Structuration de projets');
    expect(content).toContain("Accompagnement d'entreprises et startups");
    expect(content).toContain('Conseils en mobilit\u00e9 internationale');
    expect(content).toContain('Recrutement et placement en emploi');
  });

  it('Given the home page When it renders Then it does not duplicate the dedicated FAQ route content', () => {
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const faqAccordion = element.querySelector('kraak-faq-accordion');

    expect(faqAccordion).toBeNull();
    expect(element.textContent).not.toContain('Questions fr\u00e9quentes');
  });

  it('Given the local web build When the home page renders Then the preview sections stay visible for review', () => {
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Partenaires et clients de confiance');
    expect(content).toContain(
      'Pr\u00e9visualisation du format t\u00e9moignages',
    );
    expect(content).toContain(
      'Chiffres d\u2019impact en pr\u00e9visualisation',
    );
  });
});
