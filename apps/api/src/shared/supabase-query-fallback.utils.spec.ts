import {
  isSupabaseColumnMissingError,
  readSupabaseErrorCode,
  readSupabaseErrorMessage,
  readSupabaseQueryWithFallback,
} from './supabase-query-fallback.utils';

describe('readSupabaseErrorCode', () => {
  it('Given une erreur Supabase avec code, When readSupabaseErrorCode est appelé, Then le code est retourne', () => {
    expect(readSupabaseErrorCode({ code: '42703' })).toBe('42703');
  });

  it('Given une erreur sans code exploitable, When readSupabaseErrorCode est appelé, Then null est retourne', () => {
    expect(readSupabaseErrorCode({ code: 42703 })).toBeNull();
    expect(readSupabaseErrorCode(null)).toBeNull();
  });
});

describe('readSupabaseErrorMessage', () => {
  it('Given une erreur Supabase avec message, When readSupabaseErrorMessage est appelé, Then le message est retourne', () => {
    expect(
      readSupabaseErrorMessage({
        message: 'column announcement.priority does not exist',
      }),
    ).toBe('column announcement.priority does not exist');
  });

  it('Given une erreur sans message exploitable, When readSupabaseErrorMessage est appelé, Then null est retourne', () => {
    expect(readSupabaseErrorMessage({ message: false })).toBeNull();
    expect(readSupabaseErrorMessage(undefined)).toBeNull();
  });
});

describe('isSupabaseColumnMissingError', () => {
  it('Given une erreur 42703 sur une colonne attendue, When isSupabaseColumnMissingError est appelé, Then true est retourne', () => {
    expect(
      isSupabaseColumnMissingError(
        {
          code: '42703',
          message: 'column enrollment.progress_updated_at does not exist',
        },
        ['progress_updated_at'],
      ),
    ).toBe(true);
  });

  it('Given une erreur non liée a une colonne attendue, When isSupabaseColumnMissingError est appelé, Then false est retourne', () => {
    expect(
      isSupabaseColumnMissingError(
        {
          code: '23505',
          message: 'duplicate key value violates unique constraint',
        },
        ['announcement.priority'],
      ),
    ).toBe(false);
  });
});

describe('readSupabaseQueryWithFallback', () => {
  it('Given une erreur de colonne manquante, When readSupabaseQueryWithFallback est appelé, Then la requête fallback est rejouée', async () => {
    const loadQuery = jest
      .fn()
      .mockResolvedValueOnce({
        data: null,
        error: {
          code: '42703',
          message: 'column announcement.priority does not exist',
        },
      })
      .mockResolvedValueOnce({
        data: [{ id: 'ann-1' }],
        error: null,
      });

    await expect(
      readSupabaseQueryWithFallback({
        loadQuery,
        primarySelect: 'priority',
        fallbackSelect: 'without-priority',
        shouldRetry: (error) =>
          isSupabaseColumnMissingError(error, ['announcement.priority']),
        context: 'announcements.list',
        retryNotice: 'Announcement priority column missing; retrying fallback',
        fallbackFailureNotice: 'Announcement fallback query failed',
      }),
    ).resolves.toEqual({
      data: [{ id: 'ann-1' }],
      error: null,
    });

    expect(loadQuery).toHaveBeenNthCalledWith(1, 'priority');
    expect(loadQuery).toHaveBeenNthCalledWith(2, 'without-priority');
  });

  it('Given une erreur non eligible, When readSupabaseQueryWithFallback est appelé, Then le résultat primaire est retourne sans fallback', async () => {
    const primaryResult = {
      data: null,
      error: {
        code: '42501',
        message: 'permission denied',
      },
    };
    const loadQuery = jest.fn().mockResolvedValue(primaryResult);

    await expect(
      readSupabaseQueryWithFallback({
        loadQuery,
        primarySelect: 'primary',
        fallbackSelect: 'fallback',
        shouldRetry: (error) =>
          isSupabaseColumnMissingError(error, ['announcement.priority']),
        context: 'announcements.list',
        retryNotice: 'Announcement priority column missing; retrying fallback',
        fallbackFailureNotice: 'Announcement fallback query failed',
      }),
    ).resolves.toBe(primaryResult);

    expect(loadQuery).toHaveBeenCalledTimes(1);
  });

  it('Given un fallback en erreur, When readSupabaseQueryWithFallback est appelé, Then le résultat fallback est retourne et l\u0027erreur est logguée', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    const loadQuery = jest
      .fn()
      .mockResolvedValueOnce({
        data: null,
        error: {
          code: '42703',
          message: 'column announcement.priority does not exist',
        },
      })
      .mockResolvedValueOnce({
        data: null,
        error: {
          code: '42501',
          message: 'permission denied during fallback',
        },
      });

    await expect(
      readSupabaseQueryWithFallback({
        loadQuery,
        primarySelect: 'priority',
        fallbackSelect: 'without-priority',
        shouldRetry: (error) =>
          isSupabaseColumnMissingError(error, ['announcement.priority']),
        context: 'announcements.list',
        retryNotice: 'Announcement priority column missing; retrying fallback',
        fallbackFailureNotice: 'Announcement fallback query failed',
      }),
    ).resolves.toEqual({
      data: null,
      error: {
        code: '42501',
        message: 'permission denied during fallback',
      },
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Announcement fallback query failed',
      expect.objectContaining({
        context: 'announcements.list',
        code: '42501',
      }),
    );

    consoleErrorSpy.mockRestore();
  });
});
