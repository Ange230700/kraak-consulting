import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonSpinner } from '@ionic/angular/standalone';
import { logDebugError } from '@kraak/api-client';
import type {
  ResourceAudienceValue,
  ResourceDto,
  ResourceThemeValue,
  ResourceTypeValue,
} from '@kraak/contracts';
import {
  KraakI18nService,
  KraakTranslatePipe,
} from '../../../../../shared/i18n';
import { PageShellComponent } from '../../shared/page-shell/page-shell.component';
import { resolveAuthErrorMessage } from '../auth/mobile-auth.service';
import { MobileResourcesService } from './mobile-resources.service';

const RESOURCE_THEME_OPTIONS: readonly {
  value: ResourceThemeValue;
  label: string;
}[] = [
  { value: 'training', label: 'mobile.resources.list.themes.training' },
  {
    value: 'project_management',
    label: 'mobile.resources.list.themes.project_management',
  },
  { value: 'immigration', label: 'mobile.resources.list.themes.immigration' },
  { value: 'career', label: 'mobile.resources.list.themes.career' },
];

const RESOURCE_AUDIENCE_OPTIONS: readonly {
  value: ResourceAudienceValue;
  label: string;
}[] = [
  { value: 'all', label: 'mobile.resources.list.audiences.all' },
  {
    value: 'young_professionals_students',
    label: 'mobile.resources.list.audiences.young_professionals_students',
  },
  {
    value: 'organizations',
    label: 'mobile.resources.list.audiences.organizations',
  },
  {
    value: 'international_candidates',
    label: 'mobile.resources.list.audiences.international_candidates',
  },
];

@Component({
  selector: 'kraak-resource-list-page',
  standalone: true,
  imports: [
    PageShellComponent,
    IonButton,
    IonSpinner,
    RouterLink,
    KraakTranslatePipe,
  ],
  templateUrl: './resource-list.page.html',
})
export default class ResourceListPage implements OnInit {
  private readonly resourcesService = inject(MobileResourcesService);
  private readonly i18n = inject(KraakI18nService);
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
    void this.loadResources();
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
    const option = this.resourceThemeOptions.find(
      (candidate) => candidate.value === theme,
    );

    return option ? this.i18n.translate(option.label) : theme;
  }

  protected getResourceAudienceLabel(audience: ResourceAudienceValue): string {
    const option = this.resourceAudienceOptions.find(
      (candidate) => candidate.value === audience,
    );

    return option ? this.i18n.translate(option.label) : audience;
  }

  protected getResourceTypeLabel(type: ResourceTypeValue): string {
    return this.i18n.translate(`mobile.resources.list.types.${type}`);
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
        logDebugError('mobile.resources.list', error, {
          route: '/tabs/programmes/ressources',
        });
        this.errorMessage.set(
          resolveAuthErrorMessage(
            error,
            this.i18n.translate('mobile.resources.list.feedback.loadFailure'),
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
