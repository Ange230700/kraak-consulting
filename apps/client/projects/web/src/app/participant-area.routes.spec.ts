import type { Route } from '@angular/router';
import { describe, expect, it } from 'vitest';

import * as runtimeConfig from './core/runtime/runtime-config';
import {
  participantAreaCanMatch,
  participantAreaRoutes,
} from './participant-area.routes';

describe('participant-area.routes', () => {
  it('Given la configuration runtime courante, When participantAreaCanMatch est évalué, Then le résultat reflète isParticipantAreaEnabled', () => {
    const route: Route = { path: 'connexion' };
    expect(participantAreaCanMatch(route, [])).toBe(
      runtimeConfig.isParticipantAreaEnabled(),
    );
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
});
