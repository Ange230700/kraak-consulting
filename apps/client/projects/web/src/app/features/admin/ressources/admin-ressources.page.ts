import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { createApiClient } from '@kraak/api-client';
import type {
  CreateResourceDto,
  ResourceDto,
  UpdateResourceDto,
} from '@kraak/contracts';
import {
  PublicationStatus,
  ResourceType,
  ResourceTheme,
  ResourceAudience,
} from '@kraak/contracts';
import { MessageService } from 'primeng/api';
import { ButtonDirective } from 'primeng/button';
import { Message } from 'primeng/message';

import { environment } from '../../../../environments/environment';
import { resolveApiBaseUrl } from '../../../core/runtime/runtime-config';
import { WebAuthService } from '../../../core/auth/web-auth.service';
import { AdminEditorState } from '../admin-editor-state';

import {
  KraakI18nService,
  KraakTranslatePipe,
} from '../../../../../../shared/i18n';
interface ResourceFormModel {
  title: FormControl<string>;
  description: FormControl<string>;
  resourceType: FormControl<string>;
  resourceTheme: FormControl<string>;
  resourceAudience: FormControl<string>;
  url: FormControl<string>;
  status: FormControl<string>;
}

type ResourceListResponse =
  | ResourceDto[]
  | {
      data: ResourceDto[];
      total: number;
    };

interface AdminResourcesClient {
  list(): Promise<ResourceListResponse>;
  create(body: CreateResourceDto): Promise<ResourceDto>;
  update(id: string, body: UpdateResourceDto): Promise<ResourceDto>;
  remove(id: string): Promise<void>;
}

