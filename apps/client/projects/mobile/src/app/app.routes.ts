import { Routes } from '@angular/router';
import {
  participantRoleChildGuard,
  participantRoleGuard,
} from './core/auth/auth.guard';
import { MOBILE_SHELL_CHILD_ROUTES } from './core/navigation/mobile-shell.config';

export const routes: Routes = [
  {
    path: 'welcome',
    loadComponent: () => import('./features/onboarding/welcome.page'),
  },
  {
    path: 'sign-in',
    loadComponent: () => import('./features/auth/sign-in.page'),
  },
  {
    path: 'sign-up',
    loadComponent: () => import('./features/auth/sign-up.page'),
  },
  {
    path: 'password-reset',
    loadComponent: () => import('./features/auth/password-reset.page'),
  },
  {
    path: 'tabs',
    loadComponent: () =>
      import('./layouts/tabs/tabs.layout').then((m) => m.TabsLayout),
    canActivate: [participantRoleGuard],
    canActivateChild: [participantRoleChildGuard],
    children: [
      ...MOBILE_SHELL_CHILD_ROUTES,
      { path: '', redirectTo: 'accueil', pathMatch: 'full' },
    ],
  },
  { path: '', redirectTo: 'tabs/accueil', pathMatch: 'full' },
  { path: '**', redirectTo: 'tabs/accueil' },
];
