import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { vi } from 'vitest';

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

  afterEach(() => {
    document.head.querySelector('#kraak-blog-article-jsonld')?.remove();
  });

  beforeEach(async () => {
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
  });

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
        path: 'blog/clarifier-son-projet-avant-de-candidater',
        title: 'Clarifier son projet avant de candidater | KRAAK Consulting',
      }),
    );

    const jsonLdTag = document.head.querySelector<HTMLScriptElement>(
      '#kraak-blog-article-jsonld',
    );
    expect(jsonLdTag).not.toBeNull();
    expect(jsonLdTag?.textContent).toContain('"@type":"Article"');
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
        path: 'blog/preparer-un-dossier-immigration-sans-perdre-le-fil',
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
        path: 'blog/slug-introuvable',
        title: 'Article introuvable | KRAAK Consulting',
      }),
    );
    expect(
      document.head.querySelector('#kraak-blog-article-jsonld'),
    ).toBeNull();
  });
});
