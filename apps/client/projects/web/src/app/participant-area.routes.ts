// apps\client\projects\web\src\app\participant-area.routes.ts

import { inject } from '@angular/core';
import {
  type CanMatchFn,
  type ResolveFn,
  type Route,
  Routes,
} from '@angular/router';
import { resolveSupportedLocale } from '@kraak/domain';

import {
  participantRoleGuard,
  participantRoleChildGuard,
} from './core/auth/auth.guard';
import { isParticipantAreaEnabled } from './core/runtime/runtime-config';
import { KraakI18nService } from '../../../shared/i18n/kraak-i18n.service';
import { type SeoPageDefinition } from './seo/site-seo';

export const participantAreaCanMatch: CanMatchFn = () =>
  isParticipantAreaEnabled();

const AUTH_ROBOTS_DIRECTIVE = 'noindex, nofollow';
const PARTICIPANT_SHARE_IMAGE =
  '/assets/site-visuals/photos/home-hero-workshop.jpg';

interface ParticipantSeoOptions {
  readonly path: string;
  readonly titleKey: string;
  readonly descriptionKey: string;
}

const translatedTitle =
  (key: string): ResolveFn<string> =>
  () => {
    const i18n = inject(KraakI18nService);
    return `${i18n.translate(key)} | KRAAK`;
  };

const participantSeo =
  ({
    path,
    titleKey,
    descriptionKey,
  }: ParticipantSeoOptions): ResolveFn<SeoPageDefinition> =>
  () => {
    const i18n = inject(KraakI18nService);
    const locale = resolveSupportedLocale(i18n.locale());
    const title = `${i18n.translate(titleKey)} | KRAAK`;
    const description = i18n.translate(descriptionKey);

    return {
      path,
      title,
      description,
      robots: AUTH_ROBOTS_DIRECTIVE,
      locale,
      htmlLang: locale,
      openGraphLocale: locale.replace('-', '_'),
      openGraph: {
        title,
        description,
        imagePath: PARTICIPANT_SHARE_IMAGE,
        imageAlt: `${i18n.translate(
          'web.auth.common.participantArea',
        )} | KRAAK Consulting`,
      },
      sitemap: {
        changeFrequency: 'never',
        priority: 0.1,
      },
    };
  };

function authenticationPage(
  path: string,
  titleKey: string,
  descriptionKey: string,
  loadComponent: NonNullable<Route['loadComponent']>,
): Route {
  return {
    path,
    canMatch: [participantAreaCanMatch],
    title: translatedTitle(titleKey),
    resolve: {
      seo: participantSeo({
        path,
        titleKey,
        descriptionKey,
      }),
    },
    loadComponent,
  };
}

export const participantAreaRoutes: Routes = [
  authenticationPage(
    'connexion',
    'web.auth.signIn.title',
    'web.auth.signIn.subtitle',
    () => import('./features/auth/sign-in.page'),
  ),
  authenticationPage(
    'inscription',
    'web.auth.signUp.title',
    'web.auth.signUp.subtitle',
    () => import('./features/auth/sign-up.page'),
  ),
  authenticationPage(
    'mot-de-passe-oublie',
    'web.auth.signIn.forgotPassword',
    'web.auth.forgotPassword.subtitle',
    () => import('./features/auth/password-reset.page'),
  ),
  {
    path: 'participant',
    canMatch: [participantAreaCanMatch],
    data: {
      appShell: 'participant',
    },
    resolve: {
      seo: participantSeo({
        path: 'participant/dashboard',
        titleKey: 'web.auth.common.participantArea',
        descriptionKey: 'web.participant.dashboard.hero.intro',
      }),
    },
    canActivate: [participantRoleGuard],
    canActivateChild: [participantRoleChildGuard],
    loadComponent: () =>
      import('./features/participant/layout/participant-shell.component').then(
        (m) => m.default,
      ),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/participant/dashboard/dashboard.page').then(
            (m) => m.default,
          ),
      },
      {
        path: 'programmes',
        loadComponent: () =>
          import('./features/participant/programs/program-list.page').then(
            (m) => m.default,
          ),
      },
      {
        path: 'programmes/:programId/sessions/:sessionId',
        loadComponent: () =>
          import('./features/participant/programs/session-detail.page').then(
            (m) => m.default,
          ),
      },
      {
        path: 'programmes/:programId',
        loadComponent: () =>
          import('./features/participant/programs/program-detail.page').then(
            (m) => m.default,
          ),
      },
    ],
  },
];
