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
      'Transformez votre potentiel en trajectoire concr\u00e8te.',
    );
  });

  it('Given the home page When it renders Then it shows the primary consulting calls to action', () => {
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Parler \u00e0 un conseiller');
    expect(element.textContent).toContain('Explorer nos services');
    expect(element.textContent).toContain('Recherche & Gestion de projets');
  });

  it('Given the home page component When reading the hero background Then it exposes the expected style object', () => {
    const fixture = TestBed.createComponent(HomePage);
    const component = fixture.componentInstance;

    expect(component.heroBackgroundStyle.background).toContain(
      'home-hero-workshop.avif',
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

  it('Given the home page When it renders Then it shows a single home-specific FAQ section', () => {
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const faqAccordion = element.querySelector('kraak-faq-accordion');

    expect(faqAccordion).not.toBeNull();
    expect(element.querySelectorAll('kraak-faq-accordion')).toHaveLength(1);
    expect(element.textContent).toContain('Questions fr\u00e9quentes');
  });

  it("Given the home page When it renders Then it exposes proof blocks grounded in KRAAK's real positioning", () => {
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Insertion socioprofessionnelle');
    expect(content).toContain('Approche bidirectionnelle');
    expect(content).toContain('Exp\u00e9rience internationale');
    expect(content).toContain('Accompagnement structur\u00e9');
  });

  it('should render home-specific FAQ section', () => {
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Questions fr\u00E9quentes');
    expect(content).toContain(
      'Je ne sais pas par o\u00F9 commencer, quelle est la premi\u00E8re \u00E9tape ?',
    );
  });
});
