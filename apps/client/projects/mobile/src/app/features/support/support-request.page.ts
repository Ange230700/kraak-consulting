import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { IonButton, IonSelectOption } from '@ionic/angular/standalone';
import type { SupportCategoryValue } from '@kraak/contracts';
import { ApiError } from '@kraak/api-client';
import { PageShell } from '../../shared/page-shell/page-shell';
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
  imports: [PageShell, ReactiveFormsModule, IonButton, IonSelectOption],
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
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly categoryOptions: { value: SupportCategoryValue; label: string }[] = [
    { value: 'technical', label: 'Problème technique' },
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
    this.successMessage.set(null);
    this.errorMessage.set(null);

    try {
      const result = await this.supportService.submitContactForm(
        this.form.getRawValue(),
      );

      this.successMessage.set(result.message);
      this.form.reset({ category: 'other' });

      await this.router.navigateByUrl('/tabs/support');
    } catch (error) {
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
  if (error instanceof ApiError && error.status === 400) {
    return 'Les informations saisies sont invalides. Veuillez vérifier le formulaire.';
  }
  return 'Une erreur est survenue. Veuillez réessayer ultérieurement.';
}
