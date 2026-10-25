// apps\client\projects\web\src\app\participant-area.routes.spec.ts

import { TestBed } from '@angular/core/testing';
import type {
  ActivatedRouteSnapshot,
  ResolveFn,
  Route,
  RouterStateSnapshot,
} from '@angular/router';
import { describe, expect, it } from 'vitest';

import { KraakI18nService } from '../../../shared/i18n';
import type { SeoPageDefinition } from './seo/site-seo';

import * as runtimeConfig from './core/runtime/runtime-config';
import {
  participantAreaCanMatch,
  participantAreaRoutes,
} from './participant-area.routes';

describe('participant-area.routes', () => {
  it('Given les parcours d’authentification et participant, When leurs titres et composants sont résolus, Then chaque page conserve son titre traduit et son chargement différé', async () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: KraakI18nService,
          useValue: {
            locale: () => 'fr-CI',
            translate: (key: string) => `Titre ${key}`,
          },
        },
      ],
    });
    for (const route of participantAreaRoutes) {
      if (typeof route.title === 'function') {
        const title = TestBed.runInInjectionContext(() =>
          (route.title as () => string)(),
        );
        expect(title).toMatch(/^Titre .* \| KRAAK$/);
      }
      if (route.loadComponent) {
        expect(await route.loadComponent()).toBeDefined();
      }
    }
  });
  it('Given la configuration runtime courante, When participantAreaCanMatch est évalué, Then le résultat reflète isParticipantAreaEnabled', () => {
    const route: Route = { path: 'connexion' };
    expect(participantAreaCanMatch(route, [])).toBe(
      runtimeConfig.isParticipantAreaEnabled(),
    );
  });

  it('Given la route parent participant, When sa configuration est lue, Then elle déclare le shell participant et son composant lazy', async () => {
    const participantRoot = participantAreaRoutes.find(
      (route) => route.path === 'participant',
    );

    expect(participantRoot?.data?.['appShell']).toBe('participant');
    expect(participantRoot?.loadComponent).toBeTypeOf('function');

    const shell = await participantRoot?.loadComponent?.();
    expect(shell).toBeDefined();
  });

  it('Given les routes participant, When la route parent est lue, Then la redirection dashboard est déclarée', () => {
    const participantRoot = participantAreaRoutes.find(
      (route) => route.path === 'participant',
    );
    const redirectRoute = participantRoot?.children?.find(
      (child) => child.path === '',
    );

    expect(redirectRoute?.redirectTo).toBe('dashboard');
    expect(redirectRoute?.pathMatch).toBe('full');
  });

  it('Given la route dashboard participant, When son loadComponent est invoqué, Then le module de page est résolu', async () => {
    const participantRoot = participantAreaRoutes.find(
      (route) => route.path === 'participant',
    );
    const dashboardRoute = participantRoot?.children?.find(
      (child) => child.path === 'dashboard',
    );

    expect(dashboardRoute?.loadComponent).toBeTypeOf('function');

    const module = await dashboardRoute?.loadComponent?.();
    expect(module).toBeDefined();
  });

  it('Given la route programmes participant, When son loadComponent est invoqué, Then la page de liste est résolue', async () => {
    const participantRoot = participantAreaRoutes.find(
      (route) => route.path === 'participant',
    );
    const programmesRoute = participantRoot?.children?.find(
      (child) => child.path === 'programmes',
    );

    expect(programmesRoute?.loadComponent).toBeTypeOf('function');

    const module = await programmesRoute?.loadComponent?.();
    expect(module).toBeDefined();
  });

  it('Given la route détail programme participant, When son loadComponent est invoqué, Then la page de détail est résolue', async () => {
    const participantRoot = participantAreaRoutes.find(
      (route) => route.path === 'participant',
    );
    const detailRoute = participantRoot?.children?.find(
      (child) => child.path === 'programmes/:programId',
    );

    expect(detailRoute?.loadComponent).toBeTypeOf('function');

    const module = await detailRoute?.loadComponent?.();
    expect(module).toBeDefined();
  });

  it('Given la route détail session participant, When son loadComponent est invoqué, Then la page de session est résolue', async () => {
    const participantRoot = participantAreaRoutes.find(
      (route) => route.path === 'participant',
    );
    const sessionRoute = participantRoot?.children?.find(
      (child) => child.path === 'programmes/:programId/sessions/:sessionId',
    );

    expect(sessionRoute?.loadComponent).toBeTypeOf('function');

    const module = await sessionRoute?.loadComponent?.();
    expect(module).toBeDefined();
  });

  it('Given une locale anglaise, When le SEO de connexion est résolu, Then les métadonnées restent anglaises', () => {
    const translations: Record<string, string> = {
      'web.auth.signIn.title': 'Sign in',
      'web.auth.signIn.subtitle':
        'Sign in to access your dashboard, programmes and announcements.',
      'web.auth.common.participantArea': 'Participant area',
    };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: KraakI18nService,
          useValue: {
            locale: () => 'en-GB',
            translate: (key: string) => translations[key] ?? key,
          },
        },
      ],
    });

    const signInRoute = participantAreaRoutes.find(
      (route) => route.path === 'connexion',
    );
    const resolver = signInRoute?.resolve?.['seo'] as
      | ResolveFn<SeoPageDefinition>
      | undefined;

    expect(resolver).toBeTypeOf('function');

    const seo = TestBed.runInInjectionContext(() =>
      resolver!({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as SeoPageDefinition;

    expect(seo).toMatchObject({
      title: 'Sign in | KRAAK',
      description:
        'Sign in to access your dashboard, programmes and announcements.',
      locale: 'en-GB',
      htmlLang: 'en-GB',
      openGraphLocale: 'en_GB',
    });
  });
});
