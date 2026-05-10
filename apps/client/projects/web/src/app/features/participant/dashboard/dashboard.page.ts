import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { createApiClient, type ApiClient } from '@kraak/api-client';
import type { DashboardAggregateDto } from '@kraak/contracts';
import { loadDashboardAggregate } from '@kraak/domain';
import { MessageService } from 'primeng/api';
import { Message } from 'primeng/message';

import { environment } from '../../../../environments/environment';
import { resolveApiBaseUrl } from '../../../core/runtime/runtime-config';
import { WebAuthService } from '../../../core/auth/web-auth.service';

interface DashboardQuickLink {
  readonly label: string;
  readonly detail: string;
  readonly href: string;
}

interface DashboardSummaryIndicator {
  readonly id: 'programs' | 'sessions' | 'announcements';
  readonly label: string;
  readonly value: string;
  readonly detail: string;
}

const QUICK_LINKS: readonly DashboardQuickLink[] = [
  {
    label: 'Voir les programmes',
    detail:
      "Retrouver l'offre, les parcours et les informations publiques utiles.",
    href: '/programmes',
  },
  {
    label: "Contacter l'\u00E9quipe",
    detail: 'Poser une question ou signaler un besoin de suivi.',
    href: '/contact',
  },
];

@Component({
  selector: 'kraak-web-participant-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, Message],
  templateUrl: './dashboard.page.html',
})
export default class DashboardPage implements OnInit {
  private readonly authService = inject(WebAuthService);
  private readonly messageService = inject(MessageService);
  protected dashboardClient: Pick<ApiClient['dashboard'], 'getAggregate'> =
    createApiClient({
      baseUrl: resolveApiBaseUrl(environment.apiBaseUrl),
      getAuthToken: () =>
        this.authService.currentSession()?.accessToken ?? null,
    }).dashboard;

  readonly currentProfile = this.authService.currentProfile;
  readonly quickLinks = QUICK_LINKS;

  protected readonly dashboardState = signal<DashboardAggregateDto | null>(
    null,
  );
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  private readonly hasRecoveredFromError = signal(false);

  private selectFromAggregate<K extends keyof DashboardAggregateDto>(key: K) {
    return computed(
      () => (this.dashboardState()?.[key] ?? []) as DashboardAggregateDto[K],
    );
  }

  readonly programs = this.selectFromAggregate('programs');
  readonly upcomingSessions = this.selectFromAggregate('upcomingSessions');
  readonly recentAnnouncements = this.selectFromAggregate(
    'recentAnnouncements',
  );
  readonly summaryIndicators = computed<readonly DashboardSummaryIndicator[]>(
    () => [
      {
        id: 'programs',
        label: 'Programmes actifs',
        value: `${this.programs().length}`,
        detail: 'Parcours en cours ou r\u00E9cemment activ\u00E9s',
      },
      {
        id: 'sessions',
        label: 'Sessions \u00E0 venir',
        value: `${this.upcomingSessions().length}`,
        detail: 'Rappels des prochains rendez-vous',
      },
      {
        id: 'announcements',
        label: 'Annonces r\u00E9centes',
        value: `${this.recentAnnouncements().length}`,
        detail: 'Informations r\u00E9centes publi\u00E9es par KRAAK',
      },
    ],
  );
  readonly totalSummaryItems = computed(
    () =>
      this.programs().length +
      this.upcomingSessions().length +
      this.recentAnnouncements().length,
  );
  readonly totalSummaryLabel = computed(() => {
    const itemCount = this.totalSummaryItems();

    return itemCount === 1
      ? '1 \u00E9l\u00E9ment cl\u00E9 disponible aujourd\u2019hui.'
      : `${itemCount} \u00E9l\u00E9ments cl\u00E9s disponibles aujourd\u2019hui.`;
  });
  readonly nextSessionSummary = computed(() => {
    const nextSession = this.upcomingSessions()[0];
    if (!nextSession) {
      return 'Aucune session planifi\u00E9e pour le moment.';
    }

    return `${nextSession.title} - ${this.formatDate(nextSession.startsAt)}`;
  });
  readonly hasDashboardContent = computed(
    () =>
      this.programs().length > 0 ||
      this.upcomingSessions().length > 0 ||
      this.recentAnnouncements().length > 0,
  );

  ngOnInit(): void {
    void this.loadDashboard();
  }

  protected async reloadDashboard(): Promise<void> {
    await this.loadDashboard();
  }

  private async loadDashboard(): Promise<void> {
    await loadDashboardAggregate({
      getAggregate: () => this.dashboardClient.getAggregate(),
      setLoading: (value) => this.loading.set(value),
      setData: (value) => this.dashboardState.set(value),
      setError: (value) => this.errorMessage.set(value),
    });

    const currentError = this.errorMessage();
    if (currentError) {
      this.messageService.add({
        key: 'app-feedback',
        severity: 'error',
        summary: 'Dashboard',
        detail: currentError,
        life: 7000,
      });
      this.hasRecoveredFromError.set(true);
      return;
    }

    if (this.hasRecoveredFromError()) {
      this.messageService.add({
        key: 'app-feedback',
        severity: 'success',
        summary: 'Dashboard',
        detail: 'Les données ont été rechargées avec succès.',
        life: 4500,
      });
      this.hasRecoveredFromError.set(false);
    }
  }

  private formatDate(rawDate: string): string {
    const parsedDate = new Date(rawDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return rawDate;
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(parsedDate);
  }
}
