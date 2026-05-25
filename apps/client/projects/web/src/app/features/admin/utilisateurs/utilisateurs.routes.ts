import type { Routes } from '@angular/router';

const utilisateursRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'list',
        title: 'Utilisateurs — Admin | KRAAK Consulting',
        loadComponent: () => import('./admin-user-list.page'),
      },
      {
        path: 'create',
        title: 'Créer un utilisateur — Admin | KRAAK Consulting',
        loadComponent: () => import('./admin-user-create-layout.page'),
        children: [
          { path: '', redirectTo: 'basic-information', pathMatch: 'full' },
          {
            path: 'basic-information',
            title: 'Informations de base — Admin | KRAAK Consulting',
            loadComponent: () => import('./steps/basic-information.page'),
          },
          {
            path: 'business-information',
            title: 'Informations professionnelles — Admin | KRAAK Consulting',
            loadComponent: () => import('./steps/business-information.page'),
          },
          {
            path: 'location-information',
            title: 'Localisation — Admin | KRAAK Consulting',
            loadComponent: () => import('./steps/location-information.page'),
          },
          {
            path: 'authorization',
            title: 'Autorisations — Admin | KRAAK Consulting',
            loadComponent: () => import('./steps/authorization.page'),
          },
          {
            path: 'account-status',
            title: 'Statut du compte — Admin | KRAAK Consulting',
            loadComponent: () => import('./steps/account-status.page'),
          },
        ],
      },
      { path: '', redirectTo: 'list', pathMatch: 'full' },
    ],
  },
];

export default utilisateursRoutes;
