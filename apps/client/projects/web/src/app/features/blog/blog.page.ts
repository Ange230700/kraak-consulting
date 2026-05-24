import { NgStyle } from '@angular/common';
import {
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';

import { GsapAnimationsService } from '../../core/animations/gsap-animations.service';
import { buildHeroBackgroundStyle } from '../../shared/brand/brand-constants';
import { CtaBanner } from '../../shared/cta-banner/cta-banner.component';
import { BlogArticle, getFallbackBlogArticles } from './blog.data';
import { BlogPublicService } from './blog-public.service';

const BLOG_HERO_BACKGROUND_STYLE = buildHeroBackgroundStyle(
  '/assets/site-visuals/photos/home-hero-workshop.avif',
);

@Component({
  selector: 'kraak-blog-page',
  standalone: true,
  imports: [NgStyle, RouterLink, ButtonDirective, CtaBanner],
  templateUrl: './blog.page.html',
})
export default class BlogPage implements OnInit, OnDestroy {
  protected readonly heroBackgroundStyle = BLOG_HERO_BACKGROUND_STYLE;
  protected readonly pageSize = 6;
  protected featuredArticle: BlogArticle | null = null;
  protected pagedArticles: BlogArticle[] = [];
  protected totalPages = 1;
  protected currentPage = 1;
  protected totalArticles = 0;
  protected isLoading = false;
  private listArticles: BlogArticle[] = [];

  private readonly destroyRef = inject(DestroyRef);
  private readonly gsapService = inject(GsapAnimationsService);
  private readonly blogPublicService = inject(BlogPublicService);

  constructor() {
    this.applyArticles([...getFallbackBlogArticles()]);
  }

  ngOnInit(): void {
    this.gsapService.animatePageIn();
    this.gsapService.initializeFigureAnimations('figure.reveal-on-scroll');
    this.gsapService.initializeInteractiveCardAnimations('article');
    this.gsapService.initializeButtonTransitions();
    this.gsapService.initializeSectionAnimations();

    this.loadPublishedArticles();
  }

  private loadPublishedArticles(): void {
    setTimeout(() => {
      this.blogPublicService
        .listPublishedArticles()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((articles) => {
          this.isLoading = false;
          this.applyArticles(articles);
        });
    }, 0);
  }

  ngOnDestroy(): void {
    this.gsapService.killAllAnimations();
  }

  protected get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }

    this.currentPage = page;
    this.updatePagedArticles();
  }

  protected goToPreviousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  protected goToNextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  private applyArticles(articles: BlogArticle[]): void {
    this.totalArticles = articles.length;
    this.featuredArticle = articles[0] ?? null;

    this.listArticles = this.featuredArticle ? articles.slice(1) : articles;
    this.totalPages = Math.max(
      1,
      Math.ceil(this.listArticles.length / this.pageSize),
    );
    this.currentPage = 1;
    this.pagedArticles = this.listArticles.slice(0, this.pageSize);
  }

  private updatePagedArticles(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;

    this.pagedArticles = this.listArticles.slice(
      startIndex,
      startIndex + this.pageSize,
    );
  }
}
