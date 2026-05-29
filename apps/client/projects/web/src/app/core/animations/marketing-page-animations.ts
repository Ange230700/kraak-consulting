import { GsapAnimationsService } from './gsap-animations.service';

export function initializeMarketingPageAnimations(
  gsapService: GsapAnimationsService,
): void {
  gsapService.animatePageIn();
  gsapService.initializeFigureAnimations('figure.reveal-on-scroll');
  gsapService.initializeInteractiveCardAnimations('article');
  gsapService.initializeButtonTransitions();
  gsapService.initializeSectionAnimations();
  gsapService.initializeIconAnimations();
}

export function teardownMarketingPageAnimations(
  gsapService: GsapAnimationsService,
): void {
  gsapService.killAllAnimations();
}
