import { NgClass } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
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

interface ProgramFormModel {
  slug: FormControl<string>;
  title: FormControl<string>;
  summary: FormControl<string>;
  description: FormControl<string>;
  status: FormControl<string>;
  visibility: FormControl<string>;
}

@Component({
  selector: 'kraak-admin-programmes-page',
  standalone: true,
  imports: [NgClass, ReactiveFormsModule, RouterLink, ButtonDirective, Message],
  templateUrl: './admin-programmes.page.html',
})
export default class AdminProgrammesPage implements OnInit {
  private readonly authService = inject(WebAuthService);
  programsClient: Pick<
    ApiClient['programs'],
    'list' | 'create' | 'update' | 'remove'
  > = createApiClient({
    baseUrl: resolveApiBaseUrl(environment.apiBaseUrl),
    getAuthToken: () => this.authService.currentSession()?.accessToken ?? null,
  }).programs;

  protected readonly programmes = signal<ProgramDto[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly showForm = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly submitting = signal(false);

  protected readonly isEditing = computed(() => this.editingId() !== null);

  readonly publicationStatuses = Object.values(PublicationStatus);
  readonly programVisibilities = Object.values(ProgramVisibility);

  readonly form = new FormGroup<ProgramFormModel>({
    slug: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)],
    }),
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    summary: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    status: new FormControl('draft', {
      nonNullable: true,
      validators: [Validators.required],
    }),
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
        'Impossible de charger les programmes. Vérifiez la connexion et réessayez.',
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
          `Programme « ${created.title} » créé avec succès.`,
        );
      } else {
        const updated = await this.programsClient.update(id, payload);
        this.programmes.update((list) =>
          list.map((p) => (p.id === id ? updated : p)),
        );
        this.successMessage.set(
          `Programme « ${updated.title} » mis à jour avec succès.`,
        );
      }
      this.cancelForm();
    } catch (err) {
      console.error(
        '[AdminProgrammesPage] Erreur lors de la sauvegarde du programme',
        err,
      );
      this.errorMessage.set(
        'Une erreur est survenue lors de la sauvegarde. Vérifiez les champs et réessayez.',
      );
    } finally {
      this.submitting.set(false);
    }
  }

  async deleteProgramme(programme: ProgramDto): Promise<void> {
    const shouldDelete = confirm(
      `Supprimer le programme « ${programme.title} » ? Cette action est irréversible.`,
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
      this.successMessage.set(`Programme « ${programme.title} » supprimé.`);
    } catch (err) {
      console.error(
        '[AdminProgrammesPage] Erreur lors de la suppression du programme',
        err,
      );
      this.errorMessage.set('Impossible de supprimer ce programme. Réessayez.');
    }
  }
}
