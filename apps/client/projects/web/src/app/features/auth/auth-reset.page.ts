import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { logDebugError } from '@kraak/api-client';
import { MessageService } from 'primeng/api';
import { ButtonDirective } from 'primeng/button';
import { Message } from 'primeng/message';
import {
  WebAuthService,
  resolveAuthErrorMessage,
} from '../../core/auth/web-auth.service';

interface AuthResetFormModel {
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
}

@Component({
  selector: 'kraak-web-auth-reset-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ButtonDirective, Message],
  templateUrl: './auth-reset.page.html',
})
export default class AuthResetPage implements OnInit {
  private readonly authService = inject(WebAuthService);
  private readonly messageService = inject(MessageService);

  readonly form = new FormGroup<AuthResetFormModel>({
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
    confirmPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
  });

  readonly recoveryToken = signal<string | null>(null);
  readonly tokenReady = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly submitting = signal(false);

  ngOnInit(): void {
    void this.initializeRecoveryContext();
  }

  private async initializeRecoveryContext(): Promise<void> {
    try {
      const token = await this.authService.resolveRecoveryAccessTokenFromUrl();
      this.recoveryToken.set(token);

      if (!token) {
        this.errorMessage.set(
          'Le lien de réinitialisation est invalide ou expiré. Demandez un nouveau lien.',
        );
      }

      this.clearSensitiveUrlFragments();
    } catch (error) {
      logDebugError('web.auth.reset.init', error, {
        route: '/auth/reset',
      });
      this.errorMessage.set(
        resolveAuthErrorMessage(
          error,
          'Impossible de préparer la réinitialisation du mot de passe.',
        ),
      );
    } finally {
      this.tokenReady.set(true);
    }
  }

  async submit(): Promise<void> {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.submitting()) {
      return;
    }

    if (!this.recoveryToken()) {
      this.errorMessage.set(
        'Le lien de réinitialisation est invalide ou expiré. Demandez un nouveau lien.',
      );
      return;
    }

    const { password, confirmPassword } = this.form.getRawValue();

    if (password !== confirmPassword) {
      this.errorMessage.set('Les deux mots de passe doivent être identiques.');
      return;
    }

    this.submitting.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    const token = this.recoveryToken();

    if (!token) {
      this.errorMessage.set(
        'Le lien de réinitialisation est invalide ou expiré. Demandez un nouveau lien.',
      );
      return;
    }

    try {
      const response = await this.authService.completePasswordRecovery({
        accessToken: token,
        newPassword: password,
      });

      this.successMessage.set(response.message);
      this.messageService.add({
        key: 'app-feedback',
        severity: 'success',
        summary: 'Mot de passe mis à jour',
        detail: response.message,
        life: 6000,
      });

      this.form.reset({
        password: '',
        confirmPassword: '',
      });
    } catch (error) {
      logDebugError('web.auth.reset.submit', error, {
        route: '/auth/reset',
      });
      this.errorMessage.set(
        resolveAuthErrorMessage(
          error,
          'Impossible de mettre à jour votre mot de passe.',
        ),
      );
    } finally {
      this.submitting.set(false);
    }
  }

  private clearSensitiveUrlFragments(): void {
    const browserWindow = globalThis.window;

    if (!browserWindow) {
      return;
    }

    const currentUrl = new URL(browserWindow.location.href);
    currentUrl.hash = '';

    // Remove recovery parameters from browser history to avoid token leakage.
    currentUrl.searchParams.delete('access_token');
    currentUrl.searchParams.delete('refresh_token');
    currentUrl.searchParams.delete('token_type');
    currentUrl.searchParams.delete('expires_in');
    currentUrl.searchParams.delete('expires_at');
    currentUrl.searchParams.delete('type');
    currentUrl.searchParams.delete('token_hash');

    browserWindow.history.replaceState({}, '', currentUrl.toString());
  }
}
