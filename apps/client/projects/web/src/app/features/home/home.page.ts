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
import { PublicConversionTrackingDirective } from '../../shared/analytics/public-conversion-tracking.directive';
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

const HOME_HERO_BACKGROUND_STYLE = buildHeroBackgroundStyle(
  '/assets/site-visuals/photos/programs-workshop.avif',
);

interface HomeTextTranslation {
  readonly textKey: string;
}

interface HomeCardTranslation {
  readonly titleKey: string;
  readonly descriptionKey: string;
}

const HOME_SOLUTION_TRANSLATIONS: readonly HomeTextTranslation[] = [
  { textKey: 'web.home.solutions.items.personalDevelopment' },
  { textKey: 'web.home.solutions.items.professionalLanguages' },
  { textKey: 'web.home.solutions.items.leadership' },
  { textKey: 'web.home.solutions.items.interviewPreparation' },
  { textKey: 'web.home.solutions.items.projectStructuring' },
  { textKey: 'web.home.solutions.items.businessSupport' },
  { textKey: 'web.home.solutions.items.internationalMobility' },
  { textKey: 'web.home.solutions.items.recruitment' },
];

const HOME_PROOF_TRANSLATIONS: readonly HomeCardTranslation[] = [
  {
    titleKey: 'web.home.proof.items.socioeconomicIntegration.title',
    descriptionKey: 'web.home.proof.items.socioeconomicIntegration.description',
  },
  {
    titleKey: 'web.home.proof.items.twoWayApproach.title',
    descriptionKey: 'web.home.proof.items.twoWayApproach.description',
  },
  {
    titleKey: 'web.home.proof.items.internationalExperience.title',
    descriptionKey: 'web.home.proof.items.internationalExperience.description',
  },
  {
    titleKey: 'web.home.proof.items.structuredSupport.title',
    descriptionKey: 'web.home.proof.items.structuredSupport.description',
  },
];

const HOME_WHY_CHOOSE_TRANSLATIONS: readonly HomeCardTranslation[] = [
  {
    titleKey: 'web.home.whyChoose.items.internationalExpertise.title',
    descriptionKey:
      'web.home.whyChoose.items.internationalExpertise.description',
  },
  {
    titleKey: 'web.home.whyChoose.items.personalisedSupport.title',
    descriptionKey: 'web.home.whyChoose.items.personalisedSupport.description',
  },
  {
    titleKey: 'web.home.whyChoose.items.measurableResults.title',
    descriptionKey: 'web.home.whyChoose.items.measurableResults.description',
  },
];

const HOME_FAQ_TRANSLATIONS = [
  {
    questionKey: 'web.home.faq.items.gettingStarted.question',
    answerKey: 'web.home.faq.items.gettingStarted.answer',
  },
  {
    questionKey: 'web.home.faq.items.businessSupport.question',
    answerKey: 'web.home.faq.items.businessSupport.answer',
  },
  {
    questionKey: 'web.home.faq.items.consultationFormat.question',
    answerKey: 'web.home.faq.items.consultationFormat.answer',
  },
] as const;

@Component({
  selector: 'kraak-home-page',
  standalone: true,
  imports: [
    NgStyle,
    RouterLink,
    ButtonDirective,
    FaqAccordion,
    PublicConversionTrackingDirective,
    RevealOnScrollDirective,
    LocalizedPublicPathPipe,
    KraakTranslatePipe,
  ],
  templateUrl: './home.page.html',
  styles: [
    `
      .kr-perf-section {
        content-visibility: auto;
        contain-intrinsic-size: 1px 900px;
      }

      .hero-copy {
        animation: hero-fade-up 720ms ease-out both;
      }

      .hero-media {
        animation: hero-fade-left 820ms ease-out both;
        animation-delay: 120ms;
      }

      @keyframes hero-fade-up {
        from {
          opacity: 0;
          transform: translate3d(0, 24px, 0);
        }

        to {
          opacity: 1;
          transform: translate3d(0, 0, 0);
        }
      }

      @keyframes hero-fade-left {
        from {
          opacity: 0;
          transform: translate3d(24px, 0, 0);
        }

        to {
          opacity: 1;
          transform: translate3d(0, 0, 0);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .hero-copy,
        .hero-media {
          animation: none;
        }
      }
    `,
  ],
})
export default class HomePage implements OnInit, OnDestroy {
  readonly heroBackgroundStyle = HOME_HERO_BACKGROUND_STYLE;

  protected readonly keySolutions = HOME_SOLUTION_TRANSLATIONS;
  protected readonly proofItems = HOME_PROOF_TRANSLATIONS;
  protected readonly whyChooseItems = HOME_WHY_CHOOSE_TRANSLATIONS;

  private readonly i18n = inject(KraakI18nService);
  private readonly injector = inject(Injector);
  private gsapService: GsapAnimationsService | null = null;
  private isDestroyed = false;

  protected readonly faqItems = computed<readonly FaqItem[]>(() => {
    this.i18n.locale();

    return HOME_FAQ_TRANSLATIONS.map(({ questionKey, answerKey }) => ({
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
