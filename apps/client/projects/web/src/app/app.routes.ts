import { Route, Routes } from '@angular/router';

import { findSeoPageByPath, type SeoPageDefinition } from './seo/site-seo';
import {
  participantAreaCanMatch,
  participantAreaRoutes,
} from './participant-area.routes';
import { environment } from '../environments/environment';

export const buildMarketingRoute = (
  path: string,
  loadComponent: Route['loadComponent'],
): Route => {
  const seo = findSeoPageByPath(path);

  if (!seo) {
    throw new Error(`Missing SEO configuration for route "${path}"`);
  }

  return {
    path,
    title: seo.title,
    data: { seo },
    loadComponent,
  };
};

const marketingRoutes: Routes = [
  buildMarketingRoute('', () => import('./features/home/home.page')),
  buildMarketingRoute('a-propos', () => import('./features/about/about.page')),
  buildMarketingRoute(
    'services',
    () => import('./features/services/services.page'),
  ),
  buildMarketingRoute('faq', () => import('./features/support/faq.page')),
  buildMarketingRoute(
    'programmes',
    () => import('./features/programs/programs.page'),
  ),
  buildMarketingRoute(
    'ressources',
    () => import('./features/resources/resources.page'),
  ),
  buildMarketingRoute(
    'contact',
    () => import('./features/contact/contact.page'),
  ),
  buildMarketingRoute(
    'mentions-legales',
    () => import('./features/legal/mentions-legales.page'),
  ),
  buildMarketingRoute(
    'politique-de-confidentialite',
    () => import('./features/legal/politique-de-confidentialite.page'),
  ),
];

const notFoundSeo: SeoPageDefinition = {
  path: '**',
  title: 'Page introuvable | KRAAK Consulting',
  description:
    "La page demand�e est introuvable. Retrouvez la FAQ, l'accueil ou le formulaire de contact KRAAK.",
  openGraph: {
    title: 'Page introuvable | KRAAK Consulting',
    description:
      "La page demand�e est introuvable. Retrouvez la FAQ, l'accueil ou le formulaire de contact KRAAK.",
    imagePath: '/open-graph/kraak-share-card.svg',
    imageAlt: 'Carte de partage KRAAK Consulting.',
  },
  sitemap: {
    changeFrequency: 'never',
    priority: 0.1,
  },
};

export { participantAreaCanMatch };

interface BuildRoutesOptions {
  readonly includeParticipantArea?: boolean;
}

export function buildRoutes(options: BuildRoutesOptions = {}): Routes {
  const includeParticipantArea =
    options.includeParticipantArea ?? environment.enableParticipantArea;

  return [
    ...marketingRoutes,
    ...(includeParticipantArea ? participantAreaRoutes : []),
    {
      path: '**',
      title: notFoundSeo.title,
      data: { seo: notFoundSeo },
      loadComponent: () => import('./features/support/not-found.page'),
    },
  ];
}

export const routes: Routes = buildRoutes();
