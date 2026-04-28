import { Route, Routes } from '@angular/router';

import { authGuard, authChildGuard } from './core/auth/auth.guard';
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
  buildMarketingRoute(
    'services',
    () => import('./features/services/services.page'),
  ),
  buildMarketingRoute(
    'programmes',
    () => import('./features/programs/programs.page'),
  ),
  buildMarketingRoute(
    'contact',
    () => import('./features/contact/contact.page'),
  ),
  {
    path: 'participant',
    canActivate: [authGuard],
    canActivateChild: [authChildGuard],
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
