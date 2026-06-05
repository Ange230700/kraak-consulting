import { Component, Injector, OnDestroy, OnInit, inject } from '@angular/core';
import { NgStyle } from '@angular/common';
import { RouterLink } from '@angular/router';

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

  private readonly injector = inject(Injector);
  private gsapService: GsapAnimationsService | null = null;
  private isDestroyed = false;

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
