import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  ParamMap,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { vi } from 'vitest';

import { KraakI18nService, provideKraakI18n } from '../../../../../shared/i18n';

import { GsapAnimationsService } from '../../core/animations/gsap-animations.service';
import { SeoService } from '../../seo/seo.service';
import { blogArticles } from './blog.data';
import { BlogPublicService } from './blog-public.service';
import BlogArticlePage from './blog-article.page';

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

describe('BlogArticlePage', () => {
  afterEach(() => {
    document.head.querySelector('#kraak-blog-article-jsonld')?.remove();
  });

  beforeEach(async () => {
    globalThis.window.localStorage.setItem('kraak:locale', 'fr-CI');

    seoServiceMock.applyPageSeo.mockReset();
    blogPublicServiceMock.listPublishedArticles.mockClear();
    blogPublicServiceMock.getPublishedArticleBySlug.mockClear();
    paramMapSubject = new BehaviorSubject(
      convertToParamMap({
        slug: 'clarifier-son-projet-avant-de-candidater',
      }),
    );

    await TestBed.configureTestingModule({
      imports: [BlogArticlePage],
      providers: [
        provideRouter([]),
        provideKraakI18n(),
        {
          provide: SeoService,
          useValue: seoServiceMock,
        },
        {
          provide: GsapAnimationsService,
          useValue: gsapAnimationsServiceMock,
        },
        {
          provide: BlogPublicService,
          useValue: blogPublicServiceMock,
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({
                slug: 'clarifier-son-projet-avant-de-candidater',
              }),
            },
            paramMap: paramMapSubject.asObservable(),
          },
        },
      ],
    }).compileComponents();

    await TestBed.inject(ApplicationInitStatus).donePromise;
    await TestBed.inject(KraakI18nService).setLocale('fr-CI');
  });
  it('Given une route d’article anglaise sans date éditoriale, When les données structurées sont générées, Then la locale et la date de repli sont explicites', () => {
    TestBed.inject(ActivatedRoute).snapshot.data = { locale: 'en-GB' };
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-25T12:00:00.000Z'));
    const page = TestBed.createComponent(BlogArticlePage).componentInstance;
    page['updateStructuredData']({
      ...blogArticles[0],
      publishedAt: null,
      createdAt: undefined,
      updatedAt: undefined,
      coverImagePath: 'http://images.example.test/article.jpg',
    });
    const script = document.head.querySelector('#kraak-blog-article-jsonld')!;
    const article = JSON.parse(script.textContent!) as {
      datePublished: string;
      dateModified: string;
      image: string[];
    };
    expect(article.datePublished).toBe('2026-10-25T12:00:00.000Z');
    expect(article.dateModified).toBe(article.datePublished);
    expect(article.image).toEqual(['http://images.example.test/article.jpg']);
    expect(page['routeLocale']).toBe('en-GB');
    vi.useRealTimers();
  });

  it('Given aucun slug dans la route, When la page est initialisée, Then un article absent est traité sans requête ambiguë', () => {
    paramMapSubject.next(convertToParamMap({}));
    Object.defineProperty(TestBed.inject(ActivatedRoute).snapshot, 'paramMap', {
      value: convertToParamMap({}),
    });
    const fixture = TestBed.createComponent(BlogArticlePage);
    const applyState = vi
      .spyOn(
        fixture.componentInstance as unknown as {
          applyArticleState: (...args: unknown[]) => void;
        },
        'applyArticleState',
      )
      .mockImplementation(() => undefined);
    fixture.detectChanges();
    expect(
      blogPublicServiceMock.getPublishedArticleBySlug,
    ).toHaveBeenCalledWith('', null);
    expect(applyState).toHaveBeenCalledWith('', null, expect.any(Array));
    expect(fixture.componentInstance['article']).toBeNull();
  });
  const seoServiceMock = {
    applyPageSeo: vi.fn(),
  };
  const blogPublicServiceMock = {
    listPublishedArticles: vi.fn(() => of([...blogArticles])),
    getPublishedArticleBySlug: vi.fn((slug: string) =>
      of(blogArticles.find((article) => article.slug === slug) ?? null),
    ),
  };
  let paramMapSubject: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  it('Given the article page component When it is created Then the instance exists', () => {
    const fixture = TestBed.createComponent(BlogArticlePage);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given the article page When it renders Then it shows the article headline and details', () => {
    const fixture = TestBed.createComponent(BlogArticlePage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Clarifier son projet avant de candidater');
    expect(content).toContain("Contenu de l'article");
    expect(content).toContain('À retenir');
    expect(content).toContain('Aline Koné');
    expect(content).toContain('Retour au blog');
  });

  it('Given the article page When it initializes Then it applies article specific SEO', () => {
    const fixture = TestBed.createComponent(BlogArticlePage);
    fixture.detectChanges();

    expect(seoServiceMock.applyPageSeo).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/fr/blog/clarifier-son-projet-avant-de-candidater',
        title: 'Clarifier son projet avant de candidater | KRAAK Consulting',
      }),
    );

    const jsonLdTag = document.head.querySelector<HTMLScriptElement>(
      '#kraak-blog-article-jsonld',
    );
    expect(jsonLdTag).not.toBeNull();
    expect(jsonLdTag?.textContent).toContain('"@type":"Article"');
    expect(
      blogPublicServiceMock.getPublishedArticleBySlug,
    ).toHaveBeenCalledTimes(1);
  });

  it('Given an API article with absolute cover image URL, When SEO is rendered, Then JSON-LD keeps that absolute URL', () => {
    blogPublicServiceMock.getPublishedArticleBySlug.mockReturnValueOnce(
      of({
        ...blogArticles[0],
        coverImagePath: 'https://cdn.example.com/cover.jpg',
      }),
    );

    const fixture = TestBed.createComponent(BlogArticlePage);
    fixture.detectChanges();

    const jsonLdTag = document.head.querySelector<HTMLScriptElement>(
      '#kraak-blog-article-jsonld',
    );

    expect(jsonLdTag?.textContent).toContain(
      '"image":["https://cdn.example.com/cover.jpg"]',
    );
  });

  it('Given the article page initial load When route params emit the initial slug Then the article is fetched once', () => {
    const fixture = TestBed.createComponent(BlogArticlePage);
    fixture.detectChanges();

    expect(
      blogPublicServiceMock.getPublishedArticleBySlug,
    ).toHaveBeenCalledTimes(1);
  });

  it('Given the same component instance When the slug route parameter changes Then article state and SEO are updated', () => {
    const fixture = TestBed.createComponent(BlogArticlePage);
    fixture.detectChanges();

    seoServiceMock.applyPageSeo.mockClear();

    paramMapSubject.next(
      convertToParamMap({
        slug: 'preparer-un-dossier-immigration-sans-perdre-le-fil',
      }),
    );
    expect(
      (
        fixture.componentInstance as unknown as {
          article?: { slug: string };
        }
      ).article?.slug,
    ).toBe('preparer-un-dossier-immigration-sans-perdre-le-fil');
    expect(seoServiceMock.applyPageSeo).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/fr/blog/preparer-un-dossier-immigration-sans-perdre-le-fil',
      }),
    );
  });

  it('Given an unknown article slug, When the page loads, Then it applies missing article SEO and removes JSON-LD', () => {
    const fixture = TestBed.createComponent(BlogArticlePage);
    fixture.detectChanges();

    paramMapSubject.next(
      convertToParamMap({
        slug: 'slug-introuvable',
      }),
    );

    expect(seoServiceMock.applyPageSeo).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/fr/blog/slug-introuvable',
        title: 'Article introuvable | KRAAK Consulting',
      }),
    );
    expect(
      document.head.querySelector('#kraak-blog-article-jsonld'),
    ).toBeNull();
  });

  it('Given an unknown article slug, When template is rendered, Then empty-state copy and navigation actions are visible', () => {
    const missingSlug = convertToParamMap({
      slug: 'article-inexistant',
    });
    paramMapSubject.next(missingSlug);
    const route = TestBed.inject(ActivatedRoute) as {
      snapshot: { paramMap: ParamMap };
    };
    route.snapshot.paramMap = missingSlug;

    const fixture = TestBed.createComponent(BlogArticlePage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Article introuvable');
    expect(content).toContain('Cet article n’est pas disponible.');
    expect(content).toContain('Retour au blog');
    expect(content).toContain('Nous contacter');
  });
  it('Given the English locale When an article renders Then article-page chrome is localized', async () => {
    await TestBed.inject(KraakI18nService).setLocale('en-GB');

    const fixture = TestBed.createComponent(BlogArticlePage);
    fixture.detectChanges();

    const content = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(content).toContain('Back to blog');
    expect(content).toContain('Article content');
    expect(content).toContain('Key takeaways');
    expect(content).toContain('Author');
    expect(content).toContain('Category and tags');
    expect(content).toContain('Related articles');
    expect(content).toContain('Want to go further?');

    expect(content).not.toContain("Contenu de l'article");
    expect(content).not.toContain('À retenir');
  });
});
