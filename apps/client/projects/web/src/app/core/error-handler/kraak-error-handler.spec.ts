import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { KraakErrorHandler } from './kraak-error-handler';

describe('KraakErrorHandler', () => {
  let handler: KraakErrorHandler;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    handler = new KraakErrorHandler();
    consoleErrorSpy = vi.spyOn(console, 'error').mockReturnValue(undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  // Given un faux positif ResizeObserver du navigateur
  // When le handler global le re\u00E7oit
  // Then il ne doit pas le journaliser comme une erreur applicative
  it("devrait ignorer le faux positif 'ResizeObserver loop completed with undelivered notifications.'", () => {
    const error = new Error(
      'An ErrorEvent with no error occurred. See Error.cause for details: ResizeObserver loop completed with undelivered notifications.',
      {
        cause: {
          message:
            'ResizeObserver loop completed with undelivered notifications.',
        },
      },
    );

    handler.handleError(error);

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  // Given une vraie erreur applicative
  // When le handler global la re\u00E7oit
  // Then il doit conserver le comportement d'erreur par d\u00E9faut
  it('devrait journaliser les autres erreurs', () => {
    handler.handleError(new Error('Erreur critique'));

    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
