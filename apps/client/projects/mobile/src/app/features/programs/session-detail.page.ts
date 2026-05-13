import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { IonButton, IonSpinner } from '@ionic/angular/standalone';
import { logDebugError } from '@kraak/api-client';
import type { ParticipantProgramDetailDto, SessionDto } from '@kraak/contracts';
import { PageShell } from '../../shared/page-shell/page-shell.component';
import { MobileProgramsService } from './mobile-programs.service';
import {
  loadProgramDetailState,
  readProgramId,
} from './program-detail-loader.util';

@Component({
  selector: 'kraak-session-detail-page',
  standalone: true,
  imports: [PageShell, IonButton, IonSpinner, RouterLink, DatePipe],
  templateUrl: './session-detail.page.html',
})
export default class SessionDetailPage implements OnInit {
  private readonly programsService = inject(MobileProgramsService);
  private readonly route = inject(ActivatedRoute);

  protected readonly programDetail = signal<ParticipantProgramDetailDto | null>(
    null,
  );
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly markingProgress = signal(false);
  protected readonly markErrorMessage = signal<string | null>(null);

  protected readonly session = computed<SessionDto | null>(() => {
    const sessionId = this.route.snapshot.paramMap.get('sessionId');
    const detail = this.programDetail();

    if (!sessionId || !detail) {
      return null;
    }

    return detail.sessions.find((s) => s.id === sessionId) ?? null;
  });

  protected readonly programId = computed(
    () =>
      this.route.snapshot.paramMap.get('programId') ??
      this.programDetail()?.program.id,
  );

  protected readonly isSessionCompleted = computed(() => {
    const detail = this.programDetail();
    const currentSession = this.session();

    if (!detail || !currentSession) {
      return false;
    }

    return detail.progress.completedSessionIds.includes(currentSession.id);
  });

  ngOnInit(): void {
    const programId = readProgramId(this.route);
    if (programId) {
      this.loadProgramDetail(programId);
    }
  }

  protected async loadProgramDetail(programId: string): Promise<void> {
    await loadProgramDetailState({
      programsService: this.programsService,
      programId,
      loading: this.loading,
      errorMessage: this.errorMessage,
      programDetail: this.programDetail,
      fallbackMessage: 'Erreur lors du chargement de la session.',
    });
  }

  protected async reloadSession(): Promise<void> {
    const programId = readProgramId(this.route);
    if (programId) {
      await this.loadProgramDetail(programId);
    }
  }

  protected onReloadKeydown(event: Event): void {
    event.preventDefault();
    void this.reloadSession();
  }

  protected onMarkKeydown(event: Event, completed: boolean): void {
    event.preventDefault();
    void this.markSessionCompletion(completed);
  }

  protected async markSessionCompletion(completed: boolean): Promise<void> {
    const programId = this.programId();
    const currentSession = this.session();

    if (!programId || !currentSession || this.markingProgress()) {
      return;
    }

    try {
      this.markingProgress.set(true);
      this.markErrorMessage.set(null);
      await this.programsService.markSessionProgress(
        programId,
        currentSession.id,
        completed,
      );
      await this.loadProgramDetail(programId);
    } catch (error) {
      logDebugError('mobile.programs.session.progress', error, {
        completed,
      });
      this.markErrorMessage.set(
        error instanceof Error
          ? error.message
          : 'Impossible de mettre \u00E0 jour votre progression.',
      );
    } finally {
      this.markingProgress.set(false);
    }
  }
}
