import { NgClass } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { createApiClient, type ApiClient } from '@kraak/api-client';
import type { CreateProgramDto, ProgramDto } from '@kraak/contracts';
import { PublicationStatus, ProgramVisibility } from '@kraak/contracts';
import { ButtonDirective } from 'primeng/button';
import { Message } from 'primeng/message';

import { environment } from '../../../../environments/environment';
import { resolveApiBaseUrl } from '../../../core/runtime/runtime-config';
import { WebAuthService } from '../../../core/auth/web-auth.service';
import { AdminEditorState } from '../admin-editor-state';
import {
  createPublicationControls,
  type PublicationFormModel,
} from '../publication-form.utils';

import {
  KraakI18nService,
  KraakTranslatePipe,
} from '../../../../../../shared/i18n';
interface ProgramFormModel extends PublicationFormModel {
  visibility: FormControl<string>;
}

@Component({
  selector: 'kraak-admin-programmes-page',
  standalone: true,
  imports: [
    NgClass,
    ReactiveFormsModule,
    RouterLink,
    ButtonDirective,
    Message,
    KraakTranslatePipe,
  ],
  templateUrl: './admin-programmes.page.html',
})
export default class AdminProgrammesPage
  extends AdminEditorState
  implements OnInit
{
  private readonly authService = inject(WebAuthService);
  private readonly i18n = inject(KraakI18nService);

  programsClient: Pick<
    ApiClient['programs'],
    'list' | 'create' | 'update' | 'remove'
  > = createApiClient({
    getLocale: () => this.i18n.locale(),
    baseUrl: resolveApiBaseUrl(environment.apiBaseUrl),
    getAuthToken: () => this.authService.currentSession()?.accessToken ?? null,
  }).programs;

  protected readonly programmes = signal<ProgramDto[]>([]);

  protected getPublicationStatusLabel(status: string): string {
    const key = `web.admin.programmes.statuses.${status}`;
    const translated = this.i18n.translate(key);

    return translated === key ? status : translated;
  }

  protected getProgramVisibilityLabel(visibility: string): string {
    const key = `web.admin.programmes.visibilities.${visibility}`;
    const translated = this.i18n.translate(key);

    return translated === key ? visibility : translated;
  }

  protected getEditAriaLabel(programme: ProgramDto): string {
    return this.i18n.translate('web.admin.programmes.actions.editAria', {
      title: programme.title,
    });
  }

  protected getDeleteAriaLabel(programme: ProgramDto): string {
    return this.i18n.translate('web.admin.programmes.actions.deleteAria', {
      title: programme.title,
    });
  }

  readonly publicationStatuses = Object.values(PublicationStatus);
  readonly programVisibilities = Object.values(ProgramVisibility);

  readonly form = new FormGroup<ProgramFormModel>({
    ...createPublicationControls(),
    visibility: new FormControl('private', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  ngOnInit(): void {
    void this.loadProgrammes();
  }

  async loadProgrammes(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      const list = await this.programsClient.list();
      this.programmes.set(list);
    } catch (err) {
      console.error(
        '[AdminProgrammesPage] Erreur lors du chargement des programmes',
        err,
      );
      this.errorMessage.set(
        this.i18n.translate('web.admin.programmes.feedback.loadFailure'),
      );
    } finally {
      this.loading.set(false);
    }
  }

  openCreateForm(): void {
    this.editingId.set(null);
    this.form.reset({
      slug: '',
      title: '',
      summary: '',
      description: '',
      status: 'draft',
      visibility: 'private',
    });
    this.showForm.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  openEditForm(programme: ProgramDto): void {
    this.editingId.set(programme.id);
    this.form.reset({
      slug: programme.slug,
      title: programme.title,
      summary: programme.summary,
      description: programme.description,
      status: programme.status,
      visibility: programme.visibility,
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

  private buildProgramPayload(): CreateProgramDto {
    const values = this.form.getRawValue();

    return {
      slug: values.slug,
      title: values.title,
      summary: values.summary,
      description: values.description,
      status: values.status as CreateProgramDto['status'],
      visibility: values.visibility as CreateProgramDto['visibility'],
    };
  }

  async submitForm(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    const payload = this.buildProgramPayload();

    try {
      const id = this.editingId();
      if (id === null) {
        const created = await this.programsClient.create(payload);
        this.programmes.update((list) => [...list, created]);
        this.successMessage.set(
          this.i18n.translate('web.admin.programmes.feedback.createSuccess', {
            title: created.title,
          }),
        );
      } else {
        const updated = await this.programsClient.update(id, payload);
        this.programmes.update((list) =>
          list.map((p) => (p.id === id ? updated : p)),
        );
        this.successMessage.set(
          this.i18n.translate('web.admin.programmes.feedback.updateSuccess', {
            title: updated.title,
          }),
        );
      }
      this.cancelForm();
    } catch (err) {
      console.error(
        '[AdminProgrammesPage] Erreur lors de la sauvegarde du programme',
        err,
      );
      this.errorMessage.set(
        this.i18n.translate('web.admin.programmes.feedback.saveFailure'),
      );
    } finally {
      this.submitting.set(false);
    }
  }

  async deleteProgramme(programme: ProgramDto): Promise<void> {
    const shouldDelete = confirm(
      this.i18n.translate('web.admin.programmes.feedback.deleteConfirm', {
        title: programme.title,
      }),
    );
    if (shouldDelete === false) {
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      await this.programsClient.remove(programme.id);
      this.programmes.update((list) =>
        list.filter((p) => p.id !== programme.id),
      );
      this.successMessage.set(
        this.i18n.translate('web.admin.programmes.feedback.deleteSuccess', {
          title: programme.title,
        }),
      );
    } catch (err) {
      console.error(
        '[AdminProgrammesPage] Erreur lors de la suppression du programme',
        err,
      );
      this.errorMessage.set(
        this.i18n.translate('web.admin.programmes.feedback.deleteFailure'),
      );
    }
  }
}
