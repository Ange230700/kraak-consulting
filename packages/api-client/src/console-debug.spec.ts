// packages\api-client\src\console-debug.spec.ts

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logDebugError } from './console-debug';

describe('logDebugError', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>;
  let consoleGroupCollapsedSpy: ReturnType<typeof vi.spyOn>;
  let consoleGroupEndSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      return undefined;
    });
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {
      return undefined;
    });
    consoleGroupCollapsedSpy = vi
      .spyOn(console, 'groupCollapsed')
      .mockImplementation(() => {
        return undefined;
      });
    consoleGroupEndSpy = vi
      .spyOn(console, 'groupEnd')
      .mockImplementation(() => {
        return undefined;
      });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Given an error with safe context details, When logDebugError is called, Then it writes a grouped console trace for debugging', () => {
    const error = new Error('Connexion impossible');

    logDebugError('web.auth.sign-in.submit', error, {
      route: '/connexion',
      feature: 'auth',
    });

    expect(consoleGroupCollapsedSpy).toHaveBeenCalledWith(
      '[Debug] web.auth.sign-in.submit',
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    expect(consoleDebugSpy).toHaveBeenCalledWith('Contexte :', {
      route: '/connexion',
      feature: 'auth',
    });
    expect(consoleGroupEndSpy).toHaveBeenCalledOnce();
  });

  it('Given an error without extra details, When logDebugError is called, Then it still writes a contextual console error', () => {
    const error = new Error('Erreur réseau');

    logDebugError('mobile.support.submit', error);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[Debug] mobile.support.submit',
      error,
    );
    expect(consoleGroupCollapsedSpy).not.toHaveBeenCalled();
    expect(consoleDebugSpy).not.toHaveBeenCalled();
    expect(consoleGroupEndSpy).not.toHaveBeenCalled();
  });
});
