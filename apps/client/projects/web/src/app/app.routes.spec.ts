import { routes } from './app.routes';
import {
  participantRoleGuard,
  participantRoleChildGuard,
} from './core/auth/auth.guard';

describe('Web routes', () => {
  const paths = routes.map((r) => r.path);

  it('should define all public marketing routes', () => {
    expect(paths).toContain('');
    expect(paths).toContain('a-propos');
    expect(paths).toContain('services');
    expect(paths).toContain('programmes');
    expect(paths).toContain('contact');
  });

  it('should have a wildcard fallback redirecting to home', () => {
    const wildcard = routes.find((r) => r.path === '**');
    expect(wildcard).toBeDefined();
    expect(wildcard!.redirectTo).toBe('');
  });

  it('should lazy-load every page component', () => {
    const pageRoutes = routes.filter(
      (r) => r.path !== '**' && r.path !== 'participant',
    );
    for (const route of pageRoutes) {
      expect(route.loadComponent).toBeDefined();
    }
  });

  it('should attach a title and SEO metadata to every public marketing route', () => {
    const pageRoutes = routes.filter(
      (r) => r.path !== '**' && r.path !== 'participant',
    );

    for (const route of pageRoutes) {
      expect(route.title).toEqual(expect.any(String));
      expect(route.data?.['seo']).toBeDefined();
    }
  });

  describe('Participant authenticated routes', () => {
    it('should define a protected participant route with auth guards', () => {
      const participantRoute = routes.find((r) => r.path === 'participant');
      expect(participantRoute).toBeDefined();
      expect(participantRoute!.canActivate).toContain(participantRoleGuard);
      expect(participantRoute!.canActivateChild).toContain(
        participantRoleChildGuard,
      );
    });

    it('should have a dashboard child route under participant', () => {
      const participantRoute = routes.find((r) => r.path === 'participant');
      const dashboardRoute = participantRoute!.children?.find(
        (r) => r.path === 'dashboard',
      );
      expect(dashboardRoute).toBeDefined();
      expect(dashboardRoute!.loadComponent).toBeDefined();
    });

    it('should redirect from /participant to /participant/dashboard', () => {
      const participantRoute = routes.find((r) => r.path === 'participant');
      const defaultRedirect = participantRoute!.children?.find(
        (r) => r.path === '',
      );
      expect(defaultRedirect).toBeDefined();
      expect(defaultRedirect!.redirectTo).toBe('dashboard');
      expect(defaultRedirect!.pathMatch).toBe('full');
    });
  });
});
