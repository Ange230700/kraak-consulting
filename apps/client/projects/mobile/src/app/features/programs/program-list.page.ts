import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { IonButton, IonSpinner } from '@ionic/angular/standalone';
import type { ParticipantProgramListItemDto } from '@kraak/contracts';
import { PageShell } from '../../shared/page-shell/page-shell';
import { MobileProgramsService } from './mobile-programs.service';
import { resolveAuthErrorMessage } from '../auth/mobile-auth.service';

@Component({
  selector: 'kraak-program-list-page',
  standalone: true,
  imports: [PageShell, IonButton, IonSpinner, RouterLink, DatePipe],
  templateUrl: './program-list.page.html',
})
export default class ProgramListPage implements OnInit {
  private readonly programsService = inject(MobileProgramsService);

  protected readonly programs = signal<ParticipantProgramListItemDto[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadPrograms();
  }

  protected async loadPrograms(): Promise<void> {
    try {
      this.loading.set(true);
      this.errorMessage.set(null);
      const data = await this.programsService.listPrograms();
      this.programs.set(data);
    } catch (error) {
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

  protected async reloadPrograms(): Promise<void> {
    await this.loadPrograms();
  }
}
