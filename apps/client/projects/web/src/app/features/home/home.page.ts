import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { NgStyle } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';

import { HERO_BACKGROUND_STYLE } from '../../shared/brand/brand-constants';
import { CtaBanner } from '../../shared/cta-banner/cta-banner';
import {
  FaqAccordion,
  type FaqItem,
} from '../../shared/faq-accordion/faq-accordion';
import { GsapAnimationsService } from '../../core/animations/gsap-animations.service';

@Component({
  selector: 'kraak-home-page',
  standalone: true,
  imports: [NgStyle, RouterLink, ButtonDirective, FaqAccordion, CtaBanner],
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

  protected readonly faqItems: FaqItem[] = [
    {
      question:
        'Je ne sais pas par où commencer, quelle est la première étape ?',
      answer:
        "Commencez par une consultation d'orientation. Nous clarifions votre objectif, vos contraintes et les options réalistes pour définir un point de départ concret.",
    },
    {
      question: "Comment KRAAK m'aide-t-il à choisir la bonne orientation ?",
      answer:
        'Nous analysons votre profil, votre contexte et votre priorité du moment pour vous proposer un parcours cohérent entre formation, projet et mobilité internationale.',
    },
    {
      question: 'Comment savoir quel programme KRAAK correspond à mon besoin ?',
      answer:
        'Nos équipes comparent votre objectif aux programmes disponibles et vous orientent vers le format le plus pertinent selon votre niveau, votre calendrier et vos attentes.',
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
