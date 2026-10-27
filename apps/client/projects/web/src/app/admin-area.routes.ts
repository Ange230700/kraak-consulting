import { KraakI18nService } from '../../../shared/i18n/kraak-i18n.service';
import { inject } from '@angular/core';
import { type CanMatchFn, type Route, Routes } from '@angular/router';

import { adminRoleChildGuard, adminRoleGuard } from './core/auth/auth.guard';

export const adminAreaCanMatch: CanMatchFn = () => true;

function adminPage(
  path: string,
  titleKey: string,
  loadComponent: NonNullable<Route['loadComponent']>,
): Route {
  return {
    path,
    title: () => inject(KraakI18nService).translate(titleKey),
    loadComponent,
  };
}

export const adminAreaRoutes: Routes = [
  {
    path: 'admin',
    canMatch: [adminAreaCanMatch],
    canActivate: [adminRoleGuard],
    canActivateChild: [adminRoleChildGuard],
    children: [
      adminPage(
        'dashboard',
        'web.admin.routes.dashboard',
        () => import('./features/admin/dashboard/dashboard.page'),
      ),
      adminPage(
        'programmes',
        'web.admin.routes.programmes',
        () => import('./features/admin/programmes/admin-programmes.page'),
      ),
      adminPage(
        'curriculum',
        'web.admin.routes.curriculum',
        () => import('./features/admin/curriculum/admin-curriculum.page'),
      ),
      adminPage(
        'ressources',
        'web.admin.routes.ressources',
        () => import('./features/admin/ressources/admin-ressources.page'),
      ),
      {
        path: 'utilisateurs',
        title: () =>
          inject(KraakI18nService).translate('web.admin.routes.users'),
        loadChildren: () =>
          import('./features/admin/utilisateurs/utilisateurs.routes'),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
];
