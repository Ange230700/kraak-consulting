import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { createApiClient } from '@kraak/api-client';
import type { AppUserDto, UpdateAppUserDto } from '@kraak/contracts';
import { MessageService } from 'primeng/api';
import { ButtonDirective } from 'primeng/button';
import { Message } from 'primeng/message';

import { environment } from '../../../../environments/environment';
import { resolveApiBaseUrl } from '../../../core/runtime/runtime-config';
import { WebAuthService } from '../../../core/auth/web-auth.service';

const ROLE_LABELS: Record<string, string> = {
  participant: 'Participant',
  admin: 'Administrateur',
  trainer: 'Formateur',
};

@Component({
  selector: 'kraak-admin-user-list-page',
  standalone: true,
  imports: [RouterLink, ButtonDirective, Message],
  templateUrl: './admin-user-list.page.html',
})
export default class AdminUserListPage implements OnInit {
  private readonly authService = inject(WebAuthService);
  private readonly messageService = inject(MessageService);

  private readonly usersClient = createApiClient({
    baseUrl: resolveApiBaseUrl(environment.apiBaseUrl),
    getAuthToken: () => this.authService.currentSession()?.accessToken ?? null,
  }).users;

  protected readonly users = signal<AppUserDto[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly searchQuery = signal('');

  protected readonly filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.users();
    return this.users().filter(
      (u) =>
        u.firstName.toLowerCase().includes(query) ||
        u.lastName.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.role.toLowerCase().includes(query),
    );
  });

  protected readonly editingUser = signal<AppUserDto | null>(null);
  protected readonly userToDelete = signal<AppUserDto | null>(null);
  protected readonly submitting = signal(false);

  protected readonly editForm = signal<Partial<UpdateAppUserDto>>({});

  readonly roleLabels = ROLE_LABELS;
  readonly availableRoles = ['participant', 'admin', 'trainer'] as const;

  ngOnInit(): void {
    void this.loadUsers();
  }

  async loadUsers(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      const list = await this.usersClient.list();
      this.users.set(list);
    } catch (err) {
      console.error(
        '[AdminUserListPage] Erreur lors du chargement des utilisateurs',
        err,
      );
      this.errorMessage.set(
        'Impossible de charger la liste des utilisateurs. Vérifiez la connexion et réessayez.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  getRoleLabel(role: string): string {
    return ROLE_LABELS[role] ?? role;
  }

  openEdit(user: AppUserDto): void {
    this.editingUser.set(user);
    this.editForm.set({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      phone: user.phone ?? '',
      isActive: user.isActive,
    });
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  closeEdit(): void {
    this.editingUser.set(null);
    this.editForm.set({});
  }

  updateEditField(field: keyof UpdateAppUserDto, value: unknown): void {
    this.editForm.update((current) => ({ ...current, [field]: value }));
  }

  async saveEdit(): Promise<void> {
    const user = this.editingUser();
    if (!user) return;

    this.submitting.set(true);
    this.errorMessage.set(null);
    try {
      const updated = await this.usersClient.update(user.id, this.editForm());
      this.users.update((list) =>
        list.map((u) => (u.id === updated.id ? updated : u)),
      );
      this.closeEdit();
      this.successMessage.set('Utilisateur mis à jour avec succès.');
      this.messageService.add({
        key: 'app-feedback',
        severity: 'success',
        summary: 'Mis à jour',
        detail: 'Utilisateur mis à jour avec succès.',
      });
    } catch (err) {
      console.error('[AdminUserListPage] Erreur lors de la mise à jour', err);
      this.errorMessage.set("Impossible de mettre à jour l'utilisateur.");
    } finally {
      this.submitting.set(false);
    }
  }

  requestDelete(user: AppUserDto): void {
    this.userToDelete.set(user);
  }

  cancelDelete(): void {
    this.userToDelete.set(null);
  }

  async confirmDelete(): Promise<void> {
    const user = this.userToDelete();
    if (!user) return;

    this.submitting.set(true);
    this.errorMessage.set(null);
    try {
      await this.usersClient.remove(user.id);
      this.users.update((list) => list.filter((u) => u.id !== user.id));
      this.userToDelete.set(null);
      this.successMessage.set('Utilisateur supprimé avec succès.');
      this.messageService.add({
        key: 'app-feedback',
        severity: 'success',
        summary: 'Supprimé',
        detail: 'Utilisateur supprimé avec succès.',
      });
    } catch (err) {
      console.error('[AdminUserListPage] Erreur lors de la suppression', err);
      this.errorMessage.set("Impossible de supprimer l'utilisateur.");
      this.userToDelete.set(null);
    } finally {
      this.submitting.set(false);
    }
  }
}
