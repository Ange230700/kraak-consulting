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
  imports: [NgStyle, RouterLink, FaqAccordion, CtaBanner],
  templateUrl: './services.page.html',
})
export default class ServicesPage implements OnInit, OnDestroy {
  protected readonly heroBackgroundStyle = SERVICES_HERO_BACKGROUND_STYLE;
  protected readonly faqItems: FaqItem[] = [
    {
      question:
        'Comment choisir le service le plus adapt\u00e9 \u00e0 mon objectif ?',
      answer:
        'Nous commen\u00e7ons par votre objectif principal, votre contexte et votre contrainte prioritaire. Si besoin, nous vous orientons vers la bonne combinaison entre formation, projet, immigration ou offre entreprise.',
    },
    {
      question:
        'Proposez-vous une premi\u00e8re orientation avant de d\u00e9marrer ?',
      answer:
        "Oui. Une premi\u00e8re consultation permet de clarifier le besoin, d'identifier le bon format et de d\u00e9finir la prochaine \u00e9tape utile.",
    },
    {
      question:
        'Les accompagnements sont-ils r\u00e9serv\u00e9s aux particuliers ?',
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
