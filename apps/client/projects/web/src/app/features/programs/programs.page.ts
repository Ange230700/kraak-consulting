import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { NgStyle } from '@angular/common';

import { buildHeroBackgroundStyle } from '../../shared/brand/brand-constants';
import { CtaBanner } from '../../shared/cta-banner/cta-banner.component';
import { GsapAnimationsService } from '../../core/animations/gsap-animations.service';
import { RevealOnScrollDirective } from '../../shared/motion/reveal-on-scroll.directive';

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

  private readonly gsapService = inject(GsapAnimationsService);

  ngOnInit(): void {
    this.gsapService.animatePageIn();
    this.gsapService.initializeFigureAnimations('figure.reveal-on-scroll');
    this.gsapService.initializeInteractiveCardAnimations('article');
    this.gsapService.initializeButtonTransitions();
    this.gsapService.initializeListItemAnimations();
  }

  ngOnDestroy(): void {
    this.gsapService.killAllAnimations();
  }
}
