import { describe, expect, it } from 'vitest';

import { resolvePublicRedirectDestination } from './public-redirects';

describe('Given public redirect resolution', () => {
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
