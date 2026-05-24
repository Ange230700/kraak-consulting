import { NgStyle } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';

import { GsapAnimationsService } from '../../core/animations/gsap-animations.service';
import { buildHeroBackgroundStyle } from '../../shared/brand/brand-constants';
import { CtaBanner } from '../../shared/cta-banner/cta-banner.component';
import { SeoService } from '../../seo/seo.service';
import {
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
  private readonly seoService = inject(SeoService);
  private readonly gsapService = inject(GsapAnimationsService);
  private readonly slug = this.route.snapshot.paramMap.get('slug') ?? '';

  protected readonly article = findBlogArticleBySlug(this.slug);
  protected readonly relatedArticles = this.article
    ? getRelatedBlogArticles(this.article)
    : [];
  protected readonly heroBackgroundStyle = buildHeroBackgroundStyle(
    this.article?.coverImagePath ??
      '/assets/site-visuals/photos/home-hero-workshop.avif',
  );

  ngOnInit(): void {
    this.gsapService.animatePageIn();
    this.gsapService.initializeFigureAnimations('figure.reveal-on-scroll');
    this.gsapService.initializeInteractiveCardAnimations('article');
    this.gsapService.initializeButtonTransitions();
    this.gsapService.initializeSectionAnimations();

    this.seoService.applyPageSeo(
      this.article
        ? buildBlogArticleSeo(this.article)
        : buildMissingBlogArticleSeo(this.slug),
    );
  }

  ngOnDestroy(): void {
    this.gsapService.killAllAnimations();
  }
}
