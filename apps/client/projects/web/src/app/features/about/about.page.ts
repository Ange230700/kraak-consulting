import { Component, Injector, OnInit, OnDestroy, inject } from '@angular/core';

import { CtaBanner } from '../../shared/cta-banner/cta-banner.component';
import { RevealOnScrollDirective } from '../../shared/motion/reveal-on-scroll.directive';
import { LazyGsapLoader } from '../../core/animations/lazy-gsap-loader';
import { initializeMarketingPageAnimations } from '../../core/animations/marketing-page-animations';
import { KraakTranslatePipe } from '../../../../../shared/i18n/kraak-i18n.pipe';

@Component({
  selector: 'kraak-about-page',
  standalone: true,
  imports: [CtaBanner, RevealOnScrollDirective, KraakTranslatePipe],
  templateUrl: './about.page.html',
})
export default class AboutPage implements OnInit, OnDestroy {
  private readonly animations = new LazyGsapLoader(inject(Injector));

  ngOnInit(): void {
    void this.initializeAnimations();
  }

  ngOnDestroy(): void {
    this.animations.destroy();
  }

  private async initializeAnimations(): Promise<void> {
    const gsapService = await this.animations.resolve();
    if (!gsapService) {
      return;
    }

    initializeMarketingPageAnimations(gsapService, {
      reversibleSelector: 'article[data-motion="reversible"]',
    });
  }
}
