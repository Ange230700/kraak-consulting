import {
  buildMarketingRoute,
  buildRoutes,
  participantAreaCanMatch,
  routes,
} from './app.routes';
import {
  participantRoleGuard,
  participantRoleChildGuard,
} from './core/auth/auth.guard';

describe('Web routes', () => {
  const marketingPaths = [
    '',
    'a-propos',
    'services',
    'programmes',
    'ressources',
    'contact',
    'faq',
  ];
  const participantPaths = [
    'connexion',
    'inscription',
    'mot-de-passe-oublie',
    'participant',
  ];
  const builtRoutes = buildRoutes();
  const paths = builtRoutes.map((r) => r.path);

  it('When inspecting routes Then all public marketing routes are defined', () => {
    for (const path of marketingPaths) {
      expect(paths).toContain(path);
    }
  });

  it('When inspecting routes Then participant and auth routes are defined', () => {
    for (const path of participantPaths) {
      expect(paths).toContain(path);
    }
  });

  it('When inspecting routes Then a wildcard fallback loads the not-found page', () => {
    const wildcard = builtRoutes.find((r) => r.path === '**');
    expect(wildcard).toBeDefined();
    expect(wildcard!.loadComponent).toBeDefined();
    expect(wildcard!.data?.['seo']).toBeDefined();
  });

  it('When inspecting page routes Then every page component is lazy-loaded', () => {
    const pageRoutes = builtRoutes.filter(
      (r) => r.path !== '**' && r.path !== 'participant',
    );
    for (const route of pageRoutes) {
      expect(route.loadComponent).toBeDefined();
    }
  });

  it('When inspecting marketing routes Then every route exposes a title and SEO metadata', () => {
    const pageRoutes = builtRoutes.filter((route) =>
      marketingPaths.includes(route.path ?? ''),
    );

    for (const route of pageRoutes) {
      expect(route.title).toEqual(expect.any(String));
      expect(route.data?.['seo']).toBeDefined();
    }
  });

  it('When inspecting participant routes Then they are gated by the feature flag canMatch guard', () => {
    const gated = builtRoutes.filter((r) =>
      participantPaths.includes(r.path ?? ''),
    );
    expect(gated.length).toBe(participantPaths.length);
    for (const route of gated) {
      expect(route.canMatch).toContain(participantAreaCanMatch);
    }
  });

  describe('Participant authenticated routes', () => {
    it('When inspecting the participant route Then it is protected by both auth guards', () => {
      const participantRoute = builtRoutes.find(
        (r) => r.path === 'participant',
      );
      expect(participantRoute).toBeDefined();
      expect(participantRoute!.canActivate).toContain(participantRoleGuard);
      expect(participantRoute!.canActivateChild).toContain(
        participantRoleChildGuard,
      );
    });

    it('When inspecting the participant route Then a dashboard child route exists', () => {
      const participantRoute = builtRoutes.find(
        (r) => r.path === 'participant',
      );
      const dashboardRoute = participantRoute!.children?.find(
        (r) => r.path === 'dashboard',
      );
      expect(dashboardRoute).toBeDefined();
      expect(dashboardRoute!.loadComponent).toBeDefined();
    });

    it('When navigating to /participant Then the default child redirects to /participant/dashboard', () => {
      const participantRoute = builtRoutes.find(
        (r) => r.path === 'participant',
      );
      const defaultRedirect = participantRoute!.children?.find(
        (r) => r.path === '',
      );
      expect(defaultRedirect).toBeDefined();
      expect(defaultRedirect!.redirectTo).toBe('dashboard');
      expect(defaultRedirect!.pathMatch).toBe('full');
    });
  });

  describe('participantAreaCanMatch guard', () => {
    const originalConfig = globalThis.__KRAAK_RUNTIME_CONFIG__;

    afterEach(() => {
      globalThis.__KRAAK_RUNTIME_CONFIG__ = originalConfig;
    });

    it('When the flag is enabled Then the guard allows the route to match', () => {
      globalThis.__KRAAK_RUNTIME_CONFIG__ = { enableParticipantArea: true };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(participantAreaCanMatch(null as any, [] as any)).toBe(true);
    });

    it('When the flag is disabled Then the guard prevents the route from matching', () => {
      globalThis.__KRAAK_RUNTIME_CONFIG__ = { enableParticipantArea: false };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(participantAreaCanMatch(null as any, [] as any)).toBe(false);
    });
  });

  it('exports the runtime routes constant', () => {
    expect(routes.length).toBe(builtRoutes.length);
  });

  describe('buildMarketingRoute', () => {
    it('When the path has no SEO entry Then it throws a descriptive error', () => {
      expect(() =>
        buildMarketingRoute('inconnu-sans-seo', () =>
          Promise.resolve({ default: class {} }),
        ),
      ).toThrowError(/Missing SEO configuration/);
    });
  });

  describe('Lazy-loaded route components', () => {
    it('When each marketing route loadComponent is invoked Then it resolves to a component', async () => {
      const targets = builtRoutes.filter(
        (r) => r.path !== '**' && r.path !== 'participant' && r.loadComponent,
      );
      for (const route of targets) {
        const loaded = await (route.loadComponent as () => Promise<unknown>)();
        expect(loaded).toBeTruthy();
      }
    }, 15000);

    it('When the participant dashboard child loadComponent is invoked Then it resolves to a component', async () => {
      const participantRoute = builtRoutes.find(
        (r) => r.path === 'participant',
      );
      const dashboard = participantRoute!.children!.find(
        (c) => c.path === 'dashboard',
      );
      const loaded = await (
        dashboard!.loadComponent as () => Promise<unknown>
      )();
      expect(loaded).toBeTruthy();
    });
  });
});
