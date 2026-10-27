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
import { environment } from '../../../environments/environment';
import { WebAuthService } from '../../core/auth/web-auth.service';
import { runAuthSubmission } from './auth-submission.utils';
import {
  normalizeRequiredText,
  normalizeTextControl,
  resolveWebRedirectUrl,
} from './auth-form.utils';

import {
  KraakI18nService,
  KraakTranslatePipe,
} from '../../../../../shared/i18n';
interface PasswordResetFormModel {
  email: FormControl<string>;
}

@Component({
  selector: 'kraak-web-password-reset-page',
  standalone: true,
  imports: [
    KraakTranslatePipe,
    ReactiveFormsModule,
    RouterLink,
    ButtonDirective,
    Message,
  ],
  templateUrl: './password-reset.page.html',
})
export default class PasswordResetPage {
  private readonly i18n = inject(KraakI18nService);

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

    await runAuthSubmission(
      {
        submitting: this.submitting,
        successMessage: this.successMessage,
        errorMessage: this.errorMessage,
        messageService: this.messageService,
        successTitle: () =>
          this.i18n.translate('web.auth.forgotPassword.toastTitle'),
        fallbackError: () =>
          this.i18n.translate('web.auth.forgotPassword.genericError'),
        debugContext: 'web.auth.password-reset.submit',
        route: '/mot-de-passe-oublie',
      },
      async () => {
        const { email } = this.form.getRawValue();
        const response = await this.authService.requestPasswordReset({
          email: normalizeRequiredText(email),
          redirectTo: resolveWebRedirectUrl('/auth/reset', environment.siteUrl),
        });

        return response.message;
      },
    );
  }
}
