import { RenderMode } from '@angular/ssr';

import { serverRoutes } from './app.routes.server';

describe('Web server routes', () => {
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
});
