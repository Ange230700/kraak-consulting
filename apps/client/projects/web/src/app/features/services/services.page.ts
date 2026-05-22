import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { NgStyle } from '@angular/common';
import { RouterLink } from '@angular/router';

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

  protected readonly faqItems: FaqItem[] = [
    {
      question: "Comment choisir l'offre KRAAK la plus pertinente ?",
      answer:
        'Nous démarrons par votre objectif prioritaire, votre calendrier et vos contraintes. Cette lecture nous permet de vous orienter vers le bon format: formation, appui projet, conseil mobilité ou accompagnement entreprise.',
    },
    {
      question: 'Une consultation suffit-elle pour démarrer ?',
      answer:
        "Dans la majorité des cas, oui. Une première consultation permet de clarifier votre besoin, de cadrer la prochaine étape et de proposer un plan d'action concret.",
    },
    {
      question: 'Intervenez-vous à distance ou uniquement en présentiel ?',
      answer:
        'Nos accompagnements peuvent être organisés à distance, en hybride ou en présentiel selon le type de service, le public concerné et le contexte du projet.',
    },
    {
      question: 'Sous quel délai obtenons-nous un premier retour ?',
      answer:
        "Chaque demande reçoit une réponse de premier niveau sous 48h ouvrées pour confirmer l'orientation et proposer la suite adaptée.",
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
