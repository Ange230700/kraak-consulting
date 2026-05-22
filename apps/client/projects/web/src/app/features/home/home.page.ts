import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { NgStyle } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';

import { GsapAnimationsService } from '../../core/animations/gsap-animations.service';
import { buildHeroBackgroundStyle } from '../../shared/brand/brand-constants';
import { CtaBanner } from '../../shared/cta-banner/cta-banner.component';
import { HomePreviewSections } from '../../shared/home-preview-sections/home-preview-sections.component';
import {
  FaqAccordion,
  type FaqItem,
} from '../../shared/faq-accordion/faq-accordion.component';

const HOME_HERO_BACKGROUND_STYLE = buildHeroBackgroundStyle(
  '/assets/site-visuals/photos/home-hero-workshop.avif',
);

@Component({
  selector: 'kraak-home-page',
  standalone: true,
  imports: [
    NgStyle,
    RouterLink,
    ButtonDirective,
    FaqAccordion,
    CtaBanner,
    HomePreviewSections,
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
  readonly heroBackgroundStyle = HOME_HERO_BACKGROUND_STYLE;
  protected readonly keySolutions: readonly string[] = [
    'D\u00e9veloppement personnel et professionnel',
    'Anglais et fran\u00e7ais professionnel',
    'Leadership et prise de parole',
    'Pr\u00e9paration aux entretiens',
    'Structuration de projets',
    "Accompagnement d'entreprises et startups",
    'Conseils en mobilit\u00e9 internationale',
    'Recrutement et placement en emploi',
  ];

  protected readonly faqItems: FaqItem[] = [
    {
      question:
        'Je ne sais pas par o\u00f9 commencer, quelle est la premi\u00e8re \u00e9tape ?',
      answer:
        "Commencez par partager votre objectif, votre contexte et votre d\u00e9lai via le formulaire de contact. Nous vous orientons ensuite vers le bon point d'entree.",
    },
    {
      question: 'Proposez-vous un accompagnement pour les entreprises ?',
      answer:
        "Oui. KRAAK accompagne aussi les organisations sur la gestion de projets, la formation du personnel, le recrutement et la performance d'\u00e9quipe.",
    },
    {
      question:
        'Les consultations sont-elles pr\u00e9sentiel ou \u00e0 distance ?',
      answer:
        'Les \u00e9changes peuvent se faire \u00e0 distance ou en pr\u00e9sentiel selon le besoin, le service et les contraintes du projet.',
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
