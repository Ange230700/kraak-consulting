import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { NgStyle } from '@angular/common';
import { RouterLink } from '@angular/router';

import {
  initializeMarketingPageAnimations,
  teardownMarketingPageAnimations,
} from '../../core/animations/marketing-page-animations';
import { GsapAnimationsService } from '../../core/animations/gsap-animations.service';
import { buildHeroBackgroundStyle } from '../../shared/brand/brand-constants';
import { CtaBanner } from '../../shared/cta-banner/cta-banner.component';
import { RevealOnScrollDirective } from '../../shared/motion/reveal-on-scroll.directive';
import {
  FaqAccordion,
  type FaqItem,
} from '../../shared/faq-accordion/faq-accordion.component';

const SERVICES_HERO_BACKGROUND_STYLE = buildHeroBackgroundStyle(
  '/assets/site-visuals/photos/services-hero-project-planning.avif',
);

@Component({
  selector: 'kraak-services-page',
  standalone: true,
  imports: [
    NgStyle,
    RouterLink,
    FaqAccordion,
    CtaBanner,
    RevealOnScrollDirective,
  ],
  templateUrl: './services.page.html',
})
export default class ServicesPage implements OnInit, OnDestroy {
  protected readonly heroBackgroundStyle = SERVICES_HERO_BACKGROUND_STYLE;
  protected readonly faqItems: FaqItem[] = [
    {
      question: 'Comment choisir le service le plus adapté à mon objectif ?',
      answer:
        'Nous commençons par votre objectif principal, votre contexte et votre contrainte prioritaire. Si besoin, nous vous orientons vers la bonne combinaison entre formation, projet, immigration ou offre entreprise.',
    },
    {
      question: 'Proposez-vous une première orientation avant de démarrer ?',
      answer:
        "Oui. Une première consultation permet de clarifier le besoin, d'identifier le bon format et de définir la prochaine étape utile.",
    },
    {
      question: 'Les accompagnements sont-ils réservés aux particuliers ?',
      answer:
        'Non. KRAAK accompagne aussi les entreprises, startups, organisations et fonctions RH selon le type de besoin et le niveau de structuration attendu.',
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
