// apps\client\projects\web\src\app\app.routes.server.spec.ts

import { RenderMode } from '@angular/ssr';

import { serverRoutes } from './app.routes.server';
import { localizedPublicPrerenderPaths } from './routing/localized-public-routes';

describe('Web server routes', () => {
  it('Given localized public routes, When server routes are inspected, Then every French and English route is prerendered deterministically', () => {
    const prerenderPaths = serverRoutes
      .filter((route) => route.renderMode === RenderMode.Prerender)
      .map((route) => route.path);

    expect(prerenderPaths).toEqual([...localizedPublicPrerenderPaths]);
    expect(prerenderPaths).toContain('fr/services');
    expect(prerenderPaths).toContain('en/services');
    expect(prerenderPaths).toContain('fr/404');
    expect(prerenderPaths).toContain('en/404');
    expect(new Set(prerenderPaths).size).toBe(prerenderPaths.length);
  });

  it('Given private and auth routes, When server routes are inspected, Then they keep their client render mode and unlocalized paths', () => {
    const clientPaths = serverRoutes
      .filter((route) => route.renderMode === RenderMode.Client)
      .map((route) => route.path);

    expect(clientPaths).toEqual([
      'connexion',
      'inscription',
      'mot-de-passe-oublie',
      'auth/reset',
      'participant',
      'participant/**',
    ]);
  });

  it('Given unknown routes, When server routes are inspected, Then dynamic fallback remains available only for the wildcard', () => {
    const dynamicRoutes = serverRoutes.filter(
      (route) => route.renderMode === RenderMode.Server,
    );

    expect(dynamicRoutes).toEqual([
      {
        path: '**',
        renderMode: RenderMode.Server,
      },
    ]);
  });
});
