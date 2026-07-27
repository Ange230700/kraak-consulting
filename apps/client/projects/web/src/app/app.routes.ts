// apps\client\projects\web\src\app\app.routes.ts

import { Route, Routes } from '@angular/router';

import { adminAreaRoutes } from './admin-area.routes';
import { webRouteLocaleResolver } from './i18n/web-route-locale.resolver';
import { participantAreaRoutes } from './participant-area.routes';
import {
  LOCALIZED_PUBLIC_LOCALES,
  findLocalizedPublicRouteEntry,
  localizedPublicRouteEntries,
  renderPublicRedirects,
  toAngularRoutePath,
  type LocalizedPublicComponentKey,
  type LocalizedPublicRouteEntry,
} from './routing/localized-public-routes';
import {
  findLocalizedSeoPageByPath,
  findSeoPageByPath,
  type SeoPageDefinition,
} from './seo/site-seo';

export { participantAreaCanMatch } from './participant-area.routes';

const publicComponentLoaders = {
  home: () => import('./features/home/home.page'),
  about: () => import('./features/about/about.page'),
  services: () => import('./features/services/services.page'),
  faq: () => import('./features/support/faq.page'),
  programs: () => import('./features/programs/programs.page'),
  resources: () => import('./features/resources/resources.page'),
  contact: () => import('./features/contact/contact.page'),
  legalNotice: () => import('./features/legal/mentions-legales.page'),
  privacyPolicy: () =>
    import('./features/legal/politique-de-confidentialite.page'),
  unauthorized: () => import('./features/support/unauthorized.page'),
  forbidden: () => import('./features/support/forbidden.page'),
  notFound: () => import('./features/support/not-found.page'),
  serverError: () => import('./features/support/server-error.page'),
} satisfies Record<LocalizedPublicComponentKey, Route['loadComponent']>;

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

const authResetRoute = buildMarketingRoute(
  'auth/reset',
  () => import('./features/auth/auth-reset.page'),
);

function buildLocalizedPublicRoutes(): Routes {
  return LOCALIZED_PUBLIC_LOCALES.map((localeDefinition) => {
    const notFoundEntry = findLocalizedPublicRouteEntry(
      'notFound',
      localeDefinition.locale,
    );
    const notFoundSeo = findRequiredLocalizedSeoPage(notFoundEntry.path);
    const childRoutes = localizedPublicRouteEntries
      .filter((entry) => entry.locale === localeDefinition.locale)
      .map((entry) => buildLocalizedPublicPageRoute(entry));

    return {
      path: localeDefinition.segment,
      data: { locale: localeDefinition.locale },
      resolve: { locale: webRouteLocaleResolver },
      runGuardsAndResolvers: 'always',
      children: [
        ...childRoutes,
        {
          path: '**',
          title: notFoundSeo.title,
          data: {
            locale: localeDefinition.locale,
            seo: notFoundSeo,
          },
          loadComponent: publicComponentLoaders.notFound,
        },
      ],
    };
  });
}

function buildLocalizedPublicPageRoute(
  entry: LocalizedPublicRouteEntry,
): Route {
  const seo = findRequiredLocalizedSeoPage(entry.path);

  return {
    path: entry.childPath,
    ...(entry.childPath === '' ? { pathMatch: 'full' as const } : {}),
    title: seo.title,
    data: {
      locale: entry.locale,
      pageId: entry.pageId,
      seo,
    },
    loadComponent: publicComponentLoaders[entry.component],
  };
}

function buildLegacyRedirectRoutes(): Routes {
  return renderPublicRedirects.map((redirect) => ({
    path: toAngularRoutePath(redirect.source),
    redirectTo: redirect.destination,
    pathMatch: 'full',
  }));
}

function findRequiredLocalizedSeoPage(path: string): SeoPageDefinition {
  const seo = findLocalizedSeoPageByPath(path);

  if (!seo) {
    throw new Error(`Missing localized SEO configuration for "${path}".`);
  }

  return seo;
}

interface BuildRoutesOptions {
  readonly includeParticipantArea?: boolean;
}

export function buildRoutes(options: BuildRoutesOptions = {}): Routes {
  const includeParticipantArea = options.includeParticipantArea ?? true;
  const fallbackNotFoundSeo = findRequiredLocalizedSeoPage('/fr/404');

  return [
    {
      path: '',
      redirectTo: '/fr/',
      pathMatch: 'full',
    },
    ...buildLegacyRedirectRoutes(),
    ...buildLocalizedPublicRoutes(),
    ...adminAreaRoutes,
    ...(includeParticipantArea ? participantAreaRoutes : []),
    authResetRoute,
    {
      path: '**',
      title: fallbackNotFoundSeo.title,
      data: { seo: fallbackNotFoundSeo },
      loadComponent: publicComponentLoaders.notFound,
    },
  ];
}

export const routes: Routes = buildRoutes({
  includeParticipantArea: true,
});
