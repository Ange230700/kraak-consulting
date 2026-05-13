import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { IonButton } from '@ionic/angular/standalone';
import type { SupportCategoryValue } from '@kraak/contracts';
import { ApiError, logDebugError } from '@kraak/api-client';
import { PageShell } from '../../shared/page-shell/page-shell.component';
import { MobileSupportService } from './mobile-support.service';

interface SupportRequestFormModel {
  name: FormControl<string>;
  email: FormControl<string>;
  subject: FormControl<string>;
  message: FormControl<string>;
  category: FormControl<SupportCategoryValue>;
}

@Component({
  selector: 'kraak-support-request-page',
  standalone: true,
  imports: [PageShell, ReactiveFormsModule, IonButton],
  templateUrl: './support-request.page.html',
})
export default class SupportRequestPage {
  private readonly supportService = inject(MobileSupportService);
  private readonly router = inject(Router);

  readonly form = new FormGroup<SupportRequestFormModel>({
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(80),
      ],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    subject: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(120),
      ],
    }),
    message: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(2000),
      ],
    }),
    category: new FormControl<SupportCategoryValue>('other', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly categoryOptions: { value: SupportCategoryValue; label: string }[] = [
    { value: 'technical', label: 'Probl\u00E8me technique' },
    { value: 'program', label: 'Question sur un programme' },
    { value: 'session', label: 'Question sur une session' },
    { value: 'billing', label: 'Facturation' },
    { value: 'other', label: 'Autre' },
  ];

  async submit(): Promise<void> {
    normalizeTextControls(this.form);
    this.form.markAllAsTouched();

    if (this.form.invalid || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    try {
      await this.supportService.submitContactForm(this.form.getRawValue());

      this.form.reset({ category: 'other' });

      await this.router.navigateByUrl('/tabs/support');
    } catch (error) {
      logDebugError('mobile.support.submit', error, {
        route: '/tabs/support/request',
      });
      this.errorMessage.set(resolveSupportErrorMessage(error));
    } finally {
      this.submitting.set(false);
    }
  }
}

function normalizeTextControls(
  form: FormGroup<{
    name: FormControl<string>;
    email: FormControl<string>;
    subject: FormControl<string>;
    message: FormControl<string>;
    category: FormControl<SupportCategoryValue>;
  }>,
): void {
  const { name, email, subject, message } = form.controls;
  name.setValue(name.getRawValue().trim());
  email.setValue(email.getRawValue().trim());
  subject.setValue(subject.getRawValue().trim());
  message.setValue(message.getRawValue().trim());
}

function resolveSupportErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const body = error.body as
      | {
          message?: unknown;
          errors?: unknown;
        }
      | undefined;

    const message = readSupportErrorBody(body);

    if (message !== null) {
      return message;
    }

    if (typeof error.message === 'string' && error.message.trim() !== '') {
      return error.message.trim();
    }

    if (error.status === 400) {
      return 'Les informations saisies sont invalides. Veuillez v\u00E9rifier le formulaire.';
    }
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string' &&
    error.message.trim() !== ''
  ) {
    return error.message.trim();
  }

  return 'Une erreur est survenue. Veuillez r\u00E9essayer ult\u00E9rieurement.';
}

function readSupportErrorBody(
  body:
    | {
        message?: unknown;
        errors?: unknown;
      }
    | undefined,
): string | null {
  if (typeof body?.message === 'string' && body.message.trim() !== '') {
    return body.message.trim();
  }

  if (typeof body?.errors === 'string' && body.errors.trim() !== '') {
    return body.errors.trim();
  }

  if (Array.isArray(body?.errors)) {
    const messages = body.errors
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.trim())
      .filter((value) => value !== '');

    if (messages.length > 0) {
      return messages.join('\n');
    }
  }

  if (body?.errors && typeof body.errors === 'object') {
    const messages = Object.values(body.errors)
      .flatMap((value) => {
        if (typeof value === 'string') {
          return [value];
        }

        if (Array.isArray(value)) {
          return value.filter(
            (item): item is string => typeof item === 'string',
          );
        }

        return [];
      })
      .map((value) => value.trim())
      .filter((value) => value !== '');

    if (messages.length > 0) {
      return messages.join('\n');
    }
  }

  return null;
}
