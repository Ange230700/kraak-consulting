import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { NgStyle } from '@angular/common';
import { RouterLink } from '@angular/router';

import { HERO_BACKGROUND_STYLE } from '../../shared/brand/brand-constants';
import { CtaBanner } from '../../shared/cta-banner/cta-banner';
import {
  FaqAccordion,
  type FaqItem,
} from '../../shared/faq-accordion/faq-accordion';
import { GsapAnimationsService } from '../../core/animations/gsap-animations.service';

@Component({
  selector: 'kraak-services-page',
  standalone: true,
  imports: [NgStyle, RouterLink, FaqAccordion, CtaBanner],
  templateUrl: './services.page.html',
})
export default class ServicesPage implements OnInit, OnDestroy {
  protected readonly heroBackgroundStyle = HERO_BACKGROUND_STYLE;

  protected readonly faqItems: FaqItem[] = [
    {
      question: 'Comment choisir le service le plus adapté à mon objectif ?',
      answer:
        'Nous commençons par clarifier votre besoin, votre contexte et vos priorités. Ensuite, nous vous orientons vers la combinaison de services la plus utile pour avancer rapidement.',
    },
    {
      question:
        'Proposez-vous un accompagnement pour les particuliers et les entreprises ?',
      answer:
        'Oui. Nous accompagnons les étudiants, professionnels, entrepreneurs et organisations avec des formats dédiés : individuel, équipe ou programme sur mesure.',
    },
    {
      question: 'Vos services sont-ils disponibles à distance ?',
      answer:
        'Oui. Une grande partie de nos accompagnements est disponible à distance, avec des sessions planifiées et un suivi structuré selon vos contraintes.',
    },
    {
      question: 'Quel est le délai pour démarrer après une prise de contact ?',
      answer:
        'Après votre demande, nous revenons vers vous sous 48h ouvrées avec une première orientation et une proposition de prochaine étape.',
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
