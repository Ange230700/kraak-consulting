import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { IonButton, IonSpinner } from '@ionic/angular/standalone';
import { createApiClient, logDebugError } from '@kraak/api-client';
import type { AnnouncementDto } from '@kraak/contracts';
import { environment } from '../../../environments/environment';
import {
  MobileAuthService,
  resolveAuthErrorMessage,
} from '../auth/mobile-auth.service';
import { PageShell } from '../../shared/page-shell/page-shell.component';

@Component({
  selector: 'kraak-announcement-detail-page',
  standalone: true,
  imports: [PageShell, IonButton, IonSpinner, DatePipe],
  templateUrl: './announcement-detail.page.html',
})
export default class AnnouncementDetailPage implements OnInit {
  private readonly authService = inject(MobileAuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly announcementsClient = createApiClient({
    baseUrl: environment.apiBaseUrl,
    getAuthToken: () => this.authService.currentSession()?.accessToken ?? null,
  }).announcements;

  protected readonly announcement = signal<AnnouncementDto | null>(null);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly pageTitle = computed(() => {
    const title = this.announcement()?.title;
    return title && title.trim().length > 0
      ? title
      : "D\u00E9tail de l'annonce";
  });

  ngOnInit(): void {
    void this.loadAnnouncement();
  }

  protected async reloadAnnouncement(): Promise<void> {
    await this.loadAnnouncement();
  }

  protected getPriorityLabel(priority: AnnouncementDto['priority']): string {
    switch (priority) {
      case 'critical':
        return 'Critique';
      case 'high':
        return 'Elev\u00E9e';
      case 'normal':
        return 'Normale';
      case 'low':
        return 'Faible';
    }
  }

  private async loadAnnouncement(): Promise<void> {
    const announcementId = this.route.snapshot.paramMap.get('announcementId');

    if (!announcementId) {
      this.loading.set(false);
      this.announcement.set(null);
      this.errorMessage.set('Annonce introuvable.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const announcement =
        await this.announcementsClient.getById(announcementId);
      this.announcement.set(announcement);
    } catch (error) {
      logDebugError('mobile.announcements.detail.load', error, {
        feature: 'announcements',
      });
      this.announcement.set(null);
      this.errorMessage.set(
        resolveAuthErrorMessage(
          error,
          "Erreur lors du chargement de l'annonce.",
        ),
      );
    } finally {
      this.loading.set(false);
    }
  }
}
