// apps/client/projects/web/src/app/app.routes.server.ts

import { RenderMode, ServerRoute } from '@angular/ssr';

import { localizedPublicPrerenderPaths } from './routing/localized-public-routes';

const clientOnlyPaths = [
  'connexion',
  'inscription',
  'mot-de-passe-oublie',
  'auth/reset',
  'participant',
  'participant/**',
];

const publicPrerenderRoutes: ServerRoute[] = localizedPublicPrerenderPaths.map(
  (path) => ({
    path,
    renderMode: RenderMode.Prerender,
  }),
);

const clientOnlyRoutes: ServerRoute[] = clientOnlyPaths.map((path) => ({
  path,
  renderMode: RenderMode.Client,
}));

export const serverRoutes: ServerRoute[] = [
  ...publicPrerenderRoutes,
  ...clientOnlyRoutes,

  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];
