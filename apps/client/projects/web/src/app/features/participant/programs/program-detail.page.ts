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

@Component({
  selector: 'kraak-web-participant-program-detail',
  standalone: true,
  imports: [RouterLink, RevealOnScrollDirective],
  templateUrl: './program-detail.page.html',
})
export default class ProgramDetailPage implements OnInit {
  private readonly authService = inject(WebAuthService);
  private readonly route = inject(ActivatedRoute);

  protected programsClient: Pick<ApiClient['participantPrograms'], 'getById'> =
    createApiClient({
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
        return 'En attente';
      case 'active':
        return 'Actif';
      case 'completed':
        return 'Terminé';
      case 'cancelled':
        return 'Annulé';
    }
  }

  protected progressStatusLabel(
    status: ParticipantProgramDetailDto['progress']['status'],
  ): string {
    switch (status) {
      case 'not_started':
        return 'Non commencé';
      case 'in_progress':
        return 'En cours';
      case 'completed':
        return 'Terminé';
    }
  }

  protected sessionStatusLabel(
    status: ParticipantProgramDetailDto['sessions'][number]['status'],
  ): string {
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

  protected locationTypeLabel(
    type: ParticipantProgramDetailDto['sessions'][number]['locationType'],
  ): string {
    switch (type) {
      case 'online':
        return 'En ligne';
      case 'onsite':
        return 'Sur site';
      case 'hybrid':
        return 'Hybride';
    }
  }

  protected resourceTypeLabel(
    type: ParticipantProgramDetailDto['resources'][number]['resourceType'],
  ): string {
    switch (type) {
      case 'link':
        return 'Lien';
      case 'file':
        return 'Fichier';
      case 'video':
        return 'Vidéo';
      case 'document':
        return 'Document';
    }
  }

  protected resourceThemeLabel(
    theme: ParticipantProgramDetailDto['resources'][number]['resourceTheme'],
  ): string {
    switch (theme) {
      case 'training':
        return 'Formation';
      case 'project_management':
        return 'Gestion de projet';
      case 'immigration':
        return 'Immigration';
      case 'career':
        return 'Carrière';
    }
  }

  protected formatDate(rawDate: string | null): string {
    if (!rawDate) {
      return 'À venir';
    }

    const parsedDate = new Date(rawDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return rawDate;
    }

    return new Intl.DateTimeFormat('fr-FR', {
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

    return new Intl.DateTimeFormat('fr-FR', {
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
          'Erreur lors du chargement du programme.',
        ),
      );
    } finally {
      this.loading.set(false);
    }
  }
}
