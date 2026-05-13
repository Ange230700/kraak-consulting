import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonButton } from '@ionic/angular/standalone';
import type {
  SupportRequestDto,
  SupportRequestStatusValue,
} from '@kraak/contracts';
import { PageShell } from '../../shared/page-shell/page-shell.component';
import { MobileSupportService } from './mobile-support.service';

@Component({
  selector: 'kraak-support-page',
  standalone: true,
  imports: [PageShell, IonButton, RouterLink, DatePipe],
  templateUrl: './support.page.html',
})
export default class SupportPage implements OnInit {
  private readonly supportService = inject(MobileSupportService);

  readonly loading = signal(true);
  readonly requests = signal<SupportRequestDto[]>([]);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    void this.loadRequests();
  }

  getStatusLabel(status: SupportRequestStatusValue): string {
    const labels: Record<SupportRequestStatusValue, string> = {
      open: 'Ouverte',
      in_progress: 'En cours',
      resolved: 'R\u00E9solue',
      closed: 'Cl\u00F4tur\u00E9e',
    };

    return labels[status];
  }

  private async loadRequests(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const data = await this.supportService.listMyRequests();
      this.requests.set(data);
    } catch {
      this.errorMessage.set(
        'Impossible de charger le suivi de vos demandes pour le moment.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
