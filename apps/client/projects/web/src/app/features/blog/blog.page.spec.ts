import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { delay, of } from 'rxjs';
import { vi } from 'vitest';

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
  const listPublishedArticlesMock = vi.fn(() =>
    of([...blogArticles]).pipe(delay(0)),
  );

  beforeEach(async () => {
    listPublishedArticlesMock.mockReset();
    listPublishedArticlesMock.mockReturnValue(
      of([...blogArticles]).pipe(delay(0)),
    );

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
            listPublishedArticles: listPublishedArticlesMock,
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

  it('Given published articles are loaded, When async fetch resolves, Then featured and paginated articles are updated from API data', async () => {
    const apiArticles = [
      {
        ...blogArticles[1],
        slug: 'api-featured',
        title: 'Article vedette API',
      },
      {
        ...blogArticles[0],
        slug: 'api-secondary',
      },
    ];
    listPublishedArticlesMock.mockReturnValue(of(apiArticles));

    const fixture = TestBed.createComponent(BlogPage);
    fixture.detectChanges();

    await new Promise((resolve) => setTimeout(resolve, 0));

    const component = fixture.componentInstance as unknown as {
      featuredArticle: { slug: string; title: string } | null;
      totalArticles: number;
      totalPages: number;
      pagedArticles: { slug: string }[];
    };

    expect(listPublishedArticlesMock).toHaveBeenCalled();
    expect(component.featuredArticle?.slug).toBe('api-featured');
    expect(component.featuredArticle?.title).toBe('Article vedette API');
    expect(component.totalArticles).toBe(2);
    expect(component.totalPages).toBe(1);
    expect(component.pagedArticles.map((article) => article.slug)).toEqual([
      'api-secondary',
    ]);
  });

  it('Given multiple pages, When navigating with invalid and valid targets, Then pagination guards and updates behave correctly', () => {
    const manyArticles = [
      ...blogArticles,
      ...Array.from({ length: 10 }, (_, index) => ({
        ...blogArticles[index % blogArticles.length],
        slug: `extra-${index}`,
        id: `extra-id-${index}`,
      })),
    ];
    const fixture = TestBed.createComponent(BlogPage);
    const internal = fixture.componentInstance as unknown as {
      applyArticles: (articles: typeof manyArticles) => void;
    };
    internal.applyArticles(manyArticles);

    const component = fixture.componentInstance as unknown as {
      currentPage: number;
      totalPages: number;
      pageNumbers: number[];
      pagedArticles: { slug: string }[];
      goToPage: (page: number) => void;
      goToNextPage: () => void;
      goToPreviousPage: () => void;
    };

    expect(component.totalPages).toBeGreaterThan(1);
    expect(component.pageNumbers).toEqual(
      Array.from({ length: component.totalPages }, (_, index) => index + 1),
    );

    const initialSlugs = component.pagedArticles.map((article) => article.slug);
    component.goToPage(0);
    expect(component.currentPage).toBe(1);
    expect(component.pagedArticles.map((article) => article.slug)).toEqual(
      initialSlugs,
    );

    component.goToPage(component.totalPages + 1);
    expect(component.currentPage).toBe(1);

    component.goToPage(1);
    expect(component.currentPage).toBe(1);

    component.goToNextPage();
    expect(component.currentPage).toBe(2);
    expect(component.pagedArticles.map((article) => article.slug)).not.toEqual(
      initialSlugs,
    );

    component.goToPreviousPage();
    expect(component.currentPage).toBe(1);
    expect(component.pagedArticles.map((article) => article.slug)).toEqual(
      initialSlugs,
    );
  });

  it('Given no articles returned by API, When async fetch resolves, Then featured article is empty while pagination remains usable', async () => {
    listPublishedArticlesMock.mockReturnValue(of([]));

    const fixture = TestBed.createComponent(BlogPage);
    fixture.detectChanges();

    await new Promise((resolve) => setTimeout(resolve, 0));

    const component = fixture.componentInstance as unknown as {
      featuredArticle: unknown;
      totalArticles: number;
      totalPages: number;
      pagedArticles: unknown[];
      pageNumbers: number[];
    };

    expect(component.featuredArticle).toBeNull();
    expect(component.totalArticles).toBe(0);
    expect(component.totalPages).toBe(1);
    expect(component.pagedArticles).toEqual([]);
    expect(component.pageNumbers).toEqual([1]);
  });
});
