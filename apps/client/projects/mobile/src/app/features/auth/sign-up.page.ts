import { Component, inject, signal } from '@angular/core';
import {
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonButton } from '@ionic/angular/standalone';
import { PageShell } from '../../shared/page-shell/page-shell';
import {
  MOBILE_AUTH_CALLBACK_URL,
  MobileAuthService,
  resolveAuthErrorMessage,
} from './mobile-auth.service';

interface SignUpFormModel {
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  email: FormControl<string>;
  password: FormControl<string>;
  phone: FormControl<string>;
}

@Component({
  selector: 'kraak-sign-up-page',
  standalone: true,
  imports: [PageShell, ReactiveFormsModule, RouterLink, IonButton],
  templateUrl: './sign-up.page.html',
})
export default class SignUpPage {
  private readonly authService = inject(MobileAuthService);
  private readonly router = inject(Router);

  readonly form = new FormGroup<SignUpFormModel>({
    firstName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    lastName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
    phone: new FormControl('', {
      nonNullable: true,
    }),
  });
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly submitting = signal(false);

  async submit(): Promise<void> {
    normalizeTextControl(this.form.controls.firstName);
    normalizeTextControl(this.form.controls.lastName);
    normalizeTextControl(this.form.controls.email);
    normalizeTextControl(this.form.controls.phone);
    this.form.markAllAsTouched();

    if (this.form.invalid || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      const { email, firstName, lastName, password, phone } =
        this.form.getRawValue();
      const response = await this.authService.signUp({
        email: normalizeRequiredText(email),
        firstName: normalizeRequiredText(firstName),
        lastName: normalizeRequiredText(lastName),
        password,
        phone: normalizeOptionalText(phone),
        preferredContactChannel: null,
        redirectTo: MOBILE_AUTH_CALLBACK_URL,
      });

      if (response.session && response.profile) {
        await this.router.navigateByUrl('/tabs/accueil');
        return;
      }

      this.successMessage.set(response.message);
      this.form.controls.password.reset('');
    } catch (error) {
      this.errorMessage.set(
        resolveAuthErrorMessage(
          error,
          'Impossible de cr\u00E9er votre compte pour le moment.',
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

function normalizeOptionalText(value: string): string | null {
  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}

function normalizeTextControl(control: FormControl<string>): void {
  control.setValue(control.getRawValue().trim());
}
