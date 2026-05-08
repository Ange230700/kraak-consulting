import { CanMatchFn, Route, Routes } from '@angular/router';

import {
  participantRoleGuard,
  participantRoleChildGuard,
} from './core/auth/auth.guard';
import { isParticipantAreaEnabled } from './core/runtime/runtime-config';
import { findSeoPageByPath } from './seo/site-seo';

export const participantAreaCanMatch: CanMatchFn = () =>
  isParticipantAreaEnabled();

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

const participantAreaRoutes: Routes = [
  {
    path: 'connexion',
    title: 'Connexion | KRAAK',
    canMatch: [participantAreaCanMatch],
    loadComponent: () => import('./features/auth/sign-in.page'),
  },
  {
    path: 'inscription',
    title: 'Inscription | KRAAK',
    canMatch: [participantAreaCanMatch],
    loadComponent: () => import('./features/auth/sign-up.page'),
  },
  {
    path: 'mot-de-passe-oublie',
    title: 'Mot de passe oubli\u00E9 | KRAAK',
    canMatch: [participantAreaCanMatch],
    loadComponent: () => import('./features/auth/password-reset.page'),
  },
  {
    path: 'participant',
    canMatch: [participantAreaCanMatch],
    canActivate: [participantRoleGuard],
    canActivateChild: [participantRoleChildGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/participant/dashboard/dashboard.page'),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
];

export function buildRoutes(): Routes {
  return [
    ...marketingRoutes,
    ...participantAreaRoutes,
    {
      path: '**',
      redirectTo: '',
    },
  ];
}

export const routes: Routes = buildRoutes();
