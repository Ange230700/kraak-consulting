import { Component, OnInit, OnDestroy, inject } from '@angular/core';

import { CtaBanner } from '../../shared/cta-banner/cta-banner';
import { GsapAnimationsService } from '../../core/animations/gsap-animations.service';

@Component({
  selector: 'kraak-resources-page',
  standalone: true,
  imports: [CtaBanner],
  templateUrl: './resources.page.html',
})
export default class ResourcesPage implements OnInit, OnDestroy {
  private readonly gsapService = inject(GsapAnimationsService);

  ngOnInit(): void {
    this.gsapService.initializeFigureAnimations('figure.reveal-on-scroll');
    this.gsapService.initializeInteractiveCardAnimations('article');
  }

  ngOnDestroy(): void {
    this.gsapService.killAllAnimations();
  }
}
