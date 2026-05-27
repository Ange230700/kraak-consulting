import { type CanMatchFn, Routes } from '@angular/router';

import {
  participantRoleGuard,
  participantRoleChildGuard,
} from './core/auth/auth.guard';
import { isParticipantAreaEnabled } from './core/runtime/runtime-config';
import { type SeoPageDefinition } from './seo/site-seo';

export const participantAreaCanMatch: CanMatchFn = () =>
  isParticipantAreaEnabled();

const AUTH_ROBOTS_DIRECTIVE = 'noindex, nofollow';

const authOpenGraph = {
  title: 'Accès participant | KRAAK Consulting',
  description:
    'Accédez à votre espace participant KRAAK pour gérer votre session en toute sécurité.',
  imagePath: '/assets/site-visuals/photos/home-hero-workshop.jpg',
  imageAlt:
    "Photo d'un atelier KRAAK Consulting avec des participants en session de travail.",
};

const signInSeo: SeoPageDefinition = {
  path: 'connexion',
  title: 'Connexion | KRAAK',
  description:
    'Connectez-vous à votre espace KRAAK pour reprendre votre parcours participant.',
  robots: AUTH_ROBOTS_DIRECTIVE,
  openGraph: authOpenGraph,
  sitemap: {
    changeFrequency: 'never',
    priority: 0.1,
  },
};

const signUpSeo: SeoPageDefinition = {
  path: 'inscription',
  title: 'Inscription | KRAAK',
  description:
    'Créez votre accès participant KRAAK pour suivre vos prochaines étapes.',
  robots: AUTH_ROBOTS_DIRECTIVE,
  openGraph: authOpenGraph,
  sitemap: {
    changeFrequency: 'never',
    priority: 0.1,
  },
};

const passwordResetSeo: SeoPageDefinition = {
  path: 'mot-de-passe-oublie',
  title: 'Mot de passe oublié | KRAAK',
  description:
    'Demandez un lien de réinitialisation pour sécuriser votre accès participant.',
  robots: AUTH_ROBOTS_DIRECTIVE,
  openGraph: authOpenGraph,
  sitemap: {
    changeFrequency: 'never',
    priority: 0.1,
  },
};

const participantDashboardSeo: SeoPageDefinition = {
  path: 'participant/dashboard',
  title: 'Espace participant | KRAAK',
  description:
    'Consultez votre tableau de bord participant KRAAK et poursuivez votre progression.',
  robots: AUTH_ROBOTS_DIRECTIVE,
  openGraph: authOpenGraph,
  sitemap: {
    changeFrequency: 'never',
    priority: 0.1,
  },
};

export const participantAreaRoutes: Routes = [
  {
    path: 'connexion',
    title: 'Connexion | KRAAK',
    data: { seo: signInSeo },
    canMatch: [participantAreaCanMatch],
    loadComponent: () => import('./features/auth/sign-in.page'),
  },
  {
    path: 'inscription',
    title: 'Inscription | KRAAK',
    data: { seo: signUpSeo },
    canMatch: [participantAreaCanMatch],
    loadComponent: () => import('./features/auth/sign-up.page'),
  },
  {
    path: 'mot-de-passe-oublie',
    title: 'Mot de passe oublié | KRAAK',
    data: { seo: passwordResetSeo },
    canMatch: [participantAreaCanMatch],
    loadComponent: () => import('./features/auth/password-reset.page'),
  },
  {
    path: 'participant',
    data: { seo: participantDashboardSeo },
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
