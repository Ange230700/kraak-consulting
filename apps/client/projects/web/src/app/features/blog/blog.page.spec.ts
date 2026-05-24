import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { GsapAnimationsService } from '../../core/animations/gsap-animations.service';
import BlogPage from './blog.page';

const gsapAnimationsServiceMock: Pick<
  GsapAnimationsService,
  | 'animatePageIn'
  | 'initializeFigureAnimations'
  | 'initializeInteractiveCardAnimations'
  | 'initializeButtonTransitions'
  | 'initializeSectionAnimations'
  | 'killAllAnimations'
> = {
  animatePageIn: () => undefined,
  initializeFigureAnimations: () => undefined,
  initializeInteractiveCardAnimations: () => undefined,
  initializeButtonTransitions: () => undefined,
  initializeSectionAnimations: () => undefined,
  killAllAnimations: () => undefined,
};

describe('BlogPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlogPage],
      providers: [
        provideRouter([]),
        {
          provide: GsapAnimationsService,
          useValue: gsapAnimationsServiceMock,
        },
      ],
    }).compileComponents();
  });

  it('Given the blog page component When it is created Then the instance exists', () => {
    const fixture = TestBed.createComponent(BlogPage);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given the blog page When it renders Then it shows the editorial hero and featured article', () => {
    const fixture = TestBed.createComponent(BlogPage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain(
      'Actualités, repères et analyses pour avancer avec clarté.',
    );
    expect(content).toContain('Article vedette');
    expect(content).toContain('Clarifier son projet avant de candidater');
    expect(content).toContain('Choisir un format de formation utile');
    expect(content).toContain(
      'Préparer un dossier immigration sans perdre le fil',
    );
  });
});
