import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { IonButton, IonSpinner } from '@ionic/angular/standalone';
import type { ParticipantProgramDetailDto } from '@kraak/contracts';
import { PageShell } from '../../shared/page-shell/page-shell.component';
import { MobileProgramsService } from './mobile-programs.service';
import {
  loadProgramDetailState,
  readProgramId,
} from './program-detail-loader.util';

@Component({
  selector: 'kraak-program-detail-page',
  standalone: true,
  imports: [PageShell, IonButton, IonSpinner, RouterLink, DatePipe],
  templateUrl: './program-detail.page.html',
})
export default class ProgramDetailPage implements OnInit {
  private readonly programsService = inject(MobileProgramsService);
  private readonly route = inject(ActivatedRoute);

  protected readonly programDetail = signal<ParticipantProgramDetailDto | null>(
    null,
  );
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly pageTitle = computed(() => {
    const detail = this.programDetail();
    return detail ? detail.program.title : 'Programme';
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
      fallbackMessage: 'Erreur lors du chargement du programme.',
    });
  }

  protected async reloadProgram(): Promise<void> {
    const programId = readProgramId(this.route);
    if (programId) {
      await this.loadProgramDetail(programId);
    }
  }
}
