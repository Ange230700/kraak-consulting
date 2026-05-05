import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonDirective } from 'primeng/button';
import { Message } from 'primeng/message';
import {
  WebAuthService,
  resolveAuthErrorMessage,
} from '../../core/auth/web-auth.service';
import { normalizeRequiredText, normalizeTextControl } from './auth-form.utils';

interface PasswordResetFormModel {
  email: FormControl<string>;
}

@Component({
  selector: 'kraak-web-password-reset-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ButtonDirective, Message],
  templateUrl: './password-reset.page.html',
})
export default class PasswordResetPage {
  private readonly authService = inject(WebAuthService);
  private readonly messageService = inject(MessageService);

  readonly form = new FormGroup<PasswordResetFormModel>({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly submitting = signal(false);

  async submit(): Promise<void> {
    normalizeTextControl(this.form.controls.email);
    this.form.markAllAsTouched();

    if (this.form.invalid || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    try {
      const { email } = this.form.getRawValue();
      const response = await this.authService.requestPasswordReset({
        email: normalizeRequiredText(email),
      });

      this.successMessage.set(response.message);
      this.messageService.add({
        severity: 'success',
        summary: 'R\u00E9initialisation',
        detail: response.message,
        life: 6000,
      });
    } catch (error) {
      this.errorMessage.set(
        resolveAuthErrorMessage(
          error,
          "Impossible d'envoyer l'email de reinitialisation.",
        ),
      );
    } finally {
      this.submitting.set(false);
    }
  }
}