@Component({
  selector: 'kraak-admin-ressources-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonDirective,
    Message,
    KraakTranslatePipe,
  ],
  templateUrl: './admin-ressources.page.html',
})
export default class AdminRessourcesPage
  extends AdminEditorState
  implements OnInit
{
  private readonly authService = inject(WebAuthService);
  private readonly messageService = inject(MessageService);
  private readonly i18n = inject(KraakI18nService);
  resourcesClient: AdminResourcesClient = createApiClient({
    getLocale: () => this.i18n.locale(),
    baseUrl: resolveApiBaseUrl(environment.apiBaseUrl),
    getAuthToken: () => this.authService.currentSession()?.accessToken ?? null,
  }).resources;

  protected readonly ressources = signal<ResourceDto[]>([]);

  protected getPublicationStatusLabel(status: string): string {
    const key = `web.admin.ressources.statuses.${status}`;
    const translated = this.i18n.translate(key);

    return translated === key ? status : translated;
  }

  protected getResourceTypeLabel(resourceType: string): string {
    const key = `web.admin.ressources.types.${resourceType}`;
    const translated = this.i18n.translate(key);

    return translated === key ? resourceType : translated;
  }

  protected getResourceThemeLabel(resourceTheme: string): string {
    const key = `web.admin.ressources.themes.${resourceTheme}`;
    const translated = this.i18n.translate(key);

    return translated === key ? resourceTheme : translated;
  }

  protected getResourceAudienceLabel(resourceAudience: string): string {
    const key = `web.admin.ressources.audiences.${resourceAudience}`;
    const translated = this.i18n.translate(key);

    return translated === key ? resourceAudience : translated;
  }

  protected getEditAriaLabel(ressource: ResourceDto): string {
    return this.i18n.translate('web.admin.ressources.actions.editAria', {
      title: ressource.title,
    });
  }

  protected getDeleteAriaLabel(ressource: ResourceDto): string {
    return this.i18n.translate('web.admin.ressources.actions.deleteAria', {
      title: ressource.title,
    });
  }

  readonly publicationStatuses = Object.values(PublicationStatus);
  readonly resourceTypes = Object.values(ResourceType);
  readonly resourceThemes = Object.values(ResourceTheme);
  readonly resourceAudiences = Object.values(ResourceAudience);

  readonly form = new FormGroup<ResourceFormModel>({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    description: new FormControl('', { nonNullable: true }),
    resourceType: new FormControl('link', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    resourceTheme: new FormControl('training', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    resourceAudience: new FormControl('all', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    url: new FormControl('', { nonNullable: true }),
    status: new FormControl('draft', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  ngOnInit(): void {
    void this.loadRessources();
  }

  async loadRessources(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      const list = await this.resourcesClient.list();
      this.ressources.set(Array.isArray(list) ? list : list.data);
    } catch (err) {
      console.error(
        '[AdminRessourcesPage] Erreur lors du chargement des ressources',
        err,
      );
      this.errorMessage.set(
        this.i18n.translate('web.admin.ressources.feedback.loadFailure'),
      );
    } finally {
      this.loading.set(false);
    }
  }

  openCreateForm(): void {
    this.editingId.set(null);
    this.form.reset({
      title: '',
      description: '',
      resourceType: 'link',
      resourceTheme: 'training',
      resourceAudience: 'all',
      url: '',
      status: 'draft',
    });
    this.showForm.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  openEditForm(ressource: ResourceDto): void {
    this.editingId.set(ressource.id);
    this.form.reset({
      title: ressource.title,
      description: ressource.description ?? '',
      resourceType: ressource.resourceType,
      resourceTheme: ressource.resourceTheme,
      resourceAudience: ressource.resourceAudience,
      url: ressource.url ?? '',
      status: ressource.status,
    });
    this.showForm.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.form.reset();
  }

  async submitForm(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const values = this.form.getRawValue();

    try {
      const id = this.editingId();
      if (id === null) {
        const body: CreateResourceDto = {
          title: values.title,
          description: values.description || null,
          resourceType:
            values.resourceType as CreateResourceDto['resourceType'],
          resourceTheme:
            values.resourceTheme as CreateResourceDto['resourceTheme'],
          resourceAudience:
            values.resourceAudience as CreateResourceDto['resourceAudience'],
          url: values.url || null,
          filePath: null,
          status: values.status as CreateResourceDto['status'],
          publishedAt: null,
          programId: null,
          cohortId: null,
        };
        const created = await this.resourcesClient.create(body);
        this.ressources.update((list) => [...list, created]);
        this.successMessage.set(
          this.i18n.translate('web.admin.ressources.feedback.createSuccess', {
            title: created.title,
          }),
        );
      } else {
        const body: UpdateResourceDto = {
          title: values.title,
          description: values.description || null,
          resourceType:
            values.resourceType as CreateResourceDto['resourceType'],
          resourceTheme:
            values.resourceTheme as CreateResourceDto['resourceTheme'],
          resourceAudience:
            values.resourceAudience as CreateResourceDto['resourceAudience'],
          url: values.url || null,
          status: values.status as CreateResourceDto['status'],
        };
        const updated = await this.resourcesClient.update(id, body);
        this.ressources.update((list) =>
          list.map((r) => (r.id === id ? updated : r)),
        );
        this.successMessage.set(
          this.i18n.translate('web.admin.ressources.feedback.updateSuccess', {
            title: updated.title,
          }),
        );
      }
      this.showForm.set(false);
      this.editingId.set(null);
      this.form.reset();
    } catch (err) {
      console.error(
        '[AdminRessourcesPage] Erreur lors de la sauvegarde de la ressource',
        err,
      );
      this.errorMessage.set(
        this.i18n.translate('web.admin.ressources.feedback.saveFailure'),
      );
    } finally {
      this.submitting.set(false);
    }
  }

  async deleteRessource(ressource: ResourceDto): Promise<void> {
    if (
      !confirm(
        this.i18n.translate('web.admin.ressources.feedback.deleteConfirm', {
          title: ressource.title,
        }),
      )
    ) {
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      await this.resourcesClient.remove(ressource.id);
      this.ressources.update((list) =>
        list.filter((r) => r.id !== ressource.id),
      );
      this.successMessage.set(
        this.i18n.translate('web.admin.ressources.feedback.deleteSuccess', {
          title: ressource.title,
        }),
      );
    } catch (err) {
      console.error(
        '[AdminRessourcesPage] Erreur lors de la suppression de la ressource',
        err,
      );
      this.errorMessage.set(
        this.i18n.translate('web.admin.ressources.feedback.deleteFailure'),
      );
    }
  }
}
