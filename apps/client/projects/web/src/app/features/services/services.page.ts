import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { NgStyle } from '@angular/common';
import { RouterLink } from '@angular/router';

import { GsapAnimationsService } from '../../core/animations/gsap-animations.service';
import { buildHeroBackgroundStyle } from '../../shared/brand/brand-constants';
import { CtaBanner } from '../../shared/cta-banner/cta-banner.component';

const SERVICES_HERO_BACKGROUND_STYLE = buildHeroBackgroundStyle(
  '/assets/site-visuals/photos/services-hero-project-planning.avif',
);

@Component({
  selector: 'kraak-services-page',
  standalone: true,
  imports: [NgStyle, RouterLink, CtaBanner],
  templateUrl: './services.page.html',
})
export default class ServicesPage implements OnInit, OnDestroy {
  protected readonly heroBackgroundStyle = SERVICES_HERO_BACKGROUND_STYLE;

  private readonly gsapService = inject(GsapAnimationsService);

  ngOnInit(): void {
    this.gsapService.animatePageIn();
    this.gsapService.initializeFigureAnimations('figure.reveal-on-scroll');
    this.gsapService.initializeInteractiveCardAnimations('article');
    this.gsapService.initializeButtonTransitions();
    this.gsapService.initializeSectionAnimations();
    this.gsapService.initializeIconAnimations();
  }

  ngOnDestroy(): void {
    this.gsapService.killAllAnimations();
  }
}
