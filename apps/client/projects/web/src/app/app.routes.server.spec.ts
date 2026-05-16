import { RenderMode } from '@angular/ssr';

import { serverRoutes } from './app.routes.server';

describe('Web server routes', () => {
  it('Given the public support surface, When server routes are inspected, Then /404 is prerendered with the marketing pages', () => {
    const notFoundRoute = serverRoutes.find((route) => route.path === '404');

    expect(notFoundRoute).toBeDefined();
    expect(notFoundRoute?.renderMode).toBe(RenderMode.Prerender);
  });

  it('Given unknown routes, When server routes are inspected, Then dynamic fallback remains available', () => {
    const wildcardRoute = serverRoutes.find((route) => route.path === '**');

    expect(wildcardRoute).toBeDefined();
    expect(wildcardRoute?.renderMode).toBe(RenderMode.Server);
  });
});
