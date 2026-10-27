import express from 'express';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { describe, expect, it, vi } from 'vitest';

import {
  registerPublicRedirectRoutes,
  resolvePublicRedirectDestination,
} from './public-redirects';

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

  it('Given des paramètres répétés et une URL externe en valeur, When la cible est résolue, Then seules les valeurs sont encodées et le chemin reste autorisé', () => {
    const destination = resolvePublicRedirectDestination(
      '/contact?next=https://example.invalid/evil&tag=a+b&tag=%C3%A9&empty',
    );
    expect(destination).toBe(
      '/fr/contact?next=https%3A%2F%2Fexample.invalid%2Fevil&tag=a%20b&tag=%C3%A9&empty=',
    );
    const result = new URL(destination ?? '', 'https://kraak.invalid');
    expect(result.origin).toBe('https://kraak.invalid');
    expect(result.searchParams.getAll('tag')).toEqual(['a b', 'é']);
    expect(result.searchParams.get('next')).toBe(
      'https://example.invalid/evil',
    );
    expect(result.searchParams.get('empty')).toBe('');
  });

  it.each([
    [
      'GET',
      '/contact?next=//example.invalid',
      301,
      '/fr/contact?next=%2F%2Fexample.invalid',
    ],
    ['HEAD', '/about', 301, '/fr/a-propos'],
    ['POST', '/contact', 204, null],
    ['GET', '/fr/contact', 204, null],
    ['GET', '/%2f%2fexample.invalid', 204, null],
  ] as const)(
    'Given la requête %s %s, When le middleware répond, Then le statut est %s et la cible reste locale',
    async (method, path, status, location) => {
      const app = express();
      registerPublicRedirectRoutes(app);
      app.use((_req, res) => res.sendStatus(204));
      const server = createServer(app);
      server.listen(0, '127.0.0.1');
      await once(server, 'listening');
      try {
        const address = server.address();
        if (!address || typeof address === 'string') {
          throw new Error('Le serveur de test exige un port TCP.');
        }
        const response = await fetch(
          `http://127.0.0.1:${address.port}${path}`,
          { method, redirect: 'manual' },
        );
        expect(response.status).toBe(status);
        expect(response.headers.get('location')).toBe(location);
      } finally {
        server.close();
        await once(server, 'close');
      }
    },
  );

  it('Given a localized or private URL, when redirect destination is resolved, then no redirect is returned', () => {
    expect(resolvePublicRedirectDestination('/fr/services')).toBeUndefined();
    expect(resolvePublicRedirectDestination('/en/services')).toBeUndefined();
    expect(resolvePublicRedirectDestination('/connexion')).toBeUndefined();
    expect(resolvePublicRedirectDestination('/auth/reset')).toBeUndefined();
  });
});
