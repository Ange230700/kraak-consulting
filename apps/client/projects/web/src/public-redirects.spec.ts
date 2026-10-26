import { describe, expect, it, vi } from 'vitest';

import { resolvePublicRedirectDestination } from './public-redirects';

describe('Given public redirect resolution', () => {
  it.each([
    'https://example.invalid/contact',
    '//example.invalid/contact',
    '/\\example.invalid/contact',
    'contact',
  ])(
    'Given une URL externe ou ambiguë %s, When une redirection est demandée, Then aucune destination n’est produite',
    (url) => {
      const warn = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);
      expect(resolvePublicRedirectDestination(url)).toBeUndefined();
      expect(warn).toHaveBeenCalledWith(
        'web.redirect.invalid-url',
        expect.objectContaining({ error: expect.any(Error) }),
      );
      warn.mockRestore();
    },
  );

  it('Given un encodage invalide, When la redirection est résolue, Then aucune destination n’est produite et l’erreur est journalisée', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(resolvePublicRedirectDestination('/%invalid')).toBeUndefined();
    expect(warn).toHaveBeenCalledWith(
      'web.redirect.invalid-url',
      expect.objectContaining({ url: '/%invalid', error: expect.any(Error) }),
    );
    warn.mockRestore();
  });
  it('Given the root URL, when redirect destination is resolved, then it points to the localized French home', () => {
    expect(resolvePublicRedirectDestination('/')).toBe('/fr/');
  });

  it('Given a legacy French URL, when redirect destination is resolved, then it points to the localized French path', () => {
    expect(resolvePublicRedirectDestination('/a-propos')).toBe('/fr/a-propos');
    expect(resolvePublicRedirectDestination('/services')).toBe('/fr/services');
    expect(resolvePublicRedirectDestination('/404')).toBe('/fr/404');
  });

  it('Given a legacy English alias, when redirect destination is resolved, then it keeps the conservative French target for PR 3', () => {
    expect(resolvePublicRedirectDestination('/about')).toBe('/fr/a-propos');
    expect(resolvePublicRedirectDestination('/programs')).toBe(
      '/fr/programmes',
    );
    expect(resolvePublicRedirectDestination('/resources')).toBe(
      '/fr/ressources',
    );
  });

  it('Given a trailing slash legacy URL, when redirect destination is resolved, then the canonical target has no trailing slash except home', () => {
    expect(resolvePublicRedirectDestination('/services/')).toBe('/fr/services');
  });

  it('Given a query string, when redirect destination is resolved, then the query string is preserved', () => {
    expect(resolvePublicRedirectDestination('/contact?utm_source=test')).toBe(
      '/fr/contact?utm_source=test',
    );
  });

  it('Given a localized or private URL, when redirect destination is resolved, then no redirect is returned', () => {
    expect(resolvePublicRedirectDestination('/fr/services')).toBeUndefined();
    expect(resolvePublicRedirectDestination('/en/services')).toBeUndefined();
    expect(resolvePublicRedirectDestination('/connexion')).toBeUndefined();
    expect(resolvePublicRedirectDestination('/auth/reset')).toBeUndefined();
  });
});
