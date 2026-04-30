import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { createApiClient, type ApiClient } from '@kraak/api-client';
import type { DashboardAggregateDto } from '@kraak/contracts';
import { loadDashboardAggregate } from '@kraak/domain';

import { environment } from '../../../../environments/environment';
import { WebAuthService } from '../../../core/auth/web-auth.service';

interface DashboardQuickLink {
  readonly label: string;
  readonly detail: string;
  readonly href: string;
}

const QUICK_LINKS: readonly DashboardQuickLink[] = [
  {
    label: 'Voir les programmes',
    detail:
      "Retrouver l'offre, les parcours et les informations publiques utiles.",
    href: '/programmes',
  },
  {
    label: "Contacter l'équipe",
    detail: 'Poser une question ou signaler un besoin de suivi.',
    href: '/contact',
  },
];

@Component({
  selector: 'kraak-web-participant-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.page.html',
})
export default class DashboardPage implements OnInit {
  private readonly authService = inject(WebAuthService);
  protected dashboardClient: Pick<ApiClient['dashboard'], 'getAggregate'> =
    createApiClient({
      baseUrl: environment.apiBaseUrl,
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
  }
}
