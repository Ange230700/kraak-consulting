import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonSpinner } from '@ionic/angular/standalone';
import { logDebugError } from '@kraak/api-client';
import type { ParticipantProgramListItemDto } from '@kraak/contracts';
import { PageShellComponent } from '../../shared/page-shell/page-shell.component';
import {
  KraakI18nService,
  KraakTranslatePipe,
} from '../../../../../shared/i18n';
import { MobileProgramsService } from './mobile-programs.service';
import { resolveAuthErrorMessage } from '../auth/mobile-auth.service';

@Component({
  selector: 'kraak-program-list-page',
  standalone: true,
  imports: [
    PageShellComponent,
    IonButton,
    IonSpinner,
    RouterLink,
    KraakTranslatePipe,
  ],
  templateUrl: './program-list.page.html',
})
export default class ProgramListPage implements OnInit {
  private readonly programsService = inject(MobileProgramsService);
  private readonly i18n = inject(KraakI18nService);

  protected readonly programs = signal<ParticipantProgramListItemDto[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    void this.loadPrograms();
  }

  protected async loadPrograms(): Promise<void> {
    try {
      this.loading.set(true);
      this.errorMessage.set(null);
      const data = await this.programsService.listPrograms();
      this.programs.set(data);
    } catch (error) {
      logDebugError('mobile.programs.list', error, {
        route: '/tabs/programmes',
      });
      this.errorMessage.set(
        resolveAuthErrorMessage(
          error,
          this.i18n.translate('mobile.programs.list.feedback.loadFailure'),
        ),
      );
    } finally {
      this.loading.set(false);
    }
  }

  protected formatShortDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(this.i18n.locale(), {
      dateStyle: 'short',
    }).format(date);
  }

  protected getEnrollmentStatusLabel(status: string): string {
    return this.i18n.translate(`mobile.programs.list.statuses.${status}`);
  }

  protected async reloadPrograms(): Promise<void> {
    await this.loadPrograms();
  }
}
