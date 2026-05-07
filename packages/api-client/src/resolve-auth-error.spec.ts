import { describe, it, expect } from 'vitest';
import { resolveAuthErrorMessage } from './resolve-auth-error';
import { ApiError } from './client';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeApiError(body: unknown): ApiError {
  const err = new ApiError(400, 'Bad Request', body);
  return err;
}

// ---------------------------------------------------------------------------
// resolveAuthErrorMessage
// ---------------------------------------------------------------------------

describe('resolveAuthErrorMessage', () => {
  const fallback = 'Une erreur est survenue.';

  describe('Given an ApiError whose body has a non-empty "message" string', () => {
    it('When called, Then returns that message string', () => {
      const error = makeApiError({ message: 'Identifiants invalides.' });

      const result = resolveAuthErrorMessage(error, fallback);

      expect(result).toBe('Identifiants invalides.');
    });

    it('When message is only whitespace, Then falls through to ApiError.message', () => {
      const error = makeApiError({ message: '   ' });

      const result = resolveAuthErrorMessage(error, fallback);

      expect(result).toBe('400 Bad Request');
    });

    it('When message is not a string, Then falls through to ApiError.message', () => {
      const error = makeApiError({ message: 42 });

      const result = resolveAuthErrorMessage(error, fallback);

      expect(result).toBe('400 Bad Request');
    });
  });

  describe('Given an ApiError whose body has an "errors" array', () => {
    it('When the array contains a non-empty string, Then returns the first valid error', () => {
      const error = makeApiError({
        errors: ['Champ requis.', 'Autre erreur.'],
      });

      const result = resolveAuthErrorMessage(error, fallback);

      expect(result).toBe('Champ requis.');
    });

    it('When the array contains only empty/non-string values, Then falls through to ApiError.message', () => {
      const error = makeApiError({ errors: ['  ', 42, null] });

      const result = resolveAuthErrorMessage(error, fallback);

      expect(result).toBe('400 Bad Request');
    });

    it('When errors is not an array, Then falls through to ApiError.message', () => {
      const error = makeApiError({ errors: 'pas un tableau' });

      const result = resolveAuthErrorMessage(error, fallback);

      expect(result).toBe('400 Bad Request');
    });
  });

  describe('Given an ApiError whose body is not a plain object', () => {
    it('When body is null, Then falls through to ApiError.message', () => {
      const error = makeApiError(null);

      const result = resolveAuthErrorMessage(error, fallback);

      expect(result).toBe('400 Bad Request');
    });

    it('When body is a primitive, Then falls through to ApiError.message', () => {
      const error = makeApiError('erreur brute');

      const result = resolveAuthErrorMessage(error, fallback);

      expect(result).toBe('400 Bad Request');
    });
  });

  describe('Given a plain Error (not ApiError)', () => {
    it('When message is non-empty, Then returns that message', () => {
      const error = new Error('Erreur réseau.');

      const result = resolveAuthErrorMessage(error, fallback);

      expect(result).toBe('Erreur réseau.');
    });

    it('When message is empty, Then returns fallback', () => {
      const error = new Error('');

      const result = resolveAuthErrorMessage(error, fallback);

      expect(result).toBe(fallback);
    });
  });

  describe('Given an unknown/non-Error value', () => {
    it('When error is a string, Then returns fallback', () => {
      const result = resolveAuthErrorMessage('oops', fallback);

      expect(result).toBe(fallback);
    });

    it('When error is null, Then returns fallback', () => {
      const result = resolveAuthErrorMessage(null, fallback);

      expect(result).toBe(fallback);
    });

    it('When error is undefined, Then returns fallback', () => {
      const result = resolveAuthErrorMessage(undefined, fallback);

      expect(result).toBe(fallback);
    });
  });
});
