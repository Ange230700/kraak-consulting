import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonSpinner } from '@ionic/angular/standalone';
import type {
  ResourceAudienceValue,
  ResourceDto,
  ResourceThemeValue,
  ResourceTypeValue,
} from '@kraak/contracts';
import { PageShell } from '../../shared/page-shell/page-shell';
import { resolveAuthErrorMessage } from '../auth/mobile-auth.service';
import { MobileResourcesService } from './mobile-resources.service';

const RESOURCE_THEME_OPTIONS: readonly {
  value: ResourceThemeValue;
  label: string;
}[] = [
  { value: 'training', label: 'Formation' },
  { value: 'project_management', label: 'Gestion de projet' },
  { value: 'immigration', label: 'Immigration' },
  { value: 'career', label: 'Carri\u00E8re' },
];

const RESOURCE_AUDIENCE_OPTIONS: readonly {
  value: ResourceAudienceValue;
  label: string;
}[] = [
  { value: 'all', label: 'Tous' },
  {
    value: 'young_professionals_students',
    label: 'Jeunes pros et \u00E9tudiants',
  },
  { value: 'organizations', label: 'Organisations' },
  { value: 'international_candidates', label: 'Candidats internationaux' },
];

const RESOURCE_TYPE_LABELS: Record<ResourceTypeValue, string> = {
  link: 'Lien',
  file: 'Fichier',
  video: 'Vid\u00E9o',
  document: 'Document',
};

@Component({
  selector: 'kraak-resource-list-page',
  standalone: true,
  imports: [PageShell, IonButton, IonSpinner, RouterLink],
  templateUrl: './resource-list.page.html',
})
export default class ResourceListPage implements OnInit {
  private readonly resourcesService = inject(MobileResourcesService);
  private latestLoadRequestId = 0;

  protected readonly resources = signal<ResourceDto[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly searchQuery = signal('');
  protected readonly selectedTheme = signal<ResourceThemeValue | ''>('');
  protected readonly selectedAudience = signal<ResourceAudienceValue | ''>('');

  protected readonly resourceThemeOptions = RESOURCE_THEME_OPTIONS;
  protected readonly resourceAudienceOptions = RESOURCE_AUDIENCE_OPTIONS;

  protected readonly filteredResources = computed(() => {
    const normalizedQuery = this.searchQuery().trim().toLowerCase();

    if (normalizedQuery.length === 0) {
      return this.resources();
    }

    return this.resources().filter((resource) => {
      const haystack = [
        resource.title,
        resource.description ?? '',
        resource.resourceType,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  });

  ngOnInit(): void {
    this.loadResources();
  }

  protected onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.searchQuery.set(target?.value ?? '');
  }

  protected async onThemeChange(event: Event): Promise<void> {
    const target = event.target as HTMLSelectElement | null;
    this.selectedTheme.set((target?.value as ResourceThemeValue | '') ?? '');
    await this.loadResources();
  }

  protected async onAudienceChange(event: Event): Promise<void> {
    const target = event.target as HTMLSelectElement | null;
    this.selectedAudience.set(
      (target?.value as ResourceAudienceValue | '') ?? '',
    );
    await this.loadResources();
  }

  protected async reloadResources(): Promise<void> {
    await this.loadResources();
  }

  protected getResourceThemeLabel(theme: ResourceThemeValue): string {
    return (
      this.resourceThemeOptions.find((option) => option.value === theme)
        ?.label ?? theme
    );
  }

  protected getResourceAudienceLabel(audience: ResourceAudienceValue): string {
    return (
      this.resourceAudienceOptions.find((option) => option.value === audience)
        ?.label ?? audience
    );
  }

  protected getResourceTypeLabel(type: ResourceTypeValue): string {
    return RESOURCE_TYPE_LABELS[type];
  }

  private async loadResources(): Promise<void> {
    const requestId = ++this.latestLoadRequestId;

    try {
      this.loading.set(true);
      this.errorMessage.set(null);

      const response = await this.resourcesService.listResources({
        resourceTheme: this.selectedTheme() || undefined,
        resourceAudience: this.selectedAudience() || undefined,
        page: 1,
        limit: 100,
      });

      if (requestId === this.latestLoadRequestId) {
        this.resources.set(response.data);
      }
    } catch (error) {
      if (requestId === this.latestLoadRequestId) {
        this.errorMessage.set(
          resolveAuthErrorMessage(
            error,
            'Erreur lors du chargement des ressources.',
          ),
        );
        this.resources.set([]);
      }
    } finally {
      if (requestId === this.latestLoadRequestId) {
        this.loading.set(false);
      }
    }
  }
}
