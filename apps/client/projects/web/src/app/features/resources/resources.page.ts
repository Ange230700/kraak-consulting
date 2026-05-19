import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { NgStyle } from '@angular/common';

import { buildHeroBackgroundStyle } from '../../shared/brand/brand-constants';
import { CtaBanner } from '../../shared/cta-banner/cta-banner.component';
import { GsapAnimationsService } from '../../core/animations/gsap-animations.service';

const RESOURCES_HERO_BACKGROUND_STYLE = buildHeroBackgroundStyle(
  '/assets/site-visuals/photos/resources-orientation-consultation.avif',
);

@Component({
  selector: 'kraak-resources-page',
  standalone: true,
  imports: [NgStyle, CtaBanner],
  templateUrl: './resources.page.html',
})
export default class ResourcesPage implements OnInit, OnDestroy {
  protected readonly heroBackgroundStyle = RESOURCES_HERO_BACKGROUND_STYLE;

  private readonly gsapService = inject(GsapAnimationsService);

  ngOnInit(): void {
    this.gsapService.animatePageIn();
    this.gsapService.initializeFigureAnimations('figure.reveal-on-scroll');
    this.gsapService.initializeInteractiveCardAnimations('article');
    this.gsapService.initializeButtonTransitions();
    this.gsapService.initializeSectionAnimations();
    this.gsapService.initializeListItemAnimations();
  }

  ngOnDestroy(): void {
    this.gsapService.killAllAnimations();
  }
}
