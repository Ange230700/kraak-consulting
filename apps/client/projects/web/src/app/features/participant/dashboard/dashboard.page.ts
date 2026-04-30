import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiError, createApiClient, type ApiClient } from '@kraak/api-client';
import type {
  DashboardAggregateDto,
  DashboardAnnouncementSummaryDto,
  DashboardProgramSummaryDto,
  DashboardSessionReminderDto,
} from '@kraak/contracts';

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

  readonly programs = computed<readonly DashboardProgramSummaryDto[]>(
    () => this.dashboardState()?.programs ?? [],
  );
  readonly upcomingSessions = computed<readonly DashboardSessionReminderDto[]>(
    () => this.dashboardState()?.upcomingSessions ?? [],
  );
  readonly recentAnnouncements = computed<
    readonly DashboardAnnouncementSummaryDto[]
  >(() => this.dashboardState()?.recentAnnouncements ?? []);
  readonly hasDashboardContent = computed(
    () =>
      this.programs().length > 0 ||
      this.upcomingSessions().length > 0 ||
      this.recentAnnouncements().length > 0,
  );

  ngOnInit(): void {
    void this.loadDashboardAggregate();
  }

  protected async reloadDashboard(): Promise<void> {
    await this.loadDashboardAggregate();
  }

  private async loadDashboardAggregate(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const aggregate = await this.dashboardClient.getAggregate();
      this.dashboardState.set(aggregate);
    } catch (error) {
      this.dashboardState.set(null);
      this.errorMessage.set(this.resolveDashboardErrorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  private resolveDashboardErrorMessage(error: unknown): string {
    const fallback = 'Impossible de charger votre dashboard pour le moment.';

    if (error instanceof ApiError) {
      const body = error.body as { message?: unknown } | null | undefined;
      if (body && typeof body.message === 'string' && body.message.trim()) {
        return body.message;
      }
      return fallback;
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return fallback;
  }
}
