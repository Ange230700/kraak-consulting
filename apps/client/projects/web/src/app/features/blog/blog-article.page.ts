import { DOCUMENT, NgStyle } from '@angular/common';
import {
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Meta } from '@angular/platform-browser';
import { ButtonDirective } from 'primeng/button';
import { map, of, startWith, switchMap } from 'rxjs';

import { GsapAnimationsService } from '../../core/animations/gsap-animations.service';
import { buildHeroBackgroundStyle } from '../../shared/brand/brand-constants';
import { CtaBanner } from '../../shared/cta-banner/cta-banner.component';
import { SeoService } from '../../seo/seo.service';
import { buildAbsoluteUrl, resolvePublicSiteUrl } from '../../seo/site-seo';
import { environment } from '../../../environments/environment';
import {
  type BlogArticle,
  buildBlogArticleSeo,
  buildMissingBlogArticleSeo,
  findBlogArticleBySlug,
  getFallbackBlogArticles,
  getRelatedBlogArticles,
} from './blog.data';
import { BlogPublicService } from './blog-public.service';

@Component({
  selector: 'kraak-blog-article-page',
  standalone: true,
  imports: [NgStyle, RouterLink, ButtonDirective, CtaBanner],
  templateUrl: './blog-article.page.html',
})
export default class BlogArticlePage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly meta = inject(Meta);
  private readonly seoService = inject(SeoService);
  private readonly gsapService = inject(GsapAnimationsService);
  private readonly blogPublicService = inject(BlogPublicService);

  protected article: BlogArticle | null = null;
  protected relatedArticles: readonly BlogArticle[] = [];
  protected heroBackgroundStyle = buildHeroBackgroundStyle(
    '/assets/site-visuals/photos/home-hero-workshop.avif',
  );

  ngOnInit(): void {
    this.gsapService.animatePageIn();
    this.gsapService.initializeFigureAnimations('figure.reveal-on-scroll');
    this.gsapService.initializeInteractiveCardAnimations('article');
    this.gsapService.initializeButtonTransitions();
    this.gsapService.initializeSectionAnimations();

    this.route.paramMap
      .pipe(startWith(this.route.snapshot.paramMap))
      .pipe(map((params) => params.get('slug') ?? ''))
      .pipe(
        switchMap((slug) => {
          const fallbackArticles = [...getFallbackBlogArticles()];
          const fallbackArticle = findBlogArticleBySlug(slug, fallbackArticles);
          this.applyArticleState(
            slug,
            fallbackArticle ?? null,
            fallbackArticles,
          );

          return this.blogPublicService.getPublishedArticleBySlug(slug).pipe(
            switchMap((article) => {
              const articleToRender = article ?? fallbackArticle ?? null;

              if (!articleToRender) {
                return of({
                  slug,
                  article: null,
                  articlePool: [] as BlogArticle[],
                });
              }

              return this.blogPublicService.listPublishedArticles().pipe(
                map((publishedArticles) => ({
                  slug,
                  article: articleToRender,
                  articlePool: publishedArticles,
                })),
              );
            }),
          );
        }),
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ slug, article, articlePool }) => {
        this.applyArticleState(slug, article, articlePool);
      });
  }

  ngOnDestroy(): void {
    this.removeStructuredData();
    this.gsapService.killAllAnimations();
  }

  private updateStructuredData(article: BlogArticle): void {
    const siteUrl = resolvePublicSiteUrl(environment.siteUrl);
    const canonicalUrl = buildAbsoluteUrl(`blog/${article.slug}`, siteUrl);
    const imageUrl = buildAbsoluteUrl(article.coverImagePath, siteUrl);
    const publishedAt =
      article.publishedAt ?? article.createdAt ?? new Date().toISOString();
    const updatedAt = article.updatedAt ?? article.createdAt ?? publishedAt;

    const articleStructuredData = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description: article.seoDescription ?? article.summary,
      image: [imageUrl],
      datePublished: publishedAt,
      dateModified: updatedAt,
      mainEntityOfPage: canonicalUrl,
      author: {
        '@type': 'Person',
        name: article.author.name,
      },
      publisher: {
        '@type': 'Organization',
        name: 'KRAAK Consulting',
      },
    };

    this.upsertStructuredData(articleStructuredData);
  }

  private applyArticleState(
    slug: string,
    article: BlogArticle | null,
    articlePool: readonly BlogArticle[],
  ): void {
    this.article = article;
    this.relatedArticles = article
      ? getRelatedBlogArticles(article, articlePool)
      : [];
    this.heroBackgroundStyle = buildHeroBackgroundStyle(
      article?.coverImagePath ??
        '/assets/site-visuals/photos/home-hero-workshop.avif',
    );

    if (!article) {
      this.meta.updateTag({ property: 'og:type', content: 'website' });
      this.removeStructuredData();
      this.seoService.applyPageSeo(buildMissingBlogArticleSeo(slug));
      return;
    }

    this.seoService.applyPageSeo(buildBlogArticleSeo(article));
    this.meta.updateTag({ property: 'og:type', content: 'article' });
    this.updateStructuredData(article);
  }

  private upsertStructuredData(payload: Record<string, unknown>): void {
    const head = this.document.head;
    const scriptId = 'kraak-blog-article-jsonld';
    let jsonLdTag = head.querySelector<HTMLScriptElement>(`#${scriptId}`);

    if (!jsonLdTag) {
      jsonLdTag = this.document.createElement('script');
      jsonLdTag.id = scriptId;
      jsonLdTag.type = 'application/ld+json';
      head.appendChild(jsonLdTag);
    }

    jsonLdTag.textContent = JSON.stringify(payload);
  }

  private removeStructuredData(): void {
    this.document.head.querySelector('#kraak-blog-article-jsonld')?.remove();
  }
}
