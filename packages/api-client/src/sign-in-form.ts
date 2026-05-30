import { FormControl, FormGroup, Validators } from '@angular/forms';
import type { SignInRequestDto } from '@kraak/contracts';
import { logDebugError } from './console-debug.js';
import { resolveAuthErrorMessage } from './resolve-auth-error.js';

export interface SignInFormModel {
  email: FormControl<string>;
  password: FormControl<string>;
}

export function normalizeRequiredText(value: string): string {
  return value.trim();
}

export function normalizeTextControl(control: FormControl<string>): void {
  control.setValue(normalizeRequiredText(control.getRawValue()));
}

export function createSignInForm(): FormGroup<SignInFormModel> {
  return new FormGroup<SignInFormModel>({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
  });
}

export interface SubmitSignInFormOptions {
  form: FormGroup<SignInFormModel>;
  isSubmitting: () => boolean;
  setSubmitting: (value: boolean) => void;
  setErrorMessage: (message: string | null) => void;
  signIn: (body: SignInRequestDto) => Promise<unknown>;
  navigateAfterSuccess: () => Promise<boolean | void> | void;
  onSuccess?: () => void | Promise<void>;
  logContext: string;
  route: string;
  fallbackMessage?: string;
}

type SharedSubmitSignInOptions = Pick<
  SubmitSignInFormOptions,
  'form' | 'isSubmitting' | 'setSubmitting' | 'setErrorMessage' | 'signIn'
>;

export function createSharedSubmitSignInOptions(
  options: SharedSubmitSignInOptions,
): SharedSubmitSignInOptions {
  return options;
}

export async function submitSignInForm(
  options: SubmitSignInFormOptions,
): Promise<void> {
  normalizeTextControl(options.form.controls.email);
  options.form.markAllAsTouched();

  if (options.form.invalid || options.isSubmitting()) {
    return;
  }

  options.setSubmitting(true);
  options.setErrorMessage(null);

  try {
    const { email, password } = options.form.getRawValue();

    await options.signIn({
      email: normalizeRequiredText(email),
      password,
    });

    await options.onSuccess?.();
    await options.navigateAfterSuccess();
  } catch (error) {
    logDebugError(options.logContext, error, {
      route: options.route,
    });
    options.setErrorMessage(
      resolveAuthErrorMessage(
        error,
        options.fallbackMessage ??
          'Impossible de vous connecter pour le moment.',
      ),
    );
  } finally {
    options.setSubmitting(false);
  }
}
