import { signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runAuthSubmission } from './auth-submission.utils';

describe('runAuthSubmission', () => {
  afterEach(() => vi.restoreAllMocks());

  function createOptions() {
    return {
      submitting: signal(false),
      successMessage: signal<string | null>('Ancien succès'),
      errorMessage: signal<string | null>('Ancienne erreur'),
      messageService: new MessageService(),
      successTitle: () => 'Confirmation',
      fallbackError: () => 'Une erreur est survenue.',
      debugContext: 'web.auth.test.submit',
      route: '/inscription',
    };
  }

  it('Given une demande réussie, When elle est exécutée, Then les messages sont réinitialisés et la confirmation est affichée', async () => {
    const options = createOptions();
    const add = vi.spyOn(options.messageService, 'add');
    await runAuthSubmission(options, async () => {
      expect(options.submitting()).toBe(true);
      expect(options.successMessage()).toBeNull();
      expect(options.errorMessage()).toBeNull();
      return 'Demande reçue.';
    });
    expect(options.successMessage()).toBe('Demande reçue.');
    expect(options.submitting()).toBe(false);
    expect(add).toHaveBeenCalledWith({
      key: 'app-feedback',
      severity: 'success',
      summary: 'Confirmation',
      detail: 'Demande reçue.',
      life: 6000,
    });
  });

  it('Given une redirection réussie, When aucune confirmation locale ne reste à afficher, Then aucun toast ne paraît', async () => {
    const options = createOptions();
    const add = vi.spyOn(options.messageService, 'add');
    await runAuthSubmission(options, async () => undefined);
    expect(add).not.toHaveBeenCalled();
    expect(options.successMessage()).toBeNull();
    expect(options.submitting()).toBe(false);
  });

  it('Given une langue modifiée pendant la demande, When la confirmation arrive, Then son titre utilise la langue courante', async () => {
    const options = createOptions();
    let title = 'Confirmation initiale';
    options.successTitle = () => title;
    const add = vi.spyOn(options.messageService, 'add');
    await runAuthSubmission(options, async () => {
      title = 'Confirmation courante';
      return '';
    });
    expect(options.successMessage()).toBe('');
    expect(add).toHaveBeenCalledWith(
      expect.objectContaining({
        summary: 'Confirmation courante',
        detail: '',
      }),
    );
  });

  it('Given un rejet sans message, When la demande échoue, Then une trace contextualisée et le message de repli sont conservés', async () => {
    const options = createOptions();
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await runAuthSubmission(options, () => Promise.reject(null));
    expect(log).toHaveBeenCalled();
    expect(options.errorMessage()).toBe('Une erreur est survenue.');
    expect(options.successMessage()).toBeNull();
    expect(options.submitting()).toBe(false);
  });
});
