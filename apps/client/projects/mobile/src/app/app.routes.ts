import { Routes } from '@angular/router';
import { participantRoleGuard } from './core/auth/auth.guard';

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
    children: [
      {
        path: 'accueil',
        loadComponent: () => import('./features/dashboard/home.page'),
      },
      {
        path: 'programmes',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/programs/program-list.page'),
          },
          {
            path: 'ressources',
            loadComponent: () =>
              import('./features/resources/resource-list.page'),
          },
          {
            path: 'ressources/:resourceId',
            loadComponent: () =>
              import('./features/resources/resource-detail.page'),
          },
          {
            path: ':programId/sessions/:sessionId',
            loadComponent: () =>
              import('./features/programs/session-detail.page'),
          },
          {
            path: ':programId',
            loadComponent: () =>
              import('./features/programs/program-detail.page'),
          },
        ],
      },
      {
        path: 'annonces',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/announcements/announcement-list.page'),
          },
          {
            path: ':announcementId',
            loadComponent: () =>
              import('./features/announcements/announcement-detail.page'),
          },
        ],
      },
      {
        path: 'support',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/support/support.page'),
          },
          {
            path: 'demande',
            loadComponent: () =>
              import('./features/support/support-request.page'),
          },
        ],
      },
      { path: '', redirectTo: 'accueil', pathMatch: 'full' },
    ],
  },
  { path: '', redirectTo: 'tabs/accueil', pathMatch: 'full' },
  { path: '**', redirectTo: 'tabs/accueil' },
];
