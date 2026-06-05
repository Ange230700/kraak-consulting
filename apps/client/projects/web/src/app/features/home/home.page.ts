import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { NgStyle } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';

import {
  initializeMarketingPageAnimations,
  teardownMarketingPageAnimations,
} from '../../core/animations/marketing-page-animations';
import { GsapAnimationsService } from '../../core/animations/gsap-animations.service';
import { buildHeroBackgroundStyle } from '../../shared/brand/brand-constants';
import { PublicConversionTrackingDirective } from '../../shared/analytics/public-conversion-tracking.directive';
import {
  FaqAccordion,
  type FaqItem,
} from '../../shared/faq-accordion/faq-accordion.component';

const HOME_HERO_BACKGROUND_STYLE = buildHeroBackgroundStyle(
  '/assets/site-visuals/photos/programs-workshop.avif',
);

@Component({
  selector: 'kraak-home-page',
  standalone: true,
  imports: [
    NgStyle,
    RouterLink,
    ButtonDirective,
    FaqAccordion,
    PublicConversionTrackingDirective,
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

  protected readonly whyChooseItems: readonly {
    readonly title: string;
    readonly description: string;
  }[] = [
    {
      title: "Expertise reconnue à l'international",
      description:
        'Un savoir-faire activé sur plusieurs terrains pour des besoins locaux et internationaux.',
    },
    {
      title: 'Accompagnement personnalisé',
      description:
        'Chaque profil est unique : nous ajustons le cadre, le rythme et les livrables au contexte réel.',
    },
    {
      title: 'Résultats concrets et mesurables',
      description:
        'Notre approche relie chaque action à une prochaine étape observable et utile.',
    },
  ];

  protected readonly keySolutions: readonly string[] = [
    'Développement personnel et professionnel',
    'Anglais et français professionnel',
    'Leadership et prise de parole',
    'Préparation aux entretiens',
    'Structuration de projets',
    "Accompagnement d'entreprises et startups",
    'Conseils en mobilité internationale',
    'Recrutement et placement en emploi',
  ];

  protected readonly faqItems: FaqItem[] = [
    {
      question:
        'Je ne sais pas par où commencer, quelle est la première étape ?',
      answer:
        "Commencez par partager votre objectif, votre contexte et votre délai via le formulaire de contact. Nous vous orientons ensuite vers le bon point d'entrée.",
    },
    {
      question: 'Proposez-vous un accompagnement pour les entreprises ?',
      answer:
        "Oui. KRAAK accompagne aussi les organisations sur la gestion de projets, la formation du personnel, le recrutement et la performance d'équipe.",
    },
    {
      question: 'Les consultations sont-elles présentiel ou à distance ?',
      answer:
        'Les échanges peuvent se faire à distance ou en présentiel selon le besoin, le service et les contraintes du projet.',
    },
  ];

  private readonly gsapService = inject(GsapAnimationsService);

  ngOnInit(): void {
    initializeMarketingPageAnimations(this.gsapService);
  }

  ngOnDestroy(): void {
    teardownMarketingPageAnimations(this.gsapService);
  }
}
