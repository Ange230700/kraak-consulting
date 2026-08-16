import {
  Component,
  Injector,
  OnDestroy,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { NgStyle } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';

import {
  initializeMarketingPageAnimations,
  teardownMarketingPageAnimations,
} from '../../core/animations/marketing-page-animations';
import { buildHeroBackgroundStyle } from '../../shared/brand/brand-constants';
import { CtaBanner } from '../../shared/cta-banner/cta-banner.component';
import { RevealOnScrollDirective } from '../../shared/motion/reveal-on-scroll.directive';
import type { GsapAnimationsService } from '../../core/animations/gsap-animations.service';
import {
  FaqAccordion,
  type FaqItem,
} from '../../shared/faq-accordion/faq-accordion.component';
import { LocalizedPublicPathPipe } from '../../routing/localized-public-path.pipe';
import {
  KraakI18nService,
  KraakTranslatePipe,
} from '../../../../../shared/i18n';

const SERVICES_HERO_BACKGROUND_STYLE = buildHeroBackgroundStyle(
  '/assets/site-visuals/photos/services-hero-project-planning.avif',
);

const SERVICES_FAQ_TRANSLATIONS = [
  {
    questionKey: 'web.services.faq.items.serviceChoice.question',
    answerKey: 'web.services.faq.items.serviceChoice.answer',
  },
  {
    questionKey: 'web.services.faq.items.initialGuidance.question',
    answerKey: 'web.services.faq.items.initialGuidance.answer',
  },
  {
    questionKey: 'web.services.faq.items.organisationSupport.question',
    answerKey: 'web.services.faq.items.organisationSupport.answer',
  },
] as const;

@Component({
  selector: 'kraak-services-page',
  standalone: true,
  imports: [
    NgStyle,
    RouterLink,
    ButtonDirective,
    FaqAccordion,
    CtaBanner,
    RevealOnScrollDirective,
    LocalizedPublicPathPipe,
    KraakTranslatePipe,
  ],
  templateUrl: './services.page.html',
})
export default class ServicesPage implements OnInit, OnDestroy {
  protected readonly heroBackgroundStyle = SERVICES_HERO_BACKGROUND_STYLE;

  private readonly i18n = inject(KraakI18nService);
  private readonly injector = inject(Injector);
  private gsapService: GsapAnimationsService | null = null;
  private isDestroyed = false;

  protected readonly faqItems = computed<readonly FaqItem[]>(() => {
    this.i18n.locale();

    return SERVICES_FAQ_TRANSLATIONS.map(({ questionKey, answerKey }) => ({
      question: this.i18n.translate(questionKey),
      answer: this.i18n.translate(answerKey),
    }));
  });

  ngOnInit(): void {
    void this.initializeAnimations();
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    if (this.gsapService) {
      teardownMarketingPageAnimations(this.gsapService);
    }
  }

  private async initializeAnimations(): Promise<void> {
    const gsapService = await this.resolveGsapService();
    if (!gsapService) {
      return;
    }

    initializeMarketingPageAnimations(gsapService);
    gsapService.initializeReversibleScrollAnimations(
      '.services-method-step[data-motion="reversible"]',
    );
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
