import {
  Component,
  Injector,
  OnDestroy,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';

import { initializeMarketingPageAnimations } from '../../core/animations/marketing-page-animations';
import { LazyGsapLoader } from '../../core/animations/lazy-gsap-loader';
import { CtaBanner } from '../../shared/cta-banner/cta-banner.component';
import { RevealOnScrollDirective } from '../../shared/motion/reveal-on-scroll.directive';
import {
  FaqAccordion,
  type FaqItem,
} from '../../shared/faq-accordion/faq-accordion.component';
import { LocalizedPublicPathPipe } from '../../routing/localized-public-path.pipe';
import { KraakI18nService } from '../../../../../shared/i18n/kraak-i18n.service';
import { KraakTranslatePipe } from '../../../../../shared/i18n/kraak-i18n.pipe';

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
  private readonly i18n = inject(KraakI18nService);
  private readonly animations = new LazyGsapLoader(inject(Injector));

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
    this.animations.destroy();
  }

  private async initializeAnimations(): Promise<void> {
    const gsapService = await this.animations.resolve();
    if (!gsapService) {
      return;
    }

    initializeMarketingPageAnimations(gsapService);
    gsapService.initializeReversibleScrollAnimations(
      '.services-method-step[data-motion="reversible"]',
    );
  }
}
