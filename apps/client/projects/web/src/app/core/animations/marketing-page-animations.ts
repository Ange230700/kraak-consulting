import type { GsapAnimationsService } from './gsap-animations.service';

export function initializeMarketingPageAnimations(
  gsapService: GsapAnimationsService,
  options: {
    reversibleSelector?: string;
    icons?: boolean;
    listItems?: boolean;
  } = {},
): void {
  gsapService.animatePageIn();
  gsapService.initializeFigureAnimations('figure.reveal-on-scroll');
  if (options.reversibleSelector) {
    gsapService.initializeReversibleScrollAnimations(
      options.reversibleSelector,
    );
  }
  gsapService.initializeInteractiveCardAnimations('article');
  gsapService.initializeButtonTransitions();
  if (options.icons !== false) {
    gsapService.initializeIconAnimations();
  }
  if (options.listItems) {
    gsapService.initializeListItemAnimations();
  }
}
