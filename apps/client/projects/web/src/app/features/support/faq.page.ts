import { Component } from '@angular/core';
import { NgStyle } from '@angular/common';
import { RouterLink } from '@angular/router';

import { HERO_BACKGROUND_STYLE } from '../../shared/brand/brand-constants';
import {
  FaqAccordion,
  type FaqItem,
} from '../../shared/faq-accordion/faq-accordion.component';

@Component({
  selector: 'kraak-faq-page',
  standalone: true,
  imports: [NgStyle, RouterLink, FaqAccordion],
  templateUrl: './faq.page.html',
})
export default class FaqPage {
  protected readonly heroBackgroundStyle = HERO_BACKGROUND_STYLE;

  protected readonly faqItems: FaqItem[] = [
    {
      question: 'Comment choisir le bon accompagnement chez KRAAK ?',
      answer:
        'Nous partons de votre objectif, de votre niveau de maturit� et de vos contraintes. Ensuite, nous vous orientons vers le service, le programme ou le format le plus pertinent.',
    },
    {
      question: 'Les accompagnements KRAAK sont-ils disponibles � distance ?',
      answer:
        'Oui. Une grande partie de nos parcours peut �tre suivie � distance, avec un cadrage clair, des sessions planifi�es et un suivi adapt� � votre rythme.',
    },
    {
      question: 'Intervenez-vous uniquement pour les particuliers ?',
      answer:
        'Non. Nous accompagnons aussi les �quipes, organisations, associations et entreprises sur des besoins de formation, structuration et mise en oeuvre de projets.',
    },
    {
      question: 'Sous quel d�lai recevez-vous une r�ponse apr�s contact ?',
      answer:
        'Nous revenons en g�n�ral sous 48h ouvr�es avec une premi�re orientation et, si n�cessaire, une proposition de rendez-vous.',
    },
    {
      question:
        "Pouvez-vous aider sur un projet d'immigration ou de mobilit� internationale ?",
      answer:
        "Oui. Nous apportons un accompagnement de clarification, de pr�paration et d'orientation sur les �tapes cl�s selon votre profil et votre destination cible.",
    },
    {
      question: 'Faut-il d�j� avoir un projet finalis� pour vous contacter ?',
      answer:
        "Non. Vous pouvez nous contacter d�s la phase d'id�e. Notre r�le est aussi de vous aider � structurer la prochaine �tape utile.",
    },
  ];
}
