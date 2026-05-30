import { Component, inject, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  createSharedSubmitSignInOptions,
  createSignInForm,
  submitSignInForm,
} from '@kraak/api-client';
import { MessageService } from 'primeng/api';
import { ButtonDirective } from 'primeng/button';
import { Message } from 'primeng/message';
import { WebAuthService } from '../../core/auth/web-auth.service';

@Component({
  selector: 'kraak-web-sign-in-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ButtonDirective, Message],
  templateUrl: './sign-in.page.html',
})
export default class SignInPage {
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
      navigateAfterSuccess: () =>
        this.router.navigateByUrl('/participant/dashboard'),
      onSuccess: () => {
        this.messageService.add({
          key: 'app-feedback',
          severity: 'success',
          summary: 'Connexion',
          detail: 'Connexion réussie. Redirection vers votre dashboard.',
          life: 4500,
        });
      },
      logContext: 'web.auth.sign-in.submit',
      route: '/connexion',
    });
  }
}
