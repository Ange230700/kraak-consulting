import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  createApiClient,
  logDebugError,
  resolveAuthErrorMessage,
  type ApiClient,
} from '@kraak/api-client';
import type { ParticipantProgramDetailDto, SessionDto } from '@kraak/contracts';

import { environment } from '../../../../environments/environment';
import { WebAuthService } from '../../../core/auth/web-auth.service';
import { resolveApiBaseUrl } from '../../../core/runtime/runtime-config';
import { RevealOnScrollDirective } from '../../../shared/motion/reveal-on-scroll.directive';

import {
  KraakI18nService,
  KraakTranslatePipe,
} from '../../../../../../shared/i18n';
@Component({
  selector: 'kraak-web-participant-session-detail',
  standalone: true,
  imports: [RouterLink, RevealOnScrollDirective, KraakTranslatePipe],
  templateUrl: './session-detail.page.html',
})
export default class SessionDetailPage implements OnInit {
  private readonly i18n = inject(KraakI18nService);
  private readonly authService = inject(WebAuthService);
  private readonly route = inject(ActivatedRoute);

  protected programsClient: Pick<
    ApiClient['participantPrograms'],
    'getById' | 'markSessionProgress'
  > = createApiClient({
    getLocale: () => this.i18n.locale(),
    baseUrl: resolveApiBaseUrl(environment.apiBaseUrl),
    getAuthToken: () => this.authService.currentSession()?.accessToken ?? null,
  }).participantPrograms;

  protected readonly programDetail = signal<ParticipantProgramDetailDto | null>(
    null,
  );
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly markingProgress = signal(false);
  protected readonly markErrorMessage = signal<string | null>(null);

  protected readonly programId = computed(
    () =>
      this.route.snapshot.paramMap.get('programId') ??
      this.programDetail()?.program.id ??
      null,
  );

  protected readonly session = computed<SessionDto | null>(() => {
    const sessionId = this.route.snapshot.paramMap.get('sessionId');
    const detail = this.programDetail();

    if (!sessionId || !detail) {
      return null;
    }

    return detail.sessions.find((item) => item.id === sessionId) ?? null;
  });

  protected readonly isSessionCompleted = computed(() => {
    const detail = this.programDetail();
    const session = this.session();

    return Boolean(
      detail &&
      session &&
      detail.progress.completedSessionIds.includes(session.id),
    );
  });

  ngOnInit(): void {
    const programId = this.route.snapshot.paramMap.get('programId');

    if (!programId) {
      this.loading.set(false);
      return;
    }

    void this.loadProgramDetail(programId);
  }

  protected async reloadSession(): Promise<void> {
    const programId = this.route.snapshot.paramMap.get('programId');

    if (programId) {
      await this.loadProgramDetail(programId);
    }
  }

  protected async markSessionCompletion(completed: boolean): Promise<void> {
    const programId = this.programId();
    const session = this.session();

    if (!programId || !session || this.markingProgress()) {
      return;
    }

    try {
      this.markingProgress.set(true);
      this.markErrorMessage.set(null);

      await this.programsClient.markSessionProgress(programId, {
        sessionId: session.id,
        completed,
      });

      await this.loadProgramDetail(programId);
    } catch (error) {
      logDebugError('web.participant.programs.session.progress', error, {
        route: `/participant/programmes/${programId}/sessions/${session.id}`,
        completed,
      });

      this.markErrorMessage.set(
        resolveAuthErrorMessage(
          error,
          this.i18n.translate(
            'web.participant.sessionDetail.progress.updateFallback',
          ),
        ),
      );
    } finally {
      this.markingProgress.set(false);
    }
  }

  protected sessionStatusLabel(status: SessionDto['status']): string {
    switch (status) {
      case 'scheduled':
        return this.i18n.translate(
          'web.participant.sessionDetail.status.session.scheduled',
        );
      case 'live':
        return this.i18n.translate(
          'web.participant.sessionDetail.status.session.live',
        );
      case 'completed':
        return this.i18n.translate(
          'web.participant.sessionDetail.status.session.completed',
        );
      case 'cancelled':
        return this.i18n.translate(
          'web.participant.sessionDetail.status.session.cancelled',
        );
    }
  }

  protected locationTypeLabel(type: SessionDto['locationType']): string {
    switch (type) {
      case 'online':
        return this.i18n.translate(
          'web.participant.sessionDetail.status.location.online',
        );
      case 'onsite':
        return this.i18n.translate(
          'web.participant.sessionDetail.status.location.onsite',
        );
      case 'hybrid':
        return this.i18n.translate(
          'web.participant.sessionDetail.status.location.hybrid',
        );
    }
  }

  protected formatDateTime(rawDate: string): string {
    const parsedDate = new Date(rawDate);

    if (Number.isNaN(parsedDate.getTime())) {
      return rawDate;
    }

    return new Intl.DateTimeFormat(this.i18n.locale(), {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(parsedDate);
  }

  private async loadProgramDetail(programId: string): Promise<void> {
    try {
      this.loading.set(true);
      this.errorMessage.set(null);

      const detail = await this.programsClient.getById(programId);
      this.programDetail.set(detail);
    } catch (error) {
      logDebugError('web.participant.programs.session.load', error, {
        route: `/participant/programmes/${programId}/sessions`,
      });

      this.errorMessage.set(
        resolveAuthErrorMessage(
          error,
          this.i18n.translate('web.participant.sessionDetail.error.fallback'),
        ),
      );
    } finally {
      this.loading.set(false);
    }
  }
}
