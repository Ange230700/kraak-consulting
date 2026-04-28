import { describe, it, expect } from 'vitest';
import { routes } from './app.routes';
import {
  participantRoleChildGuard,
  participantRoleGuard,
} from './core/auth/auth.guard';

describe('Mobile routes', () => {
  const topPaths = routes.map((r) => r.path);

  it('should define onboarding and auth routes', () => {
    expect(topPaths).toContain('welcome');
    expect(topPaths).toContain('sign-in');
    expect(topPaths).toContain('sign-up');
    expect(topPaths).toContain('password-reset');
  });

  it('should define the tabs shell route', () => {
    expect(topPaths).toContain('tabs');
    const tabsRoute = routes.find((route) => route.path === 'tabs');
    expect(tabsRoute?.canActivate).toContain(participantRoleGuard);
    expect(tabsRoute?.canActivateChild).toContain(participantRoleChildGuard);
  });

  it('should redirect empty path to tabs', () => {
    const root = routes.find((r) => r.path === '' && r.redirectTo);
    expect(root).toBeDefined();
    expect(root?.redirectTo).toBe('tabs/accueil');
  });

  it('should have a wildcard fallback to tabs', () => {
    const wildcard = routes.find((r) => r.path === '**');
    expect(wildcard).toBeDefined();
    expect(wildcard?.redirectTo).toBe('tabs/accueil');
  });

  it('Given the participant shell, when the tabs route loads, then it exposes only the four frozen MVP tabs', () => {
    const tabsRoute = routes.find((r) => r.path === 'tabs');
    const childPaths = tabsRoute?.children?.map((c) => c.path);

    expect(childPaths).not.toContain('ressources');
    expect(childPaths).toContain('accueil');
    expect(childPaths).toContain('programmes');
    expect(childPaths).toContain('annonces');
    expect(childPaths).toContain('support');
  });

  it('Given the Programmes tab, when nested content opens, then all detail routes stay inside the stack', () => {
    const tabsRoute = routes.find((r) => r.path === 'tabs');
    const programsRoute = tabsRoute?.children?.find(
      (child) => child.path === 'programmes',
    );
    const childPaths = programsRoute?.children?.map((child) => child.path);

    expect(childPaths).toEqual([
      '',
      'ressources',
      'ressources/:resourceId',
      ':programId/sessions/:sessionId',
      ':programId',
    ]);
  });

  it('Given the Annonces tab, when a participant opens a post, then the detail route is nested in the shell stack', () => {
    const tabsRoute = routes.find((r) => r.path === 'tabs');
    const announcementsRoute = tabsRoute?.children?.find(
      (child) => child.path === 'annonces',
    );
    const childPaths = announcementsRoute?.children?.map((child) => child.path);

    expect(childPaths).toEqual(['', ':announcementId']);
  });

  it('Given the Support tab, when a participant starts a request, then the request route stays inside the stack', () => {
    const tabsRoute = routes.find((r) => r.path === 'tabs');
    const supportRoute = tabsRoute?.children?.find(
      (child) => child.path === 'support',
    );
    const childPaths = supportRoute?.children?.map((child) => child.path);

    expect(childPaths).toEqual(['', 'demande']);
  });
});
