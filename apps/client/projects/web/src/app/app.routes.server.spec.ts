// apps\client\projects\web\src\app\app.routes.server.spec.ts

import { RenderMode } from '@angular/ssr';

import { serverRoutes } from './app.routes.server';

describe('Web server routes', () => {
  const frozenPrerenderPaths = [
    '',
    'a-propos',
    'services',
    'programmes',
    'ressources',
    'contact',
    'faq',
    'mentions-legales',
    'politique-de-confidentialite',
    '401',
    '403',
    '404',
    '500',
  ];

  it('Given the frozen vitrine surface, When server routes are inspected, Then the prerender list exactly matches public pages and support status pages', () => {
    const prerenderPaths = serverRoutes
      .filter((route) => route.renderMode === RenderMode.Prerender)
      .map((route) => route.path);

    expect(prerenderPaths).toEqual(frozenPrerenderPaths);
  });

  it('Given the public support surface, When server routes are inspected, Then /401 is prerendered', () => {
    const unauthorizedRoute = serverRoutes.find(
      (route) => route.path === '401',
    );

    expect(unauthorizedRoute).toBeDefined();
    expect(unauthorizedRoute?.renderMode).toBe(RenderMode.Prerender);
  });

  it('Given the public support surface, When server routes are inspected, Then /403 is prerendered', () => {
    const forbiddenRoute = serverRoutes.find((route) => route.path === '403');

    expect(forbiddenRoute).toBeDefined();
    expect(forbiddenRoute?.renderMode).toBe(RenderMode.Prerender);
  });

  it('Given the public support surface, When server routes are inspected, Then /404 is prerendered with the marketing pages', () => {
    const notFoundRoute = serverRoutes.find((route) => route.path === '404');

    expect(notFoundRoute).toBeDefined();
    expect(notFoundRoute?.renderMode).toBe(RenderMode.Prerender);
  });

  it('Given the public support surface, When server routes are inspected, Then /500 is prerendered', () => {
    const serverErrorRoute = serverRoutes.find((route) => route.path === '500');

    expect(serverErrorRoute).toBeDefined();
    expect(serverErrorRoute?.renderMode).toBe(RenderMode.Prerender);
  });

  it('Given unknown routes, When server routes are inspected, Then dynamic fallback remains available', () => {
    const wildcardRoute = serverRoutes.find((route) => route.path === '**');

    expect(wildcardRoute).toBeDefined();
    expect(wildcardRoute?.renderMode).toBe(RenderMode.Server);
  });

  it('Given the server route table, When it is inspected, Then only the wildcard remains dynamic', () => {
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

  it('Given auth and participant routes, When server routes are inspected, Then they are client-rendered', () => {
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
});
