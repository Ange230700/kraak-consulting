import { describe, expect, it } from 'vitest';
import type { Route } from '@angular/router';
import { adminAreaCanMatch, adminAreaRoutes } from './admin-area.routes';
import { TestBed } from '@angular/core/testing';
import { KraakI18nService } from '../../../shared/i18n';

describe('admin-area.routes', () => {
  it('Given les routes administrateur, When leurs titres sont résolus, Then chaque page utilise sa clé de traduction', () => {
    const translate = (key: string) => `Titre : ${key}`;
    TestBed.configureTestingModule({
      providers: [{ provide: KraakI18nService, useValue: { translate } }],
    });
    for (const route of adminAreaRoutes[0].children!.filter(
      (entry) => typeof entry.title === 'function',
    )) {
      const title = TestBed.runInInjectionContext(() =>
        (route.title as () => string)(),
      );
      expect(title).toMatch(/^Titre : web\.admin\.routes\./);
    }
  });
  it('Given the admin area route guard, When canMatch is evaluated, Then it returns true', () => {
    const route: Route = { path: 'admin' };
    expect(adminAreaCanMatch(route, [])).toBe(true);
  });

  it('Given admin routes, When reading children paths, Then dashboard, programmes, curriculum and ressources routes are declared', () => {
    const adminRoot = adminAreaRoutes.find((route) => route.path === 'admin');
    const childPaths = (adminRoot?.children ?? []).map((child) => child.path);

    expect(childPaths).toContain('dashboard');
    expect(childPaths).toContain('programmes');
    expect(childPaths).toContain('curriculum');
    expect(childPaths).toContain('ressources');
    expect(childPaths).toContain('');
  });

  it('Given la route dashboard admin, When son loadComponent est invoqué, Then le module de page est résolu', async () => {
    const adminRoot = adminAreaRoutes.find((route) => route.path === 'admin');
    const dashboardRoute = adminRoot?.children?.find(
      (child) => child.path === 'dashboard',
    );

    expect(dashboardRoute?.loadComponent).toBeTypeOf('function');

    const module = await dashboardRoute?.loadComponent?.();
    expect(module).toBeDefined();
  });

  it('Given la route programmes admin, When son loadComponent est invoqué, Then le module de page est résolu', async () => {
    const adminRoot = adminAreaRoutes.find((route) => route.path === 'admin');
    const programmesRoute = adminRoot?.children?.find(
      (child) => child.path === 'programmes',
    );

    expect(programmesRoute?.loadComponent).toBeTypeOf('function');

    const module = await programmesRoute?.loadComponent?.();
    expect(module).toBeDefined();
  });

  it('Given la route curriculum admin, When son loadComponent est invoqué, Then le module de page est résolu', async () => {
    const adminRoot = adminAreaRoutes.find((route) => route.path === 'admin');
    const curriculumRoute = adminRoot?.children?.find(
      (child) => child.path === 'curriculum',
    );

    expect(curriculumRoute?.loadComponent).toBeTypeOf('function');

    const module = await curriculumRoute?.loadComponent?.();
    expect(module).toBeDefined();
  });

  it('Given la route ressources admin, When son loadComponent est invoqué, Then le module de page est résolu', async () => {
    const adminRoot = adminAreaRoutes.find((route) => route.path === 'admin');
    const ressourcesRoute = adminRoot?.children?.find(
      (child) => child.path === 'ressources',
    );

    expect(ressourcesRoute?.loadComponent).toBeTypeOf('function');

    const module = await ressourcesRoute?.loadComponent?.();
    expect(module).toBeDefined();
  });

  it('Given la route utilisateurs admin, When son loadChildren est invoqué, Then le module de routes enfants est résolu', async () => {
    const adminRoot = adminAreaRoutes.find((route) => route.path === 'admin');
    const usersRoute = adminRoot?.children?.find(
      (child) => child.path === 'utilisateurs',
    );

    expect(usersRoute?.loadChildren).toBeTypeOf('function');

    const module = await usersRoute?.loadChildren?.();
    expect(module).toBeDefined();
  });
});
