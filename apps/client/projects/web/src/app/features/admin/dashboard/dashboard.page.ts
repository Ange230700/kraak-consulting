import { NgStyle } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';

import { GsapAnimationsService } from '../../../core/animations/gsap-animations.service';
import { buildHeroBackgroundStyle } from '../../../shared/brand/brand-constants';
import { blogArticles } from '../../blog/blog.data';

interface ProgramSnapshot {
  readonly label: string;
  readonly status: string;
  readonly description: string;
  readonly primaryMetric: string;
}

interface ContentSnapshot {
  readonly label: string;
  readonly value: string;
  readonly description: string;
}

const adminHeroStyle = buildHeroBackgroundStyle(
  '/assets/site-visuals/photos/home-hero-workshop.avif',
);

const programSnapshots: readonly ProgramSnapshot[] = [
  {
    label: 'Formation',
    status: 'Priorité élevée',
    description:
      'Structurer les parcours utiles, garder des formats courts et suivre les prochaines cohortes.',
    primaryMetric: '3 formats actifs',
  },
  {
    label: 'Gestion de projet',
    status: 'À consolider',
    description:
      'Garder les livrables, les jalons et les besoins de cadrage visibles dans une seule vue.',
    primaryMetric: '2 programmes à suivre',
  },
  {
    label: 'Conseil en immigration',
    status: 'Pilotage stable',
    description:
      'Suivre les dossiers, les preuves et les étapes de relance sans perdre la cohérence du projet.',
    primaryMetric: '1 filière prioritaire',
  },
] as const;

const contentSnapshots: readonly ContentSnapshot[] = [
  {
    label: 'Articles publiés',
    value: `${blogArticles.length}`,
    description: 'Contenus éditoriaux prêts pour le blog public.',
  },
  {
    label: 'Articles vedettes',
    value: `${blogArticles.filter((article) => article.featured).length}`,
    description:
      'Contenus à mettre en avant dans les campagnes et la page blog.',
  },
  {
    label: 'Dernière mise à jour',
    value: blogArticles[0]?.publishedLabel ?? 'N/A',
    description: 'Dernier contenu éditorial disponible dans la bibliothèque.',
  },
] as const;

const contentActions = [
  {
    label: 'Voir le blog public',
    path: '/blog',
    description: 'Relire le rendu public des contenus éditoriaux.',
  },
  {
    label: 'Relire les programmes',
    path: '/programmes',
    description: 'Vérifier les textes d’orientation et les appels à l’action.',
  },
  {
    label: 'Reprendre le contact',
    path: '/contact',
    description: 'Suivre les demandes entrantes et les points de conversion.',
  },
] as const;

@Component({
  selector: 'kraak-admin-dashboard-page',
  standalone: true,
  imports: [NgStyle, RouterLink, ButtonDirective],
  templateUrl: './dashboard.page.html',
})
export default class DashboardPage implements OnInit, OnDestroy {
  protected readonly heroBackgroundStyle = adminHeroStyle;
  protected readonly programSnapshots = programSnapshots;
  protected readonly contentSnapshots = contentSnapshots;
  protected readonly contentActions = contentActions;
  protected readonly recentArticles = blogArticles;

  private readonly gsapService = inject(GsapAnimationsService);

  ngOnInit(): void {
    this.gsapService.animatePageIn();
    this.gsapService.initializeFigureAnimations('figure.reveal-on-scroll');
    this.gsapService.initializeInteractiveCardAnimations('article');
    this.gsapService.initializeButtonTransitions();
    this.gsapService.initializeSectionAnimations();
  }

  ngOnDestroy(): void {
    this.gsapService.killAllAnimations();
  }
}
