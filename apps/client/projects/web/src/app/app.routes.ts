import { Route, Routes } from '@angular/router';

import {
  participantRoleGuard,
  participantRoleChildGuard,
} from './core/auth/auth.guard';
import { findSeoPageByPath } from './seo/site-seo';

const buildMarketingRoute = (
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

export const routes: Routes = [
  buildMarketingRoute('', () => import('./features/home/home.page')),
  buildMarketingRoute('a-propos', () => import('./features/about/about.page')),
  {
    path: 'connexion',
    title: 'Connexion | KRAAK',
    loadComponent: () => import('./features/auth/sign-in.page'),
  },
  {
    path: 'inscription',
    title: 'Inscription | KRAAK',
    loadComponent: () => import('./features/auth/sign-up.page'),
  },
  {
    path: 'mot-de-passe-oublie',
    title: 'Mot de passe oublié | KRAAK',
    loadComponent: () => import('./features/auth/password-reset.page'),
  },
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
  {
    path: 'participant',
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
  {
    path: '**',
    redirectTo: '',
  },
];
