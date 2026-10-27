import { NgStyle } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';

import { GsapAnimationsService } from '../../../core/animations/gsap-animations.service';
import { findLocalizedPublicRouteEntryByLegacyPath } from '../../../routing/localized-public-routes';
import { buildHeroBackgroundStyle } from '../../../shared/brand/brand-constants';
import {
  KraakI18nService,
  KraakTranslatePipe,
} from '../../../../../../shared/i18n';
import {
  getFallbackBlogArticles,
  type BlogArticle,
} from '../../blog/blog.data';

interface ProgramSnapshot {
  readonly labelKey: string;
  readonly statusKey: string;
  readonly descriptionKey: string;
  readonly primaryMetricKey: string;
}

interface ContentSnapshot {
  readonly labelKey: string;
  readonly value: string;
  readonly descriptionKey: string;
}

interface ContentAction {
  readonly labelKey: string;
  readonly path: string;
  readonly descriptionKey: string;
}

const adminHeroStyle = buildHeroBackgroundStyle(
  '/assets/site-visuals/photos/home-hero-workshop.avif',
);

const programSnapshots: readonly ProgramSnapshot[] = [
  {
    labelKey: 'web.admin.dashboard.programs.training.label',
    statusKey: 'web.admin.dashboard.programs.training.status',
    descriptionKey: 'web.admin.dashboard.programs.training.description',
    primaryMetricKey: 'web.admin.dashboard.programs.training.metric',
  },
  {
    labelKey: 'web.admin.dashboard.programs.projectManagement.label',
    statusKey: 'web.admin.dashboard.programs.projectManagement.status',
    descriptionKey:
      'web.admin.dashboard.programs.projectManagement.description',
    primaryMetricKey: 'web.admin.dashboard.programs.projectManagement.metric',
  },
  {
    labelKey: 'web.admin.dashboard.programs.immigration.label',
    statusKey: 'web.admin.dashboard.programs.immigration.status',
    descriptionKey: 'web.admin.dashboard.programs.immigration.description',
    primaryMetricKey: 'web.admin.dashboard.programs.immigration.metric',
  },
] as const;

const contentActions: readonly ContentAction[] = [
  {
    labelKey: 'web.admin.dashboard.actions.curriculum.label',
    path: '/admin/curriculum',
    descriptionKey: 'web.admin.dashboard.actions.curriculum.description',
  },
  {
    labelKey: 'web.admin.dashboard.actions.blog.label',
    path: '/blog',
    descriptionKey: 'web.admin.dashboard.actions.blog.description',
  },
  {
    labelKey: 'web.admin.dashboard.actions.programs.label',
    path: '/programmes',
    descriptionKey: 'web.admin.dashboard.actions.programs.description',
  },
  {
    labelKey: 'web.admin.dashboard.actions.contact.label',
    path: '/contact',
    descriptionKey: 'web.admin.dashboard.actions.contact.description',
  },
] as const;

export function buildContentSnapshots(
  articles: readonly BlogArticle[],
): readonly ContentSnapshot[] {
  return [
    {
      labelKey: 'web.admin.dashboard.snapshots.published.label',
      value: `${articles.length}`,
      descriptionKey: 'web.admin.dashboard.snapshots.published.description',
    },
    {
      labelKey: 'web.admin.dashboard.snapshots.featured.label',
      value: `${articles.filter((article) => article.featured).length}`,
      descriptionKey: 'web.admin.dashboard.snapshots.featured.description',
    },
    {
      labelKey: 'web.admin.dashboard.snapshots.lastUpdated.label',
      value: articles[0]?.publishedLabel ?? 'N/A',
      descriptionKey: 'web.admin.dashboard.snapshots.lastUpdated.description',
    },
  ];
}

@Component({
  selector: 'kraak-admin-dashboard-page',
  standalone: true,
  imports: [NgStyle, RouterLink, ButtonDirective, KraakTranslatePipe],
  templateUrl: './dashboard.page.html',
})
export default class DashboardPage implements OnInit, OnDestroy {
  private readonly i18n = inject(KraakI18nService);

  protected readonly heroBackgroundStyle = adminHeroStyle;
  protected readonly programSnapshots = programSnapshots;
  protected readonly contentSnapshots = computed<readonly ContentSnapshot[]>(
    () => buildContentSnapshots(getFallbackBlogArticles(this.i18n.locale())),
  );
  protected readonly contentActions = contentActions;
  protected readonly recentArticles = computed(() =>
    getFallbackBlogArticles(this.i18n.locale()),
  );

  private readonly gsapService = inject(GsapAnimationsService);

  protected resolvePublicPath(path: string): string {
    return (
      findLocalizedPublicRouteEntryByLegacyPath(path, this.i18n.locale())
        ?.path ?? path
    );
  }

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
