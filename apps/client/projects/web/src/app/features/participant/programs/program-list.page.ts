import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  createApiClient,
  logDebugError,
  resolveAuthErrorMessage,
  type ApiClient,
} from '@kraak/api-client';
import type { ParticipantProgramListItemDto } from '@kraak/contracts';

import { environment } from '../../../../environments/environment';
import { WebAuthService } from '../../../core/auth/web-auth.service';
import { resolveApiBaseUrl } from '../../../core/runtime/runtime-config';
import { RevealOnScrollDirective } from '../../../shared/motion/reveal-on-scroll.directive';

import {
  KraakI18nService,
  KraakTranslatePipe,
} from '../../../../../../shared/i18n';
@Component({
  selector: 'kraak-web-participant-program-list',
  standalone: true,
  imports: [RouterLink, RevealOnScrollDirective, KraakTranslatePipe],
  templateUrl: './program-list.page.html',
})
export default class ProgramListPage implements OnInit {
  private readonly i18n = inject(KraakI18nService);
  private readonly authService = inject(WebAuthService);

  protected programsClient: Pick<ApiClient['participantPrograms'], 'list'> =
    createApiClient({
      getLocale: () => this.i18n.locale(),
      baseUrl: resolveApiBaseUrl(environment.apiBaseUrl),
      getAuthToken: () =>
        this.authService.currentSession()?.accessToken ?? null,
    }).participantPrograms;

  protected readonly programs = signal<ParticipantProgramListItemDto[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    void this.loadPrograms();
  }

  protected async reloadPrograms(): Promise<void> {
    await this.loadPrograms();
  }

  protected enrollmentStatusLabel(
    status: ParticipantProgramListItemDto['enrollmentStatus'],
  ): string {
    switch (status) {
      case 'pending':
        return this.i18n.translate(
          'web.participant.programList.status.enrollment.pending',
        );
      case 'active':
        return this.i18n.translate(
          'web.participant.programList.status.enrollment.active',
        );
      case 'completed':
        return this.i18n.translate(
          'web.participant.programList.status.enrollment.completed',
        );
      case 'cancelled':
        return this.i18n.translate(
          'web.participant.programList.status.enrollment.cancelled',
        );
    }
  }

  protected progressStatusLabel(
    status: ParticipantProgramListItemDto['progress']['status'],
  ): string {
    switch (status) {
      case 'not_started':
        return this.i18n.translate(
          'web.participant.programList.status.progress.notStarted',
        );
      case 'in_progress':
        return this.i18n.translate(
          'web.participant.programList.status.progress.inProgress',
        );
      case 'completed':
        return this.i18n.translate(
          'web.participant.programList.status.progress.completed',
        );
    }
  }

  protected formatDate(rawDate: string): string {
    const parsedDate = new Date(rawDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return rawDate;
    }

    return new Intl.DateTimeFormat(this.i18n.locale(), {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(parsedDate);
  }

  private async loadPrograms(): Promise<void> {
    try {
      this.loading.set(true);
      this.errorMessage.set(null);

      const data = await this.programsClient.list();
      this.programs.set(data);
    } catch (error) {
      logDebugError('web.participant.programs.list', error, {
        route: '/participant/programmes',
      });

      this.errorMessage.set(
        resolveAuthErrorMessage(
          error,
          this.i18n.translate('web.participant.programList.error.fallback'),
        ),
      );
    } finally {
      this.loading.set(false);
    }
  }
}
