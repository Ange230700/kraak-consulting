import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { createApiClient, logDebugError } from '@kraak/api-client';
import type {
  DashboardAggregateDto,
  DashboardAnnouncementSummaryDto,
  DashboardProgramSummaryDto,
  DashboardSessionReminderDto,
} from '@kraak/contracts';
import { loadDashboardAggregate } from '@kraak/domain';
import { environment } from '../../../environments/environment';
import {
  MobileAuthService,
  resolveAuthErrorMessage,
} from '../auth/mobile-auth.service';
import { FeatureCardComponent } from '../../shared/ui/feature-card/feature-card.component';

import {
  KraakI18nService,
  KraakTranslatePipe,
} from '../../../../../shared/i18n';
interface HomeHighlight {
  readonly tag: string;
  readonly title: string;
  readonly description: string;
  readonly tone: 'primary' | 'accent';
}

@Component({
  selector: 'kraak-home-page',
  standalone: true,
  imports: [
    IonButton,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSpinner,
    RouterLink,
    FeatureCardComponent,
    KraakTranslatePipe,
  ],
  templateUrl: './home.page.html',
})
export default class HomePage implements OnInit {
  private readonly authService = inject(MobileAuthService);
  private readonly i18n = inject(KraakI18nService);
  private readonly dashboardClient = createApiClient({
    getLocale: () => this.i18n.locale(),
    baseUrl: environment.apiBaseUrl,
    getAuthToken: () => this.authService.currentSession()?.accessToken ?? null,
  }).dashboard;

  protected readonly resourceLibraryHref = '/tabs/programmes/ressources';
  protected readonly dashboardState = signal<DashboardAggregateDto | null>(
    null,
  );
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly highlights: HomeHighlight[] = [
    {
      tag: 'mobile.dashboard.highlights.programs.tag',
      title: 'mobile.dashboard.highlights.programs.title',
      description: 'mobile.dashboard.highlights.programs.description',
      tone: 'primary',
    },
    {
      tag: 'mobile.dashboard.highlights.announcements.tag',
      title: 'mobile.dashboard.highlights.announcements.title',
      description: 'mobile.dashboard.highlights.announcements.description',
      tone: 'accent',
    },
    {
      tag: 'mobile.dashboard.highlights.support.tag',
      title: 'mobile.dashboard.highlights.support.title',
      description: 'mobile.dashboard.highlights.support.description',
      tone: 'primary',
    },
  ];

  get programs(): readonly DashboardProgramSummaryDto[] {
    return this.dashboardState()?.programs ?? [];
  }

  get upcomingSessions(): readonly DashboardSessionReminderDto[] {
    return this.dashboardState()?.upcomingSessions ?? [];
  }

  get recentAnnouncements(): readonly DashboardAnnouncementSummaryDto[] {
    return this.dashboardState()?.recentAnnouncements ?? [];
  }

  get hasDashboardContent(): boolean {
    return (
      this.programs.length > 0 ||
      this.upcomingSessions.length > 0 ||
      this.recentAnnouncements.length > 0
    );
  }

  ngOnInit(): void {
    void this.loadHomeDashboard();
  }

  protected async reloadDashboard(): Promise<void> {
    await this.loadHomeDashboard();
  }

  private async loadHomeDashboard(): Promise<void> {
    await loadDashboardAggregate({
      getAggregate: () => this.dashboardClient.getAggregate(),
      setLoading: (value) => this.loading.set(value),
      setData: (value) => this.dashboardState.set(value),
      setError: (value) => this.errorMessage.set(value),
      resolveErrorMessage: (error, fallback) => {
        logDebugError('mobile.dashboard.load', error, {
          route: '/tabs/accueil',
        });

        return resolveAuthErrorMessage(error, fallback);
      },
    });
  }
}
