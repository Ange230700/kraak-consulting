import { type CanMatchFn, Routes } from '@angular/router';

import {
  participantRoleGuard,
  participantRoleChildGuard,
} from './core/auth/auth.guard';
import { isParticipantAreaEnabled } from './core/runtime/runtime-config';

export const participantAreaCanMatch: CanMatchFn = () =>
  isParticipantAreaEnabled();

export const participantAreaRoutes: Routes = [
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
    title: 'Mot de passe oublié | KRAAK',
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
