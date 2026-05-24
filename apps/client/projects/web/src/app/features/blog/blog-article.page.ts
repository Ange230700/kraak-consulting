import { NgStyle } from '@angular/common';
import {
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { startWith } from 'rxjs';

import { GsapAnimationsService } from '../../core/animations/gsap-animations.service';
import { buildHeroBackgroundStyle } from '../../shared/brand/brand-constants';
import { CtaBanner } from '../../shared/cta-banner/cta-banner.component';
import { SeoService } from '../../seo/seo.service';
import {
  type BlogArticle,
  buildBlogArticleSeo,
  buildMissingBlogArticleSeo,
  findBlogArticleBySlug,
  getRelatedBlogArticles,
} from './blog.data';

@Component({
  selector: 'kraak-blog-article-page',
  standalone: true,
  imports: [NgStyle, RouterLink, ButtonDirective, CtaBanner],
  templateUrl: './blog-article.page.html',
})
export default class BlogArticlePage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly seoService = inject(SeoService);
  private readonly gsapService = inject(GsapAnimationsService);

  protected article: BlogArticle | undefined;
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
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => this.applyPageState(params.get('slug') ?? ''));
  }

  ngOnDestroy(): void {
    this.gsapService.killAllAnimations();
  }

  private applyPageState(slug: string): void {
    this.article = findBlogArticleBySlug(slug);
    this.relatedArticles = this.article
      ? getRelatedBlogArticles(this.article)
      : [];
    this.heroBackgroundStyle = buildHeroBackgroundStyle(
      this.article?.coverImagePath ??
        '/assets/site-visuals/photos/home-hero-workshop.avif',
    );

    this.seoService.applyPageSeo(
      this.article
        ? buildBlogArticleSeo(this.article)
        : buildMissingBlogArticleSeo(slug),
    );
  }
}
