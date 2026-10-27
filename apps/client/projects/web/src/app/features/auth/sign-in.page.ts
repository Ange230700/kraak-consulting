// apps\client\projects\web\src\app\features\auth\sign-in.page.ts

import { Component, inject, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  createSharedSubmitSignInOptions,
  createSignInForm,
  submitSignInForm,
} from '@kraak/api-client';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { WebAuthService } from '../../core/auth/web-auth.service';

import {
  KraakI18nService,
  KraakTranslatePipe,
} from '../../../../../shared/i18n';
@Component({
  selector: 'kraak-web-sign-in-page',
  standalone: true,
  imports: [
    KraakTranslatePipe,
    ReactiveFormsModule,
    RouterLink,
    Button,
    Message,
  ],
  templateUrl: './sign-in.page.html',
})
export default class SignInPage {
  private readonly i18n = inject(KraakI18nService);

  private readonly authService = inject(WebAuthService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);

  readonly form = createSignInForm();
  readonly templateFormGroup = this.form as unknown as FormGroup;
  readonly errorMessage = signal<string | null>(null);
  readonly submitting = signal(false);
  private readonly submitSignInSharedOptions = createSharedSubmitSignInOptions({
    form: this.form,
    isSubmitting: this.submitting,
    setSubmitting: this.submitting.set,
    setErrorMessage: this.errorMessage.set,
    signIn: this.authService.signIn.bind(this.authService),
  });

  async submit(): Promise<void> {
    await submitSignInForm({
      ...this.submitSignInSharedOptions,
      navigateAfterSuccess: async () => {
        const result = await this.router.navigateByUrl(
          '/participant/dashboard',
        );

        console.log('[SignInPage] dashboard navigation result', {
          result,
          currentUrl: this.router.url,
        });

        return result;
      },
      onSuccess: () => {
        this.messageService.add({
          key: 'app-feedback',
          severity: 'success',
          summary: this.i18n.translate('web.auth.signIn.toastTitle'),
          detail: this.i18n.translate('web.auth.signIn.toastSuccess'),
          life: 4500,
        });
      },
      logContext: 'web.auth.sign-in.submit',
      route: '/connexion',
    });
  }
}
