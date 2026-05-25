import { type CanMatchFn, Routes } from '@angular/router';

import { adminRoleChildGuard, adminRoleGuard } from './core/auth/auth.guard';

export const adminAreaCanMatch: CanMatchFn = () => true;

export const adminAreaRoutes: Routes = [
  {
    path: 'admin',
    canMatch: [adminAreaCanMatch],
    canActivate: [adminRoleGuard],
    canActivateChild: [adminRoleChildGuard],
    children: [
      {
        path: 'dashboard',
        title: 'Tableau de bord admin | KRAAK Consulting',
        loadComponent: () =>
          import('./features/admin/dashboard/dashboard.page'),
      },
      {
        path: 'programmes',
        title: 'Programmes — Admin | KRAAK Consulting',
        loadComponent: () =>
          import('./features/admin/programmes/admin-programmes.page'),
      },
      {
        path: 'ressources',
        title: 'Ressources — Admin | KRAAK Consulting',
        loadComponent: () =>
          import('./features/admin/ressources/admin-ressources.page'),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
];
