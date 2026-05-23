import { Component } from '@angular/core';
import { NgStyle } from '@angular/common';
import { RouterLink } from '@angular/router';

import { buildHeroBackgroundStyle } from '../../shared/brand/brand-constants';
import {
  FaqAccordion,
  type FaqItem,
} from '../../shared/faq-accordion/faq-accordion.component';

const FAQ_HERO_BACKGROUND_STYLE = buildHeroBackgroundStyle(
  '/assets/site-visuals/photos/home-hero-workshop.avif',
);

@Component({
  selector: 'kraak-faq-page',
  standalone: true,
  imports: [NgStyle, RouterLink, FaqAccordion],
  templateUrl: './faq.page.html',
})
export default class FaqPage {
  protected readonly heroBackgroundStyle = FAQ_HERO_BACKGROUND_STYLE;

  protected readonly faqItems: FaqItem[] = [
    {
      question: 'Comment choisir le bon accompagnement chez KRAAK ?',
      answer:
        "Nous partons de votre objectif, de votre niveau de maturité et de votre contrainte principale. A partir de ces repères, nous vous orientons vers le bon point d'entree : service, programme, consultation ou accompagnement sur mesure.",
    },
    {
      question: 'Comment démarrer avec KRAAK ?',
      answer:
        "Vous pouvez envoyer une demande via le formulaire de contact, écrire à kraakconsulting@gmail.com ou ouvrir un premier échange sur WhatsApp. Pour accélérer l'orientation, indiquez votre objectif, votre pays, votre calendrier et le type d'appui recherché.",
    },
    {
      question: 'Les accompagnements KRAAK sont-ils disponibles à distance ?',
      answer:
        "Oui. Les échanges d'orientation et une partie des accompagnements peuvent être organisés à distance. Le format exact - à distance, hybride ou présentiel - est confirmé avant le démarrage selon le service, le public et les contraintes du projet.",
    },
    {
      question: 'Intervenez-vous uniquement pour les particuliers ?',
      answer:
        "Non. KRAAK accompagne aussi les équipes, organisations, associations, établissements et entreprises sur des besoins de formation, d'orientation, de structuration de projets, de recrutement ou de cohésion d'équipe.",
    },
    {
      question: 'Sous quel délai recevez-vous une réponse après contact ?',
      answer:
        'Toute demande envoyée via le formulaire ou par email reçoit un premier retour sous 48h ouvrées. Ce premier retour sert à confirmer la bonne orientation, demander un complément utile si besoin ou proposer un rendez-vous.',
    },
    {
      question:
        "Pouvez-vous aider sur un projet d'immigration ou de mobilité internationale ?",
      answer:
        "Oui. KRAAK accompagne la clarification, la préparation et l'orientation des projets d'études, de travail, de voyage ou d'opportunités d'affaires à l'international selon le profil et la destination visée.",
    },
    {
      question:
        "Est-ce que KRAAK garantit l'obtention d'un visa, d'un emploi ou d'une admission ?",
      answer:
        "Non. KRAAK accompagne la préparation, la structuration et l'orientation des démarches, mais les décisions finales relèvent des institutions, employeurs, écoles, autorités ou organismes compétents.",
    },
    {
      question: 'Faut-il déjà avoir un projet finalisé pour vous contacter ?',
      answer:
        "Non. Vous pouvez nous contacter dès la phase d'idée. Notre rôle consiste aussi à vous aider à clarifier la prochaine étape utile avant qu'un projet soit entièrement formalisé.",
    },
    {
      question: 'Comment mes données de contact sont-elles utilisées ?',
      answer:
        "Les données transmises via le formulaire servent uniquement à traiter votre demande de contact et d'information. Elles ne sont ni revendues ni transmises à des tiers à des fins commerciales et sont conservées pendant 3 ans à compter de la dernière interaction, puis supprimées.",
    },
  ];
}
