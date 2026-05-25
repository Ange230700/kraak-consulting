import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { Message } from 'primeng/message';
import { createApiClient } from '@kraak/api-client';
import type { CreateAppUserDto } from '@kraak/contracts';

import { environment } from '../../../../../environments/environment';
import { resolveApiBaseUrl } from '../../../../core/runtime/runtime-config';
import { WebAuthService } from '../../../../core/auth/web-auth.service';
import { UserFormStateService } from '../user-form-state.service';

@Component({
  selector: 'kraak-account-status-step-page',
  standalone: true,
  imports: [FormsModule, ButtonDirective, Message],
  templateUrl: './account-status.page.html',
})
export default class AccountStatusPage implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(WebAuthService);
  private readonly messageService = inject(MessageService);
  protected readonly formState = inject(UserFormStateService);

  private readonly usersClient = createApiClient({
    baseUrl: resolveApiBaseUrl(environment.apiBaseUrl),
    getAuthToken: () => this.authService.currentSession()?.accessToken ?? null,
  }).users;

  protected isActive = true;
  protected sendInvitation = true;
  protected submitting = false;
  protected errorMessage: string | null = null;

  ngOnInit(): void {
    const s = this.formState.state();
    this.isActive = s.isActive;
    this.sendInvitation = s.sendInvitation;
  }

  protected sync(): void {
    this.formState.patch({
      isActive: this.isActive,
      sendInvitation: this.sendInvitation,
    });
  }

  protected goPrev(): void {
    this.sync();
    void this.router.navigate(['/admin/utilisateurs/create/authorization']);
  }

  async handleSubmit(): Promise<void> {
    this.sync();
    const state = this.formState.state();

    if (!this.formState.isStep1Valid() || !this.formState.isStep2Valid()) {
      this.errorMessage = 'Veuillez compléter toutes les étapes obligatoires.';
      return;
    }

    const payload: CreateAppUserDto = {
      email: state.email,
      firstName: state.firstName,
      lastName: state.lastName,
      role: state.role as CreateAppUserDto['role'],
      phone: state.phone || null,
      preferredContactChannel: state.preferredContactChannel || null,
      isActive: state.isActive,
    };

    this.submitting = true;
    this.errorMessage = null;
    try {
      await this.usersClient.create(payload);
      this.formState.reset();
      this.messageService.add({
        severity: 'success',
        summary: 'Invitation envoyée',
        detail: `L'invitation a été envoyée à ${payload.email}.`,
      });
      await this.router.navigate(['/admin/utilisateurs/list']);
    } catch (err) {
      console.error("[AccountStatusPage] Erreur lors de l'invitation", err);
      this.errorMessage =
        "Impossible d'envoyer l'invitation. Vérifiez les données et réessayez.";
    } finally {
      this.submitting = false;
    }
  }
}
