import {
  ApiLocaleContext,
  ApiLocaleMiddleware,
  resolveRequestLocale,
} from './api-locale-context';

describe('API locale context', () => {
  it.each([
    [['de;q=0.8', 'en;q=0.8', 'fr;q=0.8'], 'en-GB'],
    ['*, , en;extension=value', 'en-GB'],
    ['en;q=1.1, fr', 'fr-CI'],
    [`en;q=${'9'.repeat(400)}, fr`, 'fr-CI'],
    ['en;q=-1, fr', 'fr-CI'],
  ] as const)(
    'Given des préférences %p, When la langue est résolue, Then elle vaut %s',
    (header, expected) => {
      expect(resolveRequestLocale(header)).toBe(expected);
    },
  );

  it('falls back to fr-CI when Accept-Language is absent', () => {
    expect(resolveRequestLocale(undefined)).toBe('fr-CI');
  });

  it('normalizes a regional English browser locale to en-GB', () => {
    expect(resolveRequestLocale('en-US,en;q=0.9')).toBe('en-GB');
  });

  it('skips unsupported languages before selecting a supported locale', () => {
    expect(resolveRequestLocale('de-DE, en-US;q=0.8, fr-FR;q=0.7')).toBe(
      'en-GB',
    );
  });

  it('honors Accept-Language quality priorities', () => {
    expect(resolveRequestLocale('fr-FR;q=0.4, en-US;q=0.9')).toBe('en-GB');
  });

  it('ignores a supported language explicitly disabled with q=0', () => {
    expect(resolveRequestLocale('en;q=0')).toBe('fr-CI');
  });

  it('ignores a language preference with a malformed quality value', () => {
    expect(resolveRequestLocale('en-US;q=invalid, fr-FR;q=0.8')).toBe('fr-CI');
  });

  it('preserves the locale through asynchronous request work', async () => {
    const context = new ApiLocaleContext();

    expect(context.locale()).toBe('fr-CI');

    await context.run('en-GB', async () => {
      await Promise.resolve();

      expect(context.locale()).toBe('en-GB');
    });

    expect(context.locale()).toBe('fr-CI');
  });

  it('makes the resolved request locale available inside middleware execution', () => {
    const context = new ApiLocaleContext();
    const middleware = new ApiLocaleMiddleware(context);

    middleware.use(
      {
        headers: {
          'accept-language': 'en-US,en;q=0.9',
        },
      },
      {},
      () => {
        expect(context.locale()).toBe('en-GB');
      },
    );

    expect(context.locale()).toBe('fr-CI');
  });
});
