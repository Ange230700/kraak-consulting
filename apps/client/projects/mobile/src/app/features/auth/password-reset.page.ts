import { Component, inject, signal } from '@angular/core';
import {
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonButton } from '@ionic/angular/standalone';
import { PageShell } from '../../shared/page-shell/page-shell';
import {
  MOBILE_AUTH_RESET_URL,
  MobileAuthService,
  resolveAuthErrorMessage,
} from './mobile-auth.service';

interface PasswordResetFormModel {
  email: FormControl<string>;
}

@Component({
  selector: 'kraak-password-reset-page',
  standalone: true,
  imports: [PageShell, ReactiveFormsModule, RouterLink, IonButton],
  templateUrl: './password-reset.page.html',
})
export default class PasswordResetPage {
  private readonly authService = inject(MobileAuthService);

  readonly form = new FormGroup<PasswordResetFormModel>({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly submitting = signal(false);

  async submit(): Promise<void> {
    normalizeTextControl(this.form.controls.email);
    this.form.markAllAsTouched();

    if (this.form.invalid || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      const { email } = this.form.getRawValue();
      const response = await this.authService.requestPasswordReset({
        email: normalizeRequiredText(email),
        redirectTo: MOBILE_AUTH_RESET_URL,
      });

      this.successMessage.set(response.message);
    } catch (error) {
      this.errorMessage.set(
        resolveAuthErrorMessage(
          error,
          "Impossible d'envoyer l'email de r\u00E9initialisation pour le moment.",
        ),
      );
    } finally {
      this.submitting.set(false);
    }
  }
}

function normalizeRequiredText(value: string): string {
  return value.trim();
}

function normalizeTextControl(control: FormControl<string>): void {
  control.setValue(normalizeRequiredText(control.getRawValue()));
}
