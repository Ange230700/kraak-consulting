import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  createApiClient,
  logDebugError,
  type ApiClient,
} from '@kraak/api-client';
import type { DashboardAggregateDto } from '@kraak/contracts';
import {
  loadDashboardAggregate,
  resolveDashboardErrorMessage,
} from '@kraak/domain';
import { MessageService } from 'primeng/api';
import { Message } from 'primeng/message';

import { environment } from '../../../../environments/environment';
import { resolveApiBaseUrl } from '../../../core/runtime/runtime-config';
import { WebAuthService } from '../../../core/auth/web-auth.service';
import { RevealOnScrollDirective } from '../../../shared/motion/reveal-on-scroll.directive';

import {
  KraakI18nService,
  KraakTranslatePipe,
} from '../../../../../../shared/i18n';
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

@Component({
  selector: 'kraak-web-participant-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    Message,
    RevealOnScrollDirective,
    KraakTranslatePipe,
  ],
  templateUrl: './dashboard.page.html',
})
export default class DashboardPage implements OnInit {
  private readonly i18n = inject(KraakI18nService);
  private readonly authService = inject(WebAuthService);
  private readonly messageService = inject(MessageService);
  protected dashboardClient: Pick<ApiClient['dashboard'], 'getAggregate'> =
    createApiClient({
      getLocale: () => this.i18n.locale(),
      baseUrl: resolveApiBaseUrl(environment.apiBaseUrl),
      getAuthToken: () =>
        this.authService.currentSession()?.accessToken ?? null,
    }).dashboard;

  readonly currentProfile = this.authService.currentProfile;
  readonly quickLinks = computed<readonly DashboardQuickLink[]>(() => [
    {
      label: this.translate(
        'web.participant.dashboard.quickLinks.programs.label',
      ),
      detail: this.translate(
        'web.participant.dashboard.quickLinks.programs.detail',
      ),
      href: '/participant/programmes',
    },
    {
      label: this.translate(
        'web.participant.dashboard.quickLinks.contact.label',
      ),
      detail: this.translate(
        'web.participant.dashboard.quickLinks.contact.detail',
      ),
      href: '/contact',
    },
  ]);

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
        label: this.translate(
          'web.participant.dashboard.summary.indicators.programs.label',
        ),
        value: `${this.programs().length}`,
        detail: this.translate(
          'web.participant.dashboard.summary.indicators.programs.detail',
        ),
      },
      {
        id: 'sessions',
        label: this.translate(
          'web.participant.dashboard.summary.indicators.sessions.label',
        ),
        value: `${this.upcomingSessions().length}`,
        detail: this.translate(
          'web.participant.dashboard.summary.indicators.sessions.detail',
        ),
      },
      {
        id: 'announcements',
        label: this.translate(
          'web.participant.dashboard.summary.indicators.announcements.label',
        ),
        value: `${this.recentAnnouncements().length}`,
        detail: this.translate(
          'web.participant.dashboard.summary.indicators.announcements.detail',
        ),
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
      ? this.translate('web.participant.dashboard.summary.totalSingular')
      : `${itemCount} ${this.translate(
          'web.participant.dashboard.summary.totalPluralSuffix',
        )}`;
  });
  readonly nextSessionSummary = computed(() => {
    const nextSession = this.upcomingSessions()[0];
    if (!nextSession) {
      return this.translate('web.participant.dashboard.nextStep.noSession');
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
      resolveErrorMessage: (error, fallback) => {
        logDebugError('web.dashboard.load', error, {
          route: '/participant/dashboard',
        });

        return resolveDashboardErrorMessage(error, fallback);
      },
    });

    const currentError = this.errorMessage();
    if (currentError) {
      this.messageService.add({
        key: 'app-feedback',
        severity: 'error',
        summary: this.translate('web.participant.dashboard.toast.title'),
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
        summary: this.translate('web.participant.dashboard.toast.title'),
        detail: this.translate('web.participant.dashboard.toast.reloadSuccess'),
        life: 4500,
      });
      this.hasRecoveredFromError.set(false);
    }
  }

  private translate(key: string): string {
    // Make computed values depend explicitly on the locale signal.
    this.i18n.locale();
    return this.i18n.translate(key);
  }

  private formatDate(rawDate: string): string {
    const parsedDate = new Date(rawDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return rawDate;
    }

    return new Intl.DateTimeFormat(this.i18n.locale(), {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(parsedDate);
  }
}
