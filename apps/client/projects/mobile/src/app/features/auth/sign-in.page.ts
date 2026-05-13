import { Component, inject, signal } from '@angular/core';
import {
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonButton } from '@ionic/angular/standalone';
import { logDebugError } from '@kraak/api-client';
import { PageShell } from '../../shared/page-shell/page-shell.component';
import {
  MobileAuthService,
  resolveAuthErrorMessage,
} from './mobile-auth.service';
import { normalizeRequiredText, normalizeTextControl } from './auth-form.utils';

interface SignInFormModel {
  email: FormControl<string>;
  password: FormControl<string>;
}

@Component({
  selector: 'kraak-sign-in-page',
  standalone: true,
  imports: [PageShell, ReactiveFormsModule, RouterLink, IonButton],
  templateUrl: './sign-in.page.html',
})
export default class SignInPage {
  private readonly authService = inject(MobileAuthService);
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

      await this.router.navigateByUrl('/tabs/accueil');
    } catch (error) {
      logDebugError('mobile.auth.sign-in.submit', error, {
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
