import { RenderMode, ServerRoute } from '@angular/ssr';

import { seoPages } from './seo/site-seo';

const supportPrerenderPaths = ['401', '403', '404', '500'];
const publicPrerenderPaths = [
  ...seoPages.map((page) => page.path),
  ...supportPrerenderPaths,
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
