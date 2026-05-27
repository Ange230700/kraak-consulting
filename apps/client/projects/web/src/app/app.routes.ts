import { Route, Routes } from '@angular/router';

import { findSeoPageByPath, type SeoPageDefinition } from './seo/site-seo';
import { adminAreaRoutes } from './admin-area.routes';
import { participantAreaRoutes } from './participant-area.routes';
import { environment } from '../environments/environment';

export { participantAreaCanMatch } from './participant-area.routes';

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
  buildMarketingRoute('blog', () => import('./features/blog/blog.page')),
  {
    path: 'blog/:slug',
    title: 'Article de blog | KRAAK Consulting',
    data: {
      seo: {
        path: 'blog',
        title: 'Article de blog | KRAAK Consulting',
        description:
          'Consultez les articles KRAAK pour avancer plus clairement dans vos choix de formation, projet ou mobilité.',
        openGraph: {
          title: 'Article de blog | KRAAK Consulting',
          description:
            'Consultez les articles KRAAK pour avancer plus clairement dans vos choix de formation, projet ou mobilité.',
          imagePath: '/assets/site-visuals/photos/home-hero-workshop.jpg',
          imageAlt:
            "Photo d'un atelier KRAAK Consulting avec des participants en session de travail.",
        },
        sitemap: {
          changeFrequency: 'never',
          priority: 0.1,
        },
      },
    },
    loadComponent: () => import('./features/blog/blog-article.page'),
  },
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
  buildMarketingRoute(
    'auth/reset',
    () => import('./features/auth/auth-reset.page'),
  ),
  {
    path: 'about',
    redirectTo: 'a-propos',
    pathMatch: 'full',
  },
  {
    path: 'programs',
    redirectTo: 'programmes',
    pathMatch: 'full',
  },
  {
    path: 'resources',
    redirectTo: 'ressources',
    pathMatch: 'full',
  },
];

const notFoundSeo: SeoPageDefinition = {
  path: '404',
  title: 'Page introuvable | KRAAK Consulting',
  description:
    "La page demandée est introuvable. Retrouvez la FAQ, l'accueil ou le formulaire de contact KRAAK.",
  openGraph: {
    title: 'Page introuvable | KRAAK Consulting',
    description:
      "La page demandée est introuvable. Retrouvez la FAQ, l'accueil ou le formulaire de contact KRAAK.",
    imagePath: '/assets/site-visuals/photos/home-hero-workshop.jpg',
    imageAlt:
      "Photo d'un atelier KRAAK Consulting avec des participants en session de travail.",
  },
  sitemap: {
    changeFrequency: 'never',
    priority: 0.1,
  },
};

const unauthorizedSeo: SeoPageDefinition = {
  path: '401',
  title: 'Authentification requise | KRAAK Consulting',
  description:
    'Cette ressource nécessite une authentification. Connectez-vous pour poursuivre votre parcours KRAAK.',
  openGraph: {
    title: 'Authentification requise | KRAAK Consulting',
    description:
      'Cette ressource nécessite une authentification. Connectez-vous pour poursuivre votre parcours KRAAK.',
    imagePath: '/assets/site-visuals/photos/home-hero-workshop.jpg',
    imageAlt:
      "Photo d'un atelier KRAAK Consulting avec des participants en session de travail.",
  },
  sitemap: {
    changeFrequency: 'never',
    priority: 0.1,
  },
};

const forbiddenSeo: SeoPageDefinition = {
  path: '403',
  title: 'Accès refusé | KRAAK Consulting',
  description:
    'Cette ressource est protégée. Contactez KRAAK si vous pensez disposer des droits nécessaires.',
  openGraph: {
    title: 'Accès refusé | KRAAK Consulting',
    description:
      'Cette ressource est protégée. Contactez KRAAK si vous pensez disposer des droits nécessaires.',
    imagePath: '/assets/site-visuals/photos/home-hero-workshop.jpg',
    imageAlt:
      "Photo d'un atelier KRAAK Consulting avec des participants en session de travail.",
  },
  sitemap: {
    changeFrequency: 'never',
    priority: 0.1,
  },
};

const serverErrorSeo: SeoPageDefinition = {
  path: '500',
  title: 'Incident technique | KRAAK Consulting',
  description:
    'Une erreur technique est survenue. Réessayez dans un instant ou contactez KRAAK.',
  openGraph: {
    title: 'Incident technique | KRAAK Consulting',
    description:
      'Une erreur technique est survenue. Réessayez dans un instant ou contactez KRAAK.',
    imagePath: '/assets/site-visuals/photos/home-hero-workshop.jpg',
    imageAlt:
      "Photo d'un atelier KRAAK Consulting avec des participants en session de travail.",
  },
  sitemap: {
    changeFrequency: 'never',
    priority: 0.1,
  },
};

interface BuildRoutesOptions {
  readonly includeParticipantArea?: boolean;
}

export function buildRoutes(options: BuildRoutesOptions = {}): Routes {
  const includeParticipantArea =
    options.includeParticipantArea ?? environment.enableParticipantArea;

  return [
    ...marketingRoutes,
    ...adminAreaRoutes,
    ...(includeParticipantArea ? participantAreaRoutes : []),
    {
      path: '401',
      title: unauthorizedSeo.title,
      data: { seo: unauthorizedSeo },
      loadComponent: () => import('./features/support/unauthorized.page'),
    },
    {
      path: '403',
      title: forbiddenSeo.title,
      data: { seo: forbiddenSeo },
      loadComponent: () => import('./features/support/forbidden.page'),
    },
    {
      path: '500',
      title: serverErrorSeo.title,
      data: { seo: serverErrorSeo },
      loadComponent: () => import('./features/support/server-error.page'),
    },
    {
      path: '404',
      title: notFoundSeo.title,
      data: { seo: notFoundSeo },
      loadComponent: () => import('./features/support/not-found.page'),
    },
    {
      path: '**',
      title: notFoundSeo.title,
      data: { seo: notFoundSeo },
      loadComponent: () => import('./features/support/not-found.page'),
    },
  ];
}

export const routes: Routes = buildRoutes();
