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
  ],
  templateUrl: './home.page.html',
})
export default class HomePage implements OnInit {
  private readonly authService = inject(MobileAuthService);
  private readonly dashboardClient = createApiClient({
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
      tag: 'Programmes',
      title: 'Avancez avec un cadre clair.',
      description:
        'Retrouvez vos parcours actifs, leurs prochaines \u00E9tapes et les d\u00E9tails utiles.',
      tone: 'primary',
    },
    {
      tag: 'Annonces',
      title: 'Restez align\u00E9 avec les mises \u00E0 jour importantes.',
      description:
        'Gardez un \u0153il sur les informations cl\u00E9s \u00E0 relayer rapidement.',
      tone: 'accent',
    },
    {
      tag: 'Support',
      title: "Demandez de l'aide sans quitter votre parcours.",
      description:
        "Acc\u00E9dez aux bons points de contact quand vous avez besoin d'un relais.",
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
