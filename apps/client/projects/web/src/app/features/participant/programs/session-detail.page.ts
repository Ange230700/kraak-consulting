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

@Component({
  selector: 'kraak-web-participant-session-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './session-detail.page.html',
})
export default class SessionDetailPage implements OnInit {
  private readonly authService = inject(WebAuthService);
  private readonly route = inject(ActivatedRoute);

  protected programsClient: Pick<
    ApiClient['participantPrograms'],
    'getById' | 'markSessionProgress'
  > = createApiClient({
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
          'Impossible de mettre à jour votre progression.',
        ),
      );
    } finally {
      this.markingProgress.set(false);
    }
  }

  protected sessionStatusLabel(status: SessionDto['status']): string {
    switch (status) {
      case 'scheduled':
        return 'Planifiée';
      case 'live':
        return 'En direct';
      case 'completed':
        return 'Terminée';
      case 'cancelled':
        return 'Annulée';
    }
  }

  protected locationTypeLabel(type: SessionDto['locationType']): string {
    switch (type) {
      case 'online':
        return 'En ligne';
      case 'onsite':
        return 'Sur site';
      case 'hybrid':
        return 'Hybride';
    }
  }

  protected formatDateTime(rawDate: string): string {
    const parsedDate = new Date(rawDate);

    if (Number.isNaN(parsedDate.getTime())) {
      return rawDate;
    }

    return new Intl.DateTimeFormat('fr-FR', {
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
          'Erreur lors du chargement de la session.',
        ),
      );
    } finally {
      this.loading.set(false);
    }
  }
}
