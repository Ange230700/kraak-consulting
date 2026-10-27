import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton } from '@ionic/angular/standalone';
import type {
  SupportRequestDto,
  SupportRequestStatusValue,
} from '@kraak/contracts';
import {
  KraakI18nService,
  KraakTranslatePipe,
} from '../../../../../shared/i18n';
import { PageShellComponent } from '../../shared/page-shell/page-shell.component';
import { MobileSupportService } from './mobile-support.service';

@Component({
  selector: 'kraak-support-page',
  standalone: true,
  imports: [PageShellComponent, IonButton, RouterLink, KraakTranslatePipe],
  templateUrl: './support.page.html',
})
export default class SupportPage implements OnInit {
  private readonly supportService = inject(MobileSupportService);
  private readonly i18n = inject(KraakI18nService);

  readonly loading = signal(true);
  readonly requests = signal<SupportRequestDto[]>([]);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    void this.loadRequests();
  }

  getStatusLabel(status: SupportRequestStatusValue): string {
    return this.i18n.translate(`mobile.support.overview.statuses.${status}`);
  }

  formatDateTime(value: string): string {
    return new Intl.DateTimeFormat(this.i18n.locale(), {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  private async loadRequests(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const data = await this.supportService.listMyRequests();
      this.requests.set(data);
    } catch {
      this.errorMessage.set(
        this.i18n.translate('mobile.support.overview.feedback.loadFailure'),
      );
    } finally {
      this.loading.set(false);
    }
  }
}
