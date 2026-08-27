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

@Component({
  selector: 'kraak-web-participant-program-list',
  standalone: true,
  imports: [RouterLink, RevealOnScrollDirective],
  templateUrl: './program-list.page.html',
})
export default class ProgramListPage implements OnInit {
  private readonly authService = inject(WebAuthService);

  protected programsClient: Pick<ApiClient['participantPrograms'], 'list'> =
    createApiClient({
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
    status: ParticipantProgramListItemDto['progress']['status'],
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

  protected formatDate(rawDate: string): string {
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
          'Erreur lors du chargement des programmes.',
        ),
      );
    } finally {
      this.loading.set(false);
    }
  }
}
