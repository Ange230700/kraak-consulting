import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { IonButton, IonSpinner } from '@ionic/angular/standalone';
import type { ParticipantProgramDetailDto } from '@kraak/contracts';
import { PageShell } from '../../shared/page-shell/page-shell';
import { MobileProgramsService } from './mobile-programs.service';
import { resolveAuthErrorMessage } from '../auth/mobile-auth.service';

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
    const programId = this.route.snapshot.paramMap.get('programId');
    if (programId) {
      this.loadProgramDetail(programId);
    }
  }

  protected async loadProgramDetail(programId: string): Promise<void> {
    try {
      this.loading.set(true);
      this.errorMessage.set(null);
      const data = await this.programsService.getProgramDetail(programId);
      this.programDetail.set(data);
    } catch (error) {
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

  protected async reloadProgram(): Promise<void> {
    const programId = this.route.snapshot.paramMap.get('programId');
    if (programId) {
      await this.loadProgramDetail(programId);
    }
  }
}
