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
        "Nous partons de votre objectif, de votre niveau de maturite et de votre contrainte principale. A partir de ces repères, nous vous orientons vers le bon point d'entree : service, programme, consultation ou accompagnement sur mesure.",
    },
    {
      question: 'Comment demarrer avec KRAAK ?',
      answer:
        "Vous pouvez envoyer une demande via le formulaire de contact, ecrire a kraakconsulting@gmail.com ou ouvrir un premier echange sur WhatsApp. Pour accelerer l'orientation, indiquez votre objectif, votre pays, votre calendrier et le type d'appui recherche.",
    },
    {
      question: 'Les accompagnements KRAAK sont-ils disponibles a distance ?',
      answer:
        "Oui. Les echanges d'orientation et une partie des accompagnements peuvent etre organises a distance. Le format exact - a distance, hybride ou presentiel - est confirme avant le demarrage selon le service, le public et les contraintes du projet.",
    },
    {
      question: 'Intervenez-vous uniquement pour les particuliers ?',
      answer:
        "Non. KRAAK accompagne aussi les equipes, organisations, associations, etablissements et entreprises sur des besoins de formation, d'orientation, de structuration de projets, de recrutement ou de cohesion d'equipe.",
    },
    {
      question: 'Sous quel delai recevez-vous une reponse apres contact ?',
      answer:
        'Toute demande envoyee via le formulaire ou par email recoit un premier retour sous 48h ouvrees. Ce premier retour sert a confirmer la bonne orientation, demander un complement utile si besoin ou proposer un rendez-vous.',
    },
    {
      question:
        "Pouvez-vous aider sur un projet d'immigration ou de mobilite internationale ?",
      answer:
        "Oui. KRAAK accompagne la clarification, la preparation et l'orientation des projets d'etudes, de travail, de voyage ou d'opportunites d'affaires a l'international selon le profil et la destination visee.",
    },
    {
      question:
        "Est-ce que KRAAK garantit l'obtention d'un visa, d'un emploi ou d'une admission ?",
      answer:
        "Non. KRAAK accompagne la preparation, la structuration et l'orientation des demarches, mais les decisions finales relevent des institutions, employeurs, ecoles, autorites ou organismes competents.",
    },
    {
      question: 'Faut-il deja avoir un projet finalise pour vous contacter ?',
      answer:
        "Non. Vous pouvez nous contacter des la phase d'idee. Notre role consiste aussi a vous aider a clarifier la prochaine etape utile avant qu'un projet soit entierement formalise.",
    },
    {
      question: 'Comment mes donnees de contact sont-elles utilisees ?',
      answer:
        "Les donnees transmises via le formulaire servent uniquement a traiter votre demande de contact et d'information. Elles ne sont ni revendues ni transmises a des tiers a des fins commerciales et sont conservees pendant 3 ans a compter de la derniere interaction, puis supprimees.",
    },
  ];
}
