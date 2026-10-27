import type { WritableSignal } from '@angular/core';
import { logDebugError } from '@kraak/api-client';
import type { MessageService } from 'primeng/api';
import { resolveAuthErrorMessage } from '../../core/auth/web-auth.service';

interface AuthSubmissionOptions {
  submitting: WritableSignal<boolean>;
  successMessage: WritableSignal<string | null>;
  errorMessage: WritableSignal<string | null>;
  messageService: MessageService;
  successTitle(): string;
  fallbackError(): string;
  debugContext: string;
  route: string;
}

export async function runAuthSubmission(
  options: AuthSubmissionOptions,
  request: () => Promise<string | undefined>,
): Promise<void> {
  options.submitting.set(true);
  options.successMessage.set(null);
  options.errorMessage.set(null);

  try {
    const message = await request();
    if (message !== undefined) {
      options.successMessage.set(message);
      options.messageService.add({
        key: 'app-feedback',
        severity: 'success',
        summary: options.successTitle(),
        detail: message,
        life: 6000,
      });
    }
  } catch (error) {
    logDebugError(options.debugContext, error, { route: options.route });
    options.errorMessage.set(
      resolveAuthErrorMessage(error, options.fallbackError()),
    );
  } finally {
    options.submitting.set(false);
  }
}
