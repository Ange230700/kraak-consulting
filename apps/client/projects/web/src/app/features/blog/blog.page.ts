import { NgStyle } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';

import { GsapAnimationsService } from '../../core/animations/gsap-animations.service';
import { buildHeroBackgroundStyle } from '../../shared/brand/brand-constants';
import { CtaBanner } from '../../shared/cta-banner/cta-banner.component';
import { blogArticles } from './blog.data';

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
  protected readonly featuredArticle = blogArticles[0];
  protected readonly articles = blogArticles;
  protected readonly categories = [
    { label: 'Employabilité', description: 'Projet, candidature et posture.' },
    { label: 'Formation', description: 'Formats utiles et progression.' },
    {
      label: 'Immigration',
      description: 'Dossiers, cohérence et préparation.',
    },
  ] as const;

  private readonly gsapService = inject(GsapAnimationsService);

  ngOnInit(): void {
    this.gsapService.animatePageIn();
    this.gsapService.initializeFigureAnimations('figure.reveal-on-scroll');
    this.gsapService.initializeInteractiveCardAnimations('article');
    this.gsapService.initializeButtonTransitions();
    this.gsapService.initializeSectionAnimations();
  }

  ngOnDestroy(): void {
    this.gsapService.killAllAnimations();
  }
}
