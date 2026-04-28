import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WebAuthService } from '../../../core/auth/web-auth.service';

interface DashboardSummaryCard {
  readonly label: string;
  readonly value: string;
  readonly detail: string;
  readonly highlight: string;
}

interface DashboardReminder {
  readonly title: string;
  readonly detail: string;
  readonly tone: 'action' | 'info';
}

interface DashboardNewsItem {
  readonly category: string;
  readonly title: string;
  readonly summary: string;
  readonly publishedAt: string;
}

interface DashboardQuickLink {
  readonly label: string;
  readonly detail: string;
  readonly href: string;
}

const DASHBOARD_CONTENT = {
  summaryCards: [
    {
      label: 'Programmes suivis',
      value: '2 parcours',
      detail: 'Vos inscriptions actives restent visibles depuis cet accueil.',
      highlight: 'Formation et accompagnement en cours',
    },
    {
      label: 'Prochaine session',
      value: 'Jeu. 30 avril',
      detail:
        'Atelier de preparation au parcours avec rappel du lieu et des horaires.',
      highlight: '18h00 - Montreal ou visio selon votre cohorte',
    },
    {
      label: 'Ressources a ouvrir',
      value: '3 elements',
      detail:
        'Guides, checklist et support de session publies pour la semaine.',
      highlight: 'Priorite au kit de bienvenue et aux consignes d entree',
    },
  ] as const satisfies readonly DashboardSummaryCard[],
  reminders: [
    {
      title: 'Finaliser votre dossier participant',
      detail:
        'Verifier vos pieces et votre contact principal avant la prochaine session.',
      tone: 'action',
    },
    {
      title: 'Confirmer votre disponibilite',
      detail:
        'Indiquez au plus vite si vous serez present pour que l equipe ajuste la cohorte.',
      tone: 'action',
    },
    {
      title: 'Consulter vos consignes de session',
      detail:
        'Le rappel du format, des horaires et du materiel attendu sera centralise ici.',
      tone: 'info',
    },
  ] as const satisfies readonly DashboardReminder[],
  latestNews: [
    {
      category: 'Nouvelle annonce',
      title: 'Le calendrier des ateliers de mai est en preparation',
      summary:
        'L equipe consolide les prochains rendez-vous pour les cohortes actives.',
      publishedAt: 'Aujourd hui',
    },
    {
      category: 'Programme',
      title: 'Un rappel sera envoye avant chaque session importante',
      summary:
        'Le dashboard sert de point d entree pour retrouver horaires, consignes et suites a donner.',
      publishedAt: 'Cette semaine',
    },
    {
      category: 'Support',
      title: 'Le canal de contact prioritaire reste disponible',
      summary:
        'En cas de blocage administratif ou pedagogique, l equipe peut etre jointe rapidement.',
      publishedAt: 'Mise a jour continue',
    },
  ] as const satisfies readonly DashboardNewsItem[],
  quickLinks: [
    {
      label: 'Voir les programmes',
      detail:
        'Retrouver l offre, les parcours et les informations publiques utiles.',
      href: '/programmes',
    },
    {
      label: 'Contacter l equipe',
      detail: 'Poser une question ou signaler un besoin de suivi.',
      href: '/contact',
    },
  ] as const satisfies readonly DashboardQuickLink[],
};

@Component({
  selector: 'kraak-web-participant-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.page.html',
})
export default class DashboardPage {
  private readonly authService = inject(WebAuthService);

  readonly currentProfile = this.authService.currentProfile;
  readonly summaryCards = DASHBOARD_CONTENT.summaryCards;
  readonly reminders = DASHBOARD_CONTENT.reminders;
  readonly latestNews = DASHBOARD_CONTENT.latestNews;
  readonly quickLinks = DASHBOARD_CONTENT.quickLinks;
}
