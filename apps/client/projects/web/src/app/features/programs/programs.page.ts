import { Component, Injector, OnInit, OnDestroy, inject } from '@angular/core';
import { NgStyle } from '@angular/common';

import { buildHeroBackgroundStyle } from '../../shared/brand/brand-constants';
import { CtaBanner } from '../../shared/cta-banner/cta-banner.component';
import { RevealOnScrollDirective } from '../../shared/motion/reveal-on-scroll.directive';
import type { GsapAnimationsService } from '../../core/animations/gsap-animations.service';

const PROGRAMS_HERO_BACKGROUND_STYLE = buildHeroBackgroundStyle(
  '/assets/site-visuals/photos/programs-hero-adult-learning.avif',
);

@Component({
  selector: 'kraak-programs-page',
  standalone: true,
  imports: [NgStyle, CtaBanner, RevealOnScrollDirective],
  templateUrl: './programs.page.html',
})
export default class ProgramsPage implements OnInit, OnDestroy {
  protected readonly heroBackgroundStyle = PROGRAMS_HERO_BACKGROUND_STYLE;

  private readonly injector = inject(Injector);
  private gsapService: GsapAnimationsService | null = null;
  private isDestroyed = false;

  ngOnInit(): void {
    void this.initializeAnimations();
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    this.gsapService?.killAllAnimations();
  }

  private async initializeAnimations(): Promise<void> {
    const gsapService = await this.resolveGsapService();
    if (!gsapService) {
      return;
    }

    gsapService.animatePageIn();
    gsapService.initializeFigureAnimations('figure.reveal-on-scroll');
    gsapService.initializeReversibleScrollAnimations(
      'article[data-motion="reversible"]',
    );
    gsapService.initializeInteractiveCardAnimations('article');
    gsapService.initializeButtonTransitions();
    gsapService.initializeListItemAnimations();
  }

  private async resolveGsapService(): Promise<GsapAnimationsService | null> {
    if (globalThis.window === undefined) {
      return null;
    }

    if (this.gsapService) {
      return this.gsapService;
    }

    const { GsapAnimationsService } =
      await import('../../core/animations/gsap-animations.service');

    if (this.isDestroyed) {
      return null;
    }

    this.gsapService = this.injector.get(GsapAnimationsService);
    return this.gsapService;
  }
}
