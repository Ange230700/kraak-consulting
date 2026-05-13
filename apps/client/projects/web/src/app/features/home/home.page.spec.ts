import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import HomePage from './home.page';
import { GsapAnimationsService } from '../../core/animations/gsap-animations.service';

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

  it('should create', () => {
    const fixture = TestBed.createComponent(HomePage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the consulting hero promise', () => {
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
    const heading = fixture.nativeElement.querySelector('h1');
    expect(heading?.textContent).toContain(
      'D\u00E9veloppez vos comp\u00E9tences',
    );
  });

  it('should render the primary consulting calls to action', () => {
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('R\u00E9server une consultation');
    expect(element.textContent).toContain('D\u00E9couvrir nos services');
    expect(element.textContent).toContain('Recherche & Gestion de projets');
  });

  it('should expose a dark hero background style object', () => {
    const fixture = TestBed.createComponent(HomePage);
    const component = fixture.componentInstance;

    expect(component.heroBackgroundStyle.background).toContain(
      'bw-hero-bg.jpg',
    );
    expect(component.heroBackgroundStyle.backgroundBlendMode).toBe(
      'normal, multiply, lighten, normal',
    );
  });

  it('should render the key solutions without repeating one service label only', () => {
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain(
      'D&eacute;veloppement personnel et professionnel',
    );
    expect(content).toContain('Anglais et fran&ccedil;ais professionnel');
    expect(content).toContain('Leadership et prise de parole');
    expect(content).toContain('Pr&eacute;paration aux entretiens');
    expect(content).toContain('Structuration de projets');
    expect(content).toContain("Accompagnement d'entreprises et startups");
    expect(content).toContain('Conseils en mobilit&eacute; internationale');
    expect(content).toContain('Recrutement et placement en emploi');
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
