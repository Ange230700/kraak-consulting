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
import { environment } from '../environments/environment';

describe('Web routes', () => {
  const marketingPaths = [
    '',
    'a-propos',
    'services',
    'faq',
    'programmes',
    'ressources',
    'contact',
    'mentions-legales',
    'politique-de-confidentialite',
  ];
  const aliasRedirectPaths = ['about', 'programs', 'resources'];
  const frozenPublicPaths = [
    ...marketingPaths,
    ...aliasRedirectPaths,
    '401',
    '403',
    '500',
    '404',
    '**',
  ];
  const participantPaths = [
    'connexion',
    'inscription',
    'mot-de-passe-oublie',
    'participant',
  ];

  describe('Given public marketing pages', () => {
    it('When building routes Then all public marketing routes are defined', () => {
      const builtRoutes = buildRoutes();
      const paths = builtRoutes.map((route) => route.path);

      for (const path of marketingPaths) {
        expect(paths).toContain(path);
      }
    });

    it('When building public routes without participant area Then the frozen public surface exactly matches ARC-14 and support status pages', () => {
      const builtRoutes = buildRoutes({ includeParticipantArea: false });
      const paths = builtRoutes.map((route) => route.path ?? '');

      expect(paths).toEqual(frozenPublicPaths);
    });

    it('When inspecting marketing routes Then every route exposes a title and SEO metadata', () => {
      const builtRoutes = buildRoutes();
      const pageRoutes = builtRoutes.filter((route) =>
        marketingPaths.includes(route.path ?? ''),
      );

      for (const route of pageRoutes) {
        expect(route.title).toEqual(expect.any(String));
        expect(route.data?.['seo']).toBeDefined();
      }
    });

    it('When inspecting alias routes Then english slugs redirect to french canonical paths', () => {
      const builtRoutes = buildRoutes();
      const aboutAliasRoute = builtRoutes.find(
        (route) => route.path === 'about',
      );
      const programsAliasRoute = builtRoutes.find(
        (route) => route.path === 'programs',
      );
      const resourcesAliasRoute = builtRoutes.find(
        (route) => route.path === 'resources',
      );

      expect(aboutAliasRoute).toBeDefined();
      expect(aboutAliasRoute?.redirectTo).toBe('a-propos');
      expect(aboutAliasRoute?.pathMatch).toBe('full');

      expect(programsAliasRoute).toBeDefined();
      expect(programsAliasRoute?.redirectTo).toBe('programmes');
      expect(programsAliasRoute?.pathMatch).toBe('full');

      expect(resourcesAliasRoute).toBeDefined();
      expect(resourcesAliasRoute?.redirectTo).toBe('ressources');
      expect(resourcesAliasRoute?.pathMatch).toBe('full');
    });
  });

  describe('Given the participant area is disabled for the build', () => {
    it('When building routes Then auth and participant routes are excluded', () => {
      const builtRoutes = buildRoutes({ includeParticipantArea: false });
      const paths = builtRoutes.map((route) => route.path);

      for (const path of participantPaths) {
        expect(paths).not.toContain(path);
      }
    });
  });

  describe('Given the participant area is enabled for the build', () => {
    it('When building routes Then auth and participant routes are defined', () => {
      const builtRoutes = buildRoutes({ includeParticipantArea: true });
      const paths = builtRoutes.map((route) => route.path);

      for (const path of participantPaths) {
        expect(paths).toContain(path);
      }
    });

    it('When inspecting participant routes Then every auth and participant route is protected by canMatch gating', () => {
      const builtRoutes = buildRoutes({ includeParticipantArea: true });
      const gatedRoutes = builtRoutes.filter((route) =>
        participantPaths.includes(route.path ?? ''),
      );

      expect(gatedRoutes.length).toBe(participantPaths.length);

      for (const route of gatedRoutes) {
        expect(route.canMatch).toContain(participantAreaCanMatch);
      }
    });

    it('When inspecting the participant route Then it is protected by both auth guards', () => {
      const builtRoutes = buildRoutes({ includeParticipantArea: true });
      const participantRoute = builtRoutes.find(
        (route) => route.path === 'participant',
      );

      expect(participantRoute).toBeDefined();
      expect(participantRoute!.canActivate).toContain(participantRoleGuard);
      expect(participantRoute!.canActivateChild).toContain(
        participantRoleChildGuard,
      );
    });

    it('When inspecting the participant route Then a dashboard child route exists', () => {
      const builtRoutes = buildRoutes({ includeParticipantArea: true });
      const participantRoute = builtRoutes.find(
        (route) => route.path === 'participant',
      );
      const dashboardRoute = participantRoute!.children?.find(
        (route) => route.path === 'dashboard',
      );

      expect(dashboardRoute).toBeDefined();
      expect(dashboardRoute!.loadComponent).toBeDefined();
    });

    it('When navigating to /participant Then the default child redirects to /participant/dashboard', () => {
      const builtRoutes = buildRoutes({ includeParticipantArea: true });
      const participantRoute = builtRoutes.find(
        (route) => route.path === 'participant',
      );
      const defaultRedirect = participantRoute!.children?.find(
        (route) => route.path === '',
      );

      expect(defaultRedirect).toBeDefined();
      expect(defaultRedirect!.redirectTo).toBe('dashboard');
      expect(defaultRedirect!.pathMatch).toBe('full');
    });
  });

  describe('Given the route table', () => {
    it('When inspecting public routes Then auth routes stay outside the frozen vitrine surface', () => {
      const builtRoutes = buildRoutes({ includeParticipantArea: false });
      const paths = builtRoutes.map((route) => route.path ?? '');

      for (const path of participantPaths) {
        expect(paths).not.toContain(path);
      }
    });

    it('When inspecting routes Then /401 serves the dedicated unauthorized page with SEO metadata', () => {
      const builtRoutes = buildRoutes();
      const unauthorizedRoute = builtRoutes.find(
        (route) => route.path === '401',
      );

      expect(unauthorizedRoute).toBeDefined();
      expect(unauthorizedRoute!.loadComponent).toBeDefined();
      expect(unauthorizedRoute!.title).toBe(
        'Authentification requise | KRAAK Consulting',
      );
      expect(unauthorizedRoute!.data?.['seo']).toBeDefined();
    });

    it('When inspecting routes Then /403 serves the dedicated forbidden page with SEO metadata', () => {
      const builtRoutes = buildRoutes();
      const forbiddenRoute = builtRoutes.find((route) => route.path === '403');

      expect(forbiddenRoute).toBeDefined();
      expect(forbiddenRoute!.loadComponent).toBeDefined();
      expect(forbiddenRoute!.title).toBe('Accès refusé | KRAAK Consulting');
      expect(forbiddenRoute!.data?.['seo']).toBeDefined();
    });

    it('When inspecting routes Then /500 serves the dedicated server-error page with SEO metadata', () => {
      const builtRoutes = buildRoutes();
      const serverErrorRoute = builtRoutes.find(
        (route) => route.path === '500',
      );

      expect(serverErrorRoute).toBeDefined();
      expect(serverErrorRoute!.loadComponent).toBeDefined();
      expect(serverErrorRoute!.title).toBe(
        'Incident technique | KRAAK Consulting',
      );
      expect(serverErrorRoute!.data?.['seo']).toBeDefined();
    });

    it('When inspecting routes Then /404 serves the dedicated not-found page with SEO metadata', () => {
      const builtRoutes = buildRoutes();
      const notFoundRoute = builtRoutes.find((route) => route.path === '404');

      expect(notFoundRoute).toBeDefined();
      expect(notFoundRoute!.loadComponent).toBeDefined();
      expect(notFoundRoute!.title).toBe('Page introuvable | KRAAK Consulting');
      expect(notFoundRoute!.data?.['seo']).toBeDefined();
    });

    it('When inspecting routes Then a wildcard fallback serves the dedicated not-found page', () => {
      const builtRoutes = buildRoutes();
      const wildcard = builtRoutes.find((route) => route.path === '**');

      expect(wildcard).toBeDefined();
      expect(wildcard!.loadComponent).toBeDefined();
      expect(wildcard!.title).toBe('Page introuvable | KRAAK Consulting');
      expect(wildcard!.data?.['seo']).toBeDefined();
    });

    it('When inspecting page routes Then every page component is lazy-loaded', () => {
      const builtRoutes = buildRoutes({ includeParticipantArea: true });
      const pageRoutes = builtRoutes.filter(
        (route) =>
          route.path !== '**' &&
          route.path !== 'participant' &&
          !route.redirectTo,
      );

      for (const route of pageRoutes) {
        expect(route.loadComponent).toBeDefined();
      }
    });

    it('When comparing exported routes Then they match the environment default', () => {
      const exportedPaths = routes.map((route) => route.path);
      const rebuiltPaths = buildRoutes({
        includeParticipantArea: environment.enableParticipantArea,
      }).map((route) => route.path);

      expect(exportedPaths).toEqual(rebuiltPaths);
    });
  });

  describe('Given buildMarketingRoute', () => {
    it('When the path has no SEO entry Then it throws a descriptive error', () => {
      class MissingSeoComponent {
        static readonly marker = 'missing-seo';
      }

      expect(() =>
        buildMarketingRoute('inconnu-sans-seo', () =>
          Promise.resolve({ default: MissingSeoComponent }),
        ),
      ).toThrowError(/Missing SEO configuration/);
    });
  });

  describe('Given lazy-loaded route components', () => {
    it('When each marketing route loadComponent is invoked Then it resolves to a component', async () => {
      const builtRoutes = buildRoutes({ includeParticipantArea: true });
      const targets = builtRoutes.filter(
        (route) =>
          route.path !== '**' &&
          route.path !== 'participant' &&
          route.loadComponent,
      );

      for (const route of targets) {
        const loaded = await (route.loadComponent as () => Promise<unknown>)();
        expect(loaded).toBeTruthy();
      }
    }, 15000);

    it('When the participant dashboard child loadComponent is invoked Then it resolves to a component', async () => {
      const builtRoutes = buildRoutes({ includeParticipantArea: true });
      const participantRoute = builtRoutes.find(
        (route) => route.path === 'participant',
      );
      const dashboardRoute = participantRoute!.children!.find(
        (childRoute) => childRoute.path === 'dashboard',
      );

      const loaded = await (
        dashboardRoute!.loadComponent as () => Promise<unknown>
      )();

      expect(loaded).toBeTruthy();
    });
  });
});
