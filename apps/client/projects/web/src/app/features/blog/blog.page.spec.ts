import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { delay, of } from 'rxjs';

import { GsapAnimationsService } from '../../core/animations/gsap-animations.service';
import { blogArticles } from './blog.data';
import { BlogPublicService } from './blog-public.service';
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
        {
          provide: BlogPublicService,
          useValue: {
            listPublishedArticles: () => of([...blogArticles]).pipe(delay(0)),
          } satisfies Pick<BlogPublicService, 'listPublishedArticles'>,
        },
      ],
    }).compileComponents();
  });

  it('Given the blog page component When it is created Then the instance exists', () => {
    const fixture = TestBed.createComponent(BlogPage);

    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });

  it('Given the blog page When the API request is in progress Then it keeps the non-blocking fallback state', () => {
    const fixture = TestBed.createComponent(BlogPage);
    fixture.detectChanges();

    expect(
      (fixture.componentInstance as unknown as { isLoading: boolean })
        .isLoading,
    ).toBe(false);
    fixture.destroy();
  });

  it('Given the blog page When it renders before API data is loaded Then it shows the editorial hero with fallback content', () => {
    const fixture = TestBed.createComponent(BlogPage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain(
      'Actualités, repères et analyses pour avancer avec clarté.',
    );
    expect(content).toContain('Article vedette');
    expect(content).not.toContain('Chargement des articles…');

    fixture.destroy();
  });
});
