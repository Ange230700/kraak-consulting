import { RenderMode, ServerRoute } from '@angular/ssr';

import { seoPages } from './seo/site-seo';

const publicPrerenderPaths = [...seoPages.map((page) => page.path), '404'];

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
