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
import { createApiClient } from '@kraak/api-client';
import type {
  DashboardAggregateDto,
  DashboardAnnouncementSummaryDto,
  DashboardProgramSummaryDto,
  DashboardSessionReminderDto,
} from '@kraak/contracts';
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
        'Retrouvez vos parcours actifs, leurs prochaines étapes et les détails utiles.',
      tone: 'primary',
    },
    {
      tag: 'Annonces',
      title: 'Restez aligné avec les mises à jour importantes.',
      description:
        'Gardez un oeil sur les informations clés à relayer rapidement.',
      tone: 'accent',
    },
    {
      tag: 'Support',
      title: "Demandez de l'aide sans quitter votre parcours.",
      description:
        "Accédez aux bons points de contact quand vous avez besoin d'un relais.",
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
    return resolveAuthErrorMessage(
      error,
      'Impossible de charger votre dashboard pour le moment.',
    );
  }
}
