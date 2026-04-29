import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { IonButton, IonSpinner } from '@ionic/angular/standalone';
import { createApiClient } from '@kraak/api-client';
import type { AnnouncementDto } from '@kraak/contracts';
import { environment } from '../../../environments/environment';
import {
  MobileAuthService,
  resolveAuthErrorMessage,
} from '../auth/mobile-auth.service';
import { PageShell } from '../../shared/page-shell/page-shell';

@Component({
  selector: 'kraak-announcement-list-page',
  standalone: true,
  imports: [PageShell, IonButton, IonSpinner, RouterLink, DatePipe],
  templateUrl: './announcement-list.page.html',
})
export default class AnnouncementListPage implements OnInit {
  private readonly authService = inject(MobileAuthService);
  private latestLoadRequestId = 0;

  private readonly announcementsClient = createApiClient({
    baseUrl: environment.apiBaseUrl,
    getAuthToken: () => this.authService.currentSession()?.accessToken ?? null,
  }).announcements;

  protected readonly announcements = signal<AnnouncementDto[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    void this.loadAnnouncements();
  }

  protected async reloadAnnouncements(): Promise<void> {
    await this.loadAnnouncements();
  }

  protected getPriorityLabel(priority: AnnouncementDto['priority']): string {
    switch (priority) {
      case 'critical':
        return 'Critique';
      case 'high':
        return 'Elevée';
      case 'normal':
        return 'Normale';
      case 'low':
        return 'Faible';
    }
  }

  private async loadAnnouncements(): Promise<void> {
    const requestId = ++this.latestLoadRequestId;

    try {
      this.loading.set(true);
      this.errorMessage.set(null);

      const response = await this.announcementsClient.list();
      const normalized = this.normalizeAnnouncementListResponse(response);

      if (requestId === this.latestLoadRequestId) {
        this.announcements.set(normalized.data);
        this.total.set(normalized.total);
      }
    } catch (error) {
      if (requestId === this.latestLoadRequestId) {
        this.announcements.set([]);
        this.total.set(0);
        this.errorMessage.set(
          resolveAuthErrorMessage(
            error,
            'Erreur lors du chargement des annonces.',
          ),
        );
      }
    } finally {
      if (requestId === this.latestLoadRequestId) {
        this.loading.set(false);
      }
    }
  }

  private normalizeAnnouncementListResponse(response: unknown): {
    data: AnnouncementDto[];
    total: number;
  } {
    if (Array.isArray(response)) {
      return {
        data: response as AnnouncementDto[],
        total: response.length,
      };
    }

    if (
      response !== null &&
      typeof response === 'object' &&
      'data' in response &&
      Array.isArray(response.data)
    ) {
      const total =
        'total' in response && typeof response.total === 'number'
          ? response.total
          : response.data.length;

      return {
        data: response.data as AnnouncementDto[],
        total,
      };
    }

    return {
      data: [],
      total: 0,
    };
  }
}
