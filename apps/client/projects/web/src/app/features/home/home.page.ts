import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { NgStyle } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';

import { HERO_BACKGROUND_STYLE } from '../../shared/brand/brand-constants';
import { CtaBanner } from '../../shared/cta-banner/cta-banner.component';
import {
  FaqAccordion,
  type FaqItem,
} from '../../shared/faq-accordion/faq-accordion.component';
import { GsapAnimationsService } from '../../core/animations/gsap-animations.service';
import { Testimonials } from '../../shared/testimonials/testimonials.component';
import { FadingPartners } from '../../shared/fading-partners/fading-partners.component';
import { ImpactStats } from '../../shared/impact-stats/impact-stats.component';
import { canShowPreviewContent } from '../../core/runtime/runtime-config';

@Component({
  selector: 'kraak-home-page',
  standalone: true,
  imports: [
    NgStyle,
    RouterLink,
    ButtonDirective,
    FaqAccordion,
    CtaBanner,
    Testimonials,
    FadingPartners,
    ImpactStats,
  ],
  templateUrl: './home.page.html',
  styles: [
    `
      .kr-perf-section {
        content-visibility: auto;
        contain-intrinsic-size: 1px 900px;
      }
    `,
  ],
})
export default class HomePage implements OnInit, OnDestroy {
  readonly heroBackgroundStyle = HERO_BACKGROUND_STYLE;
  protected readonly canShowPreviewContent = canShowPreviewContent;
  protected readonly keySolutions: readonly string[] = [
    'D&eacute;veloppement personnel et professionnel',
    'Anglais et fran&ccedil;ais professionnel',
    'Leadership et prise de parole',
    'Pr&eacute;paration aux entretiens',
    'Structuration de projets',
    "Accompagnement d'entreprises et startups",
    'Conseils en mobilit&eacute; internationale',
    'Recrutement et placement en emploi',
  ];

  protected readonly faqItems: FaqItem[] = [
    {
      question:
        'Je ne sais pas par où commencer, quelle est la première étape ?',
      answer:
        "Commencez par une consultation d'orientation. Nous clarifions votre objectif, vos contraintes et les options réalistes pour définir un point de départ concret.",
    },
    {
      question: 'Quels services KRAAK peuvent répondre à mon objectif ?',
      answer:
        'Nous partons de votre priorité du moment pour vous orienter vers le bon point d’entrée entre formation, recherche et gestion de projets, études et immigration, programmes KRAAK ou besoin entreprise.',
    },
    {
      question:
        'Proposez-vous des programmes pour les jeunes, les étudiants et les organisations ?',
      answer:
        'Oui. Nos programmes et accompagnements s’adressent aux étudiants, jeunes professionnels, entreprises, diaspora et organisations avec des formats courts, structurés et orientés résultats.',
    },
    {
      question:
        'En combien de temps puis-je recevoir une réponse après contact ?',
      answer:
        'Après votre message, nous revenons généralement vers vous sous 48h ouvrées avec une première orientation et les prochaines étapes recommandées.',
    },
  ];

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
