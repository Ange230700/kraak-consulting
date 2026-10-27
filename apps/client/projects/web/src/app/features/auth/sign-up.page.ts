// apps\client\projects\web\src\app\features\auth\sign-up.page.ts

import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
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
interface SignUpFormModel {
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  email: FormControl<string>;
  password: FormControl<string>;
}

@Component({
  selector: 'kraak-web-sign-up-page',
  standalone: true,
  imports: [
    KraakTranslatePipe,
    ReactiveFormsModule,
    RouterLink,
    Button,
    Message,
  ],
  templateUrl: './sign-up.page.html',
})
export default class SignUpPage {
  private readonly i18n = inject(KraakI18nService);

  private readonly authService = inject(WebAuthService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);

  readonly form = new FormGroup<SignUpFormModel>({
    firstName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(80)],
    }),
    lastName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(80)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
  });
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly submitting = signal(false);

  async submit(): Promise<void> {
    normalizeTextControl(this.form.controls.firstName);
    normalizeTextControl(this.form.controls.lastName);
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
        successTitle: () => this.i18n.translate('web.auth.signUp.toastTitle'),
        fallbackError: () =>
          this.i18n.translate('web.auth.signUp.genericError'),
        debugContext: 'web.auth.sign-up.submit',
        route: '/inscription',
      },
      async () => {
        const { firstName, lastName, email, password } =
          this.form.getRawValue();

        const response = await this.authService.signUp({
          firstName: normalizeRequiredText(firstName),
          lastName: normalizeRequiredText(lastName),
          email: normalizeRequiredText(email),
          password,
          redirectTo: resolveWebRedirectUrl('/connexion', environment.siteUrl),
        });

        if (response.session && response.profile) {
          await this.router.navigateByUrl('/participant/dashboard');
          return;
        }

        return response.message;
      },
    );
  }
}
