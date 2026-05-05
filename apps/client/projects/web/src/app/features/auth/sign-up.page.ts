import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonDirective } from 'primeng/button';
import { Message } from 'primeng/message';
import {
  WebAuthService,
  resolveAuthErrorMessage,
} from '../../core/auth/web-auth.service';
import { normalizeRequiredText, normalizeTextControl } from './auth-form.utils';

interface SignUpFormModel {
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  email: FormControl<string>;
  password: FormControl<string>;
}

@Component({
  selector: 'kraak-web-sign-up-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ButtonDirective, Message],
  templateUrl: './sign-up.page.html',
})
export default class SignUpPage {
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

    this.submitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      const { firstName, lastName, email, password } = this.form.getRawValue();

      const response = await this.authService.signUp({
        firstName: normalizeRequiredText(firstName),
        lastName: normalizeRequiredText(lastName),
        email: normalizeRequiredText(email),
        password,
      });

      if (response.session && response.profile) {
        await this.router.navigateByUrl('/participant/dashboard');
        return;
      }

      this.successMessage.set(response.message);
      this.messageService.add({
        severity: 'success',
        summary: 'Inscription',
        detail: response.message,
        life: 6000,
      });
    } catch (error) {
      this.errorMessage.set(
        resolveAuthErrorMessage(
          error,
          'Impossible de creer le compte pour le moment.',
        ),
      );
    } finally {
      this.submitting.set(false);
    }
  }
}
