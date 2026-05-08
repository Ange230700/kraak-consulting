import { Component, OnInit, OnDestroy, inject } from '@angular/core';

import { CtaBanner } from '../../shared/cta-banner/cta-banner';
import { GsapAnimationsService } from '../../core/animations/gsap-animations.service';

@Component({
  selector: 'kraak-programs-page',
  standalone: true,
  imports: [CtaBanner],
  templateUrl: './programs.page.html',
})
export default class ProgramsPage implements OnInit, OnDestroy {
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
