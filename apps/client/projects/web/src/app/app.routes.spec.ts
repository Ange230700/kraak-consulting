// apps\client\projects\web\src\app\app.routes.spec.ts

import { Routes } from '@angular/router';

import { environment } from '../environments/environment';
import {
  buildMarketingRoute,
  buildRoutes,
  participantAreaCanMatch,
  routes,
} from './app.routes';
import {
  adminRoleChildGuard,
  adminRoleGuard,
  participantRoleChildGuard,
  participantRoleGuard,
} from './core/auth/auth.guard';
import NotFoundPage from './features/support/not-found.page';
import {
  localizedPublicRouteEntries,
  renderPublicRedirects,
  toAngularRoutePath,
} from './routing/localized-public-routes';

const PARTICIPANT_ROUTE_PATHS = [
  'connexion',
  'inscription',
  'mot-de-passe-oublie',
  'participant',
];

function routePathsOf(routeList: Routes): (string | undefined)[] {
  return routeList.map((route) => route.path);
}

function localeRoute(routeList: Routes, path: 'fr' | 'en') {
  return routeList.find((route) => route.path === path);
}

describe('Web routes', () => {
  describe('Given localized public routes', () => {
    it('When building routes Then the public locale route trees are defined', () => {
      const builtRoutes = buildRoutes({ includeParticipantArea: false });
      const routePaths = routePathsOf(builtRoutes);

      expect(routePaths).toContain('fr');
      expect(routePaths).toContain('en');
    });

    it('When inspecting the French route tree Then every French public child route is present', () => {
      const frenchRoute = localeRoute(
        buildRoutes({ includeParticipantArea: false }),
        'fr',
      );
      const frenchChildPaths = routePathsOf(frenchRoute?.children ?? []);

      expect(frenchChildPaths).toEqual([
        '',
        'a-propos',
        'services',
        'faq',
        'programmes',
        'ressources',
        'contact',
        'mentions-legales',
        'politique-de-confidentialite',
        '401',
        '403',
        '404',
        '500',
        '**',
      ]);
    });

    it('When inspecting the English route tree Then every scaffold child route is present', () => {
      const englishRoute = localeRoute(
        buildRoutes({ includeParticipantArea: false }),
        'en',
      );
      const englishChildPaths = routePathsOf(englishRoute?.children ?? []);

      expect(englishChildPaths).toEqual([
        '',
        'about',
        'services',
        'faq',
        'programs',
        'resources',
        'contact',
        'legal-notice',
        'privacy-policy',
        '401',
        '403',
        '404',
        '500',
        '**',
      ]);
    });

    it('When inspecting localized page routes Then every public route exposes title and SEO metadata', () => {
      const builtRoutes = buildRoutes({ includeParticipantArea: false });

      for (const localePath of ['fr', 'en'] as const) {
        const publicRoute = localeRoute(builtRoutes, localePath);

        expect(publicRoute?.resolve?.['locale']).toBeDefined();

        for (const childRoute of publicRoute?.children ?? []) {
          if (childRoute.path === '**') {
            continue;
          }

          expect(childRoute.title).toEqual(expect.any(String));
          expect(childRoute.data?.['seo']).toBeDefined();
          expect(childRoute.loadComponent).toBeDefined();
        }
      }
    });

    it('When inspecting English scaffold routes Then their SEO policy blocks indexing', () => {
      const englishRoute = localeRoute(
        buildRoutes({ includeParticipantArea: false }),
        'en',
      );
      const pageRoutes = (englishRoute?.children ?? []).filter(
        (route) => route.path !== '**',
      );

      for (const route of pageRoutes) {
        expect(route.data?.['seo']?.robots).toBe('noindex, nofollow');
        expect(route.data?.['seo']?.temporary).toBe(true);
      }
    });

    it('When inspecting locale-aware wildcard routes Then localized 404 metadata is used', () => {
      const builtRoutes = buildRoutes({ includeParticipantArea: false });
      const frenchWildcard = localeRoute(builtRoutes, 'fr')?.children?.find(
        (route) => route.path === '**',
      );
      const englishWildcard = localeRoute(builtRoutes, 'en')?.children?.find(
        (route) => route.path === '**',
      );

      expect(frenchWildcard?.data?.['seo']?.path).toBe('/fr/404');
      expect(englishWildcard?.data?.['seo']?.path).toBe('/en/404');
      expect(englishWildcard?.data?.['seo']?.robots).toBe('noindex, nofollow');
    });
  });

  describe('Given legacy public routes', () => {
    it('When inspecting root route Then it redirects to the French localized home', () => {
      const rootRoute = buildRoutes({ includeParticipantArea: false }).find(
        (route) => route.path === '',
      );

      expect(rootRoute).toEqual({
        path: '',
        redirectTo: '/fr/',
        pathMatch: 'full',
      });
    });

    it('When inspecting legacy redirects Then every rule targets a French localized route without loops', () => {
      const builtRoutes = buildRoutes({ includeParticipantArea: false });

      for (const redirect of renderPublicRedirects) {
        const route = builtRoutes.find(
          (candidate) => candidate.path === toAngularRoutePath(redirect.source),
        );

        expect(route?.redirectTo).toBe(redirect.destination);
        expect(route?.pathMatch).toBe('full');
        expect(redirect.destination.startsWith('/fr/')).toBe(true);
        expect(redirect.destination).not.toBe(redirect.source);
      }
    });

    it('When inspecting conservative English aliases Then they redirect to French canonical paths for PR 3', () => {
      const builtRoutes = buildRoutes({ includeParticipantArea: false });

      expect(
        builtRoutes.find((route) => route.path === 'about')?.redirectTo,
      ).toBe('/fr/a-propos');
      expect(
        builtRoutes.find((route) => route.path === 'programs')?.redirectTo,
      ).toBe('/fr/programmes');
      expect(
        builtRoutes.find((route) => route.path === 'resources')?.redirectTo,
      ).toBe('/fr/ressources');
    });
  });

  describe('Given stable private and technical routes', () => {
    it('When building public routes without participant area Then private auth routes stay outside the vitrine surface', () => {
      const publicRoutes = buildRoutes({ includeParticipantArea: false });
      const routePaths = routePathsOf(publicRoutes);

      for (const participantPath of PARTICIPANT_ROUTE_PATHS) {
        expect(routePaths).not.toContain(participantPath);
        expect(routePaths).not.toContain(`fr/${participantPath}`);
        expect(routePaths).not.toContain(`en/${participantPath}`);
      }
    });

    it('When building routes with participant area enabled Then auth and participant routes are defined without locale prefixes', () => {
      const previewRoutes = buildRoutes({ includeParticipantArea: true });
      const routePaths = routePathsOf(previewRoutes);

      for (const participantPath of PARTICIPANT_ROUTE_PATHS) {
        expect(routePaths).toContain(participantPath);
      }
    });

    it('When inspecting participant routes Then every auth and participant route is protected by canMatch gating', () => {
      const builtRoutes = buildRoutes({ includeParticipantArea: true });
      const gatedRoutes = builtRoutes.filter((route) =>
        PARTICIPANT_ROUTE_PATHS.includes(route.path ?? ''),
      );

      expect(gatedRoutes).toHaveLength(PARTICIPANT_ROUTE_PATHS.length);

      for (const route of gatedRoutes) {
        expect(route.canMatch).toContain(participantAreaCanMatch);
      }
    });

    it('When inspecting auth reset Then the path and noindex policy remain unchanged', () => {
      const authResetRoute = buildRoutes().find(
        (route) => route.path === 'auth/reset',
      );

      expect(authResetRoute?.data?.['seo']?.path).toBe('auth/reset');
      expect(authResetRoute?.data?.['seo']?.robots).toBe('noindex, nofollow');
    });

    it('When inspecting the admin route Then it remains unlocalized and guarded', () => {
      const builtRoutes = buildRoutes();
      const adminRoute = builtRoutes.find((route) => route.path === 'admin');

      expect(adminRoute).toBeDefined();
      expect(adminRoute!.canActivate).toContain(adminRoleGuard);
      expect(adminRoute!.canActivateChild).toContain(adminRoleChildGuard);
      expect(routePathsOf(adminRoute!.children ?? [])).toContain('dashboard');
    });

    it('When inspecting the participant route Then it remains unlocalized and guarded', () => {
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
  });

  describe('Given the route table', () => {
    it('When inspecting unsupported prefixes Then they are not accepted as localized public route trees', () => {
      const routePaths = routePathsOf(buildRoutes());

      expect(routePaths).not.toContain('de');
      expect(routePaths).not.toContain(':locale');
    });

    it('When comparing exported routes Then they match the environment default', () => {
      const exportedPaths = routes.map((route) => route.path);
      const rebuiltPaths = buildRoutes({
        includeParticipantArea: environment.enableParticipantArea,
      }).map((route) => route.path);

      expect(exportedPaths).toEqual(rebuiltPaths);
    });

    it('When building routes with the environment default Then participant routes follow environment.enableParticipantArea', () => {
      const routePaths = routePathsOf(buildRoutes());

      for (const participantPath of PARTICIPANT_ROUTE_PATHS) {
        if (environment.enableParticipantArea) {
          expect(routePaths).toContain(participantPath);
        } else {
          expect(routePaths).not.toContain(participantPath);
        }
      }
    });

    it('When comparing localized entries to Angular child routes Then every entry is represented once', () => {
      const builtRoutes = buildRoutes({ includeParticipantArea: false });
      const angularPaths = new Set<string>();

      for (const localePath of ['fr', 'en'] as const) {
        for (const childRoute of localeRoute(builtRoutes, localePath)
          ?.children ?? []) {
          if (childRoute.path !== '**') {
            angularPaths.add(
              childRoute.path ? `${localePath}/${childRoute.path}` : localePath,
            );
          }
        }
      }

      expect([...angularPaths].sort()).toEqual(
        localizedPublicRouteEntries.map((entry) => entry.routePath).sort(),
      );
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
    it('When each localized public route loadComponent is invoked Then it resolves to a component', async () => {
      const builtRoutes = buildRoutes({ includeParticipantArea: false });
      const targets = ['fr', 'en'].flatMap(
        (localePath) =>
          localeRoute(builtRoutes, localePath as 'fr' | 'en')?.children?.filter(
            (route) => route.path !== '**' && route.loadComponent,
          ) ?? [],
      );

      for (const route of targets) {
        const loaded = await (route.loadComponent as () => Promise<unknown>)();
        expect(loaded).toBeTruthy();
      }
    }, 45000);

    it('When the wildcard route loadComponent is invoked Then it resolves to the not-found page component', async () => {
      const builtRoutes = buildRoutes({ includeParticipantArea: true });
      const wildcard = builtRoutes.find((route) => route.path === '**');

      expect(wildcard?.loadComponent).toBeDefined();

      const loaded = await (
        wildcard!.loadComponent as () => Promise<unknown>
      )();
      const resolvedComponent =
        (loaded as { default?: unknown }).default ?? loaded;

      expect(resolvedComponent).toBe(NotFoundPage);
    });
  });
});
