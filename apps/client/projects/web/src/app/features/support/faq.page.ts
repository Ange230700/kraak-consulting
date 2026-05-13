import { Component } from '@angular/core';
import { NgStyle } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';

import { HERO_BACKGROUND_STYLE } from '../../shared/brand/brand-constants';
import {
  FaqAccordion,
  type FaqItem,
} from '../../shared/faq-accordion/faq-accordion.component';

@Component({
  selector: 'kraak-faq-page',
  standalone: true,
  imports: [NgStyle, RouterLink, ButtonDirective, FaqAccordion],
  templateUrl: './faq.page.html',
})
export default class FaqPage {
  protected readonly heroBackgroundStyle = HERO_BACKGROUND_STYLE;

  protected readonly faqItems: FaqItem[] = [
    {
      question: 'Comment choisir le bon accompagnement chez KRAAK ?',
      answer:
        'Nous partons de votre objectif, de votre niveau de maturité et de vos contraintes. Ensuite, nous vous orientons vers le service, le programme ou le format le plus pertinent.',
    },
    {
      question: 'Les accompagnements KRAAK sont-ils disponibles à distance ?',
      answer:
        'Oui. Une grande partie de nos parcours peut être suivie à distance, avec un cadrage clair, des sessions planifiées et un suivi adapté à votre rythme.',
    },
    {
      question: 'Intervenez-vous uniquement pour les particuliers ?',
      answer:
        'Non. Nous accompagnons aussi les équipes, organisations, associations et entreprises sur des besoins de formation, structuration et mise en oeuvre de projets.',
    },
    {
      question: 'Sous quel délai recevez-vous une réponse après contact ?',
      answer:
        'Nous revenons en général sous 48h ouvrées avec une première orientation et, si nécessaire, une proposition de rendez-vous.',
    },
    {
      question:
        "Pouvez-vous aider sur un projet d'immigration ou de mobilité internationale ?",
      answer:
        "Oui. Nous apportons un accompagnement de clarification, de préparation et d'orientation sur les étapes clés selon votre profil et votre destination cible.",
    },
    {
      question: 'Faut-il déjà avoir un projet finalisé pour vous contacter ?',
      answer:
        "Non. Vous pouvez nous contacter dès la phase d'idée. Notre rôle est aussi de vous aider à structurer la prochaine étape utile.",
    },
  ];
}
