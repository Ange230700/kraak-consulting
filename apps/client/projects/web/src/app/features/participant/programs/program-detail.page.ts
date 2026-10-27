import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  createApiClient,
  logDebugError,
  resolveAuthErrorMessage,
  type ApiClient,
} from '@kraak/api-client';
import type { ParticipantProgramDetailDto } from '@kraak/contracts';

import { environment } from '../../../../environments/environment';
import { WebAuthService } from '../../../core/auth/web-auth.service';
import { resolveApiBaseUrl } from '../../../core/runtime/runtime-config';
import { RevealOnScrollDirective } from '../../../shared/motion/reveal-on-scroll.directive';

import {
  KraakI18nService,
  KraakTranslatePipe,
} from '../../../../../../shared/i18n';
@Component({
  selector: 'kraak-web-participant-program-detail',
  standalone: true,
  imports: [RouterLink, RevealOnScrollDirective, KraakTranslatePipe],
  templateUrl: './program-detail.page.html',
})
export default class ProgramDetailPage implements OnInit {
  private readonly i18n = inject(KraakI18nService);
  private readonly authService = inject(WebAuthService);
  private readonly route = inject(ActivatedRoute);

  protected programsClient: Pick<ApiClient['participantPrograms'], 'getById'> =
    createApiClient({
      getLocale: () => this.i18n.locale(),
      baseUrl: resolveApiBaseUrl(environment.apiBaseUrl),
      getAuthToken: () =>
        this.authService.currentSession()?.accessToken ?? null,
    }).participantPrograms;

  protected readonly programDetail = signal<ParticipantProgramDetailDto | null>(
    null,
  );
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const programId = this.readProgramId();

    if (!programId) {
      this.loading.set(false);
      return;
    }

    void this.loadProgramDetail(programId);
  }

  protected async reloadProgram(): Promise<void> {
    const programId = this.readProgramId();

    if (programId) {
      await this.loadProgramDetail(programId);
    }
  }

  protected enrollmentStatusLabel(
    status: ParticipantProgramDetailDto['enrollmentStatus'],
  ): string {
    switch (status) {
      case 'pending':
        return this.i18n.translate(
          'web.participant.programDetail.status.enrollment.pending',
        );
      case 'active':
        return this.i18n.translate(
          'web.participant.programDetail.status.enrollment.active',
        );
      case 'completed':
        return this.i18n.translate(
          'web.participant.programDetail.status.enrollment.completed',
        );
      case 'cancelled':
        return this.i18n.translate(
          'web.participant.programDetail.status.enrollment.cancelled',
        );
    }
  }

  protected progressStatusLabel(
    status: ParticipantProgramDetailDto['progress']['status'],
  ): string {
    switch (status) {
      case 'not_started':
        return this.i18n.translate(
          'web.participant.programDetail.status.progress.notStarted',
        );
      case 'in_progress':
        return this.i18n.translate(
          'web.participant.programDetail.status.progress.inProgress',
        );
      case 'completed':
        return this.i18n.translate(
          'web.participant.programDetail.status.progress.completed',
        );
    }
  }

  protected sessionStatusLabel(
    status: ParticipantProgramDetailDto['sessions'][number]['status'],
  ): string {
    switch (status) {
      case 'scheduled':
        return this.i18n.translate(
          'web.participant.programDetail.status.session.scheduled',
        );
      case 'live':
        return this.i18n.translate(
          'web.participant.programDetail.status.session.live',
        );
      case 'completed':
        return this.i18n.translate(
          'web.participant.programDetail.status.session.completed',
        );
      case 'cancelled':
        return this.i18n.translate(
          'web.participant.programDetail.status.session.cancelled',
        );
    }
  }

  protected locationTypeLabel(
    type: ParticipantProgramDetailDto['sessions'][number]['locationType'],
  ): string {
    switch (type) {
      case 'online':
        return this.i18n.translate(
          'web.participant.programDetail.status.location.online',
        );
      case 'onsite':
        return this.i18n.translate(
          'web.participant.programDetail.status.location.onsite',
        );
      case 'hybrid':
        return this.i18n.translate(
          'web.participant.programDetail.status.location.hybrid',
        );
    }
  }

  protected resourceTypeLabel(
    type: ParticipantProgramDetailDto['resources'][number]['resourceType'],
  ): string {
    switch (type) {
      case 'link':
        return this.i18n.translate(
          'web.participant.programDetail.status.resourceType.link',
        );
      case 'file':
        return this.i18n.translate(
          'web.participant.programDetail.status.resourceType.file',
        );
      case 'video':
        return this.i18n.translate(
          'web.participant.programDetail.status.resourceType.video',
        );
      case 'document':
        return this.i18n.translate(
          'web.participant.programDetail.status.resourceType.document',
        );
    }
  }

  protected resourceThemeLabel(
    theme: ParticipantProgramDetailDto['resources'][number]['resourceTheme'],
  ): string {
    switch (theme) {
      case 'training':
        return this.i18n.translate(
          'web.participant.programDetail.status.resourceTheme.training',
        );
      case 'project_management':
        return this.i18n.translate(
          'web.participant.programDetail.status.resourceTheme.projectManagement',
        );
      case 'immigration':
        return this.i18n.translate(
          'web.participant.programDetail.status.resourceTheme.immigration',
        );
      case 'career':
        return this.i18n.translate(
          'web.participant.programDetail.status.resourceTheme.career',
        );
    }
  }

  protected formatDate(rawDate: string | null): string {
    if (!rawDate) {
      return this.i18n.translate('web.participant.programDetail.date.upcoming');
    }

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

  private readProgramId(): string | null {
    return this.route.snapshot.paramMap.get('programId');
  }

  private async loadProgramDetail(programId: string): Promise<void> {
    try {
      this.loading.set(true);
      this.errorMessage.set(null);

      const detail = await this.programsClient.getById(programId);
      this.programDetail.set(detail);
    } catch (error) {
      logDebugError('web.participant.programs.detail', error, {
        route: `/participant/programmes/${programId}`,
      });

      this.errorMessage.set(
        resolveAuthErrorMessage(
          error,
          this.i18n.translate('web.participant.programDetail.error.fallback'),
        ),
      );
    } finally {
      this.loading.set(false);
    }
  }
}
