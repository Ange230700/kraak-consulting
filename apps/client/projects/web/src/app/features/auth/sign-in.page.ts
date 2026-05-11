import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { logDebugError } from '@kraak/api-client';
import { MessageService } from 'primeng/api';
import { ButtonDirective } from 'primeng/button';
import { Message } from 'primeng/message';
import {
  WebAuthService,
  resolveAuthErrorMessage,
} from '../../core/auth/web-auth.service';
import { normalizeRequiredText, normalizeTextControl } from './auth-form.utils';

interface SignInFormModel {
  email: FormControl<string>;
  password: FormControl<string>;
}

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

  readonly form = new FormGroup<SignInFormModel>({
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
  readonly submitting = signal(false);

  async submit(): Promise<void> {
    normalizeTextControl(this.form.controls.email);
    this.form.markAllAsTouched();

    if (this.form.invalid || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    try {
      const { email, password } = this.form.getRawValue();

      await this.authService.signIn({
        email: normalizeRequiredText(email),
        password,
      });

      this.messageService.add({
        key: 'app-feedback',
        severity: 'success',
        summary: 'Connexion',
        detail: 'Connexion réussie. Redirection vers votre dashboard.',
        life: 4500,
      });
      await this.router.navigateByUrl('/participant/dashboard');
    } catch (error) {
      logDebugError('web.auth.sign-in.submit', error, {
        route: '/connexion',
      });
      this.errorMessage.set(
        resolveAuthErrorMessage(
          error,
          'Impossible de vous connecter pour le moment.',
        ),
      );
    } finally {
      this.submitting.set(false);
    }
  }
}
