import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonButton, IonSpinner } from '@ionic/angular/standalone';
import type { ParticipantProgramDetailDto } from '@kraak/contracts';
import {
  KraakI18nService,
  KraakTranslatePipe,
} from '../../../../../shared/i18n';
import { PageShellComponent } from '../../shared/page-shell/page-shell.component';
import { MobileProgramsService } from './mobile-programs.service';
import {
  loadProgramDetailState,
  readProgramId,
} from './program-detail-loader.util';

@Component({
  selector: 'kraak-program-detail-page',
  standalone: true,
  imports: [
    PageShellComponent,
    IonButton,
    IonSpinner,
    RouterLink,
    KraakTranslatePipe,
  ],
  templateUrl: './program-detail.page.html',
})
export default class ProgramDetailPage implements OnInit {
  private readonly programsService = inject(MobileProgramsService);
  private readonly route = inject(ActivatedRoute);
  private readonly i18n = inject(KraakI18nService);

  protected readonly programDetail = signal<ParticipantProgramDetailDto | null>(
    null,
  );
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly pageTitle = computed(() => {
    this.i18n.locale();

    const detail = this.programDetail();

    return detail
      ? detail.program.title
      : this.i18n.translate('mobile.programs.detail.page.defaultTitle');
  });

  ngOnInit(): void {
    const programId = readProgramId(this.route);
    if (programId) {
      void this.loadProgramDetail(programId);
    }
  }

  protected getEnrollmentStatusLabel(status: string): string {
    return this.i18n.translate(`mobile.programs.detail.statuses.${status}`);
  }

  protected getLocationTypeLabel(type: string): string {
    return this.i18n.translate(`mobile.programs.detail.locationTypes.${type}`);
  }

  protected getResourceTypeLabel(type: string): string {
    return this.i18n.translate(`mobile.programs.detail.resourceTypes.${type}`);
  }

  protected getCapacityLabel(capacity: number): string {
    return this.i18n.translate(
      capacity === 1
        ? 'mobile.programs.detail.capacity.one'
        : 'mobile.programs.detail.capacity.many',
      { count: capacity },
    );
  }

  protected formatMediumDate(value: string | null | undefined): string {
    return this.formatDate(value, {
      dateStyle: 'medium',
    });
  }

  protected formatMediumDateTime(value: string): string {
    return this.formatDate(value, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  private formatDate(
    value: string | null | undefined,
    options: Intl.DateTimeFormatOptions,
  ): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(this.i18n.locale(), options).format(date);
  }

  protected async loadProgramDetail(programId: string): Promise<void> {
    await loadProgramDetailState({
      programsService: this.programsService,
      programId,
      loading: this.loading,
      errorMessage: this.errorMessage,
      programDetail: this.programDetail,
      fallbackMessage: this.i18n.translate(
        'mobile.programs.detail.feedback.loadFailure',
      ),
    });
  }

  protected async reloadProgram(): Promise<void> {
    const programId = readProgramId(this.route);
    if (programId) {
      await this.loadProgramDetail(programId);
    }
  }
}
