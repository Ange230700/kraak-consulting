// apps/client/projects/web/src/app/app.routes.server.ts

import { RenderMode, ServerRoute } from '@angular/ssr';

import { seoPages } from './seo/site-seo';

const supportPrerenderPaths = ['401', '403', '404', '500'];

const clientOnlyPaths = new Set([
  'connexion',
  'inscription',
  'mot-de-passe-oublie',
  'auth/reset',
]);

const isClientOnlyPath = (path: string): boolean => clientOnlyPaths.has(path);

const isIndexableSeoPage = (page: { robots?: string }): boolean =>
  !(page.robots ?? '').toLowerCase().includes('noindex');

const publicPrerenderPaths = [
  ...seoPages
    .filter(isIndexableSeoPage)
    .map((page) => page.path)
    .filter((path) => !isClientOnlyPath(path)),
  ...supportPrerenderPaths,
];

const publicPrerenderRoutes: ServerRoute[] = publicPrerenderPaths.map(
  (path) => ({
    path,
    renderMode: RenderMode.Prerender,
  }),
);

export const serverRoutes: ServerRoute[] = [
  ...publicPrerenderRoutes,

  {
    path: 'connexion',
    renderMode: RenderMode.Client,
  },
  {
    path: 'inscription',
    renderMode: RenderMode.Client,
  },
  {
    path: 'mot-de-passe-oublie',
    renderMode: RenderMode.Client,
  },
  {
    path: 'auth/reset',
    renderMode: RenderMode.Client,
  },
  {
    path: 'participant',
    renderMode: RenderMode.Client,
  },
  {
    path: 'participant/**',
    renderMode: RenderMode.Client,
  },

  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];
