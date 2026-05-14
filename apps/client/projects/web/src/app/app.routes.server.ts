import { RenderMode, ServerRoute } from '@angular/ssr';

const publicPrerenderPaths = [
  '',
  'a-propos',
  'services',
  'faq',
  'programmes',
  'ressources',
  'contact',
  'mentions-legales',
  'politique-de-confidentialite',
];

const publicPrerenderRoutes: ServerRoute[] = publicPrerenderPaths.map(
  (path) => ({
    path,
    renderMode: RenderMode.Prerender as const,
  }),
);

export const serverRoutes: ServerRoute[] = [
  ...publicPrerenderRoutes,
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];
