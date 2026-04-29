import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonButton, IonSpinner } from '@ionic/angular/standalone';
import type { ResourceDto } from '@kraak/contracts';
import { map } from 'rxjs';
import { PageShell } from '../../shared/page-shell/page-shell';
import { resolveAuthErrorMessage } from '../auth/mobile-auth.service';
import { MobileResourcesService } from './mobile-resources.service';

@Component({
  selector: 'kraak-resource-detail-page',
  standalone: true,
  imports: [PageShell, IonButton, IonSpinner],
  templateUrl: './resource-detail.page.html',
})
export default class ResourceDetailPage implements OnInit {
  private readonly resourcesService = inject(MobileResourcesService);
  private readonly route = inject(ActivatedRoute);

  protected readonly resource = signal<ResourceDto | null>(null);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly currentResourceId = signal<string | null>(null);

  protected readonly resourceId = computed(() => this.currentResourceId());

  ngOnInit(): void {
    this.route.paramMap
      .pipe(map((params) => params.get('resourceId')))
      .subscribe((resourceId) => {
        this.currentResourceId.set(resourceId);

        if (!resourceId) {
          this.loading.set(false);
          this.errorMessage.set('Identifiant de ressource manquant.');
          this.resource.set(null);
          return;
        }

        this.loadResource(resourceId);
      });
  }

  protected async reloadResource(): Promise<void> {
    const resourceId = this.resourceId();
    if (!resourceId) {
      this.errorMessage.set('Identifiant de ressource manquant.');
      return;
    }

    await this.loadResource(resourceId);
  }

  private async loadResource(resourceId: string): Promise<void> {
    try {
      this.loading.set(true);
      this.errorMessage.set(null);
      const data = await this.resourcesService.getResourceById(resourceId);
      this.resource.set(data);
    } catch (error) {
      this.errorMessage.set(
        resolveAuthErrorMessage(
          error,
          'Erreur lors du chargement du détail de la ressource.',
        ),
      );
      this.resource.set(null);
    } finally {
      this.loading.set(false);
    }
  }
}
