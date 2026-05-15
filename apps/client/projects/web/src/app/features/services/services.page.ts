import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { NgStyle } from '@angular/common';
import { RouterLink } from '@angular/router';

import { HERO_BACKGROUND_STYLE } from '../../shared/brand/brand-constants';
import { CtaBanner } from '../../shared/cta-banner/cta-banner.component';
import {
  FaqAccordion,
  type FaqItem,
} from '../../shared/faq-accordion/faq-accordion.component';
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
        'Nous clarifions d’abord votre besoin, votre contexte et la prochaine décision à prendre. Ensuite, nous vous orientons vers le bon point d’entrée entre formation, projet, études et immigration, programmes ou solutions entreprises.',
    },
    {
      question:
        'Intervenez-vous pour les particuliers, les entreprises et la diaspora ?',
      answer:
        'Oui. KRAAK accompagne étudiants, professionnels, entrepreneurs, entreprises, diaspora et organisations avec des formats individuels, équipe ou sur mesure.',
    },
    {
      question: 'Puis-je combiner plusieurs services dans un même parcours ?',
      answer:
        'Oui. Un parcours peut articuler formation, structuration de projet, orientation internationale et accompagnement entreprise si cela sert mieux votre objectif.',
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
