import { describe, expect, it } from 'vitest';

import utilisateursRoutes from './utilisateurs.routes';

describe('utilisateurs.routes', () => {
  it('Given les routes utilisateurs, When la structure est lue, Then les redirections par défaut sont définies', () => {
    const root = utilisateursRoutes[0];
    const children = root?.children ?? [];

    const defaultRootRedirect = children.find((route) => route.path === '');
    const createRoute = children.find((route) => route.path === 'create');
    const createChildren = createRoute?.children ?? [];
    const defaultCreateRedirect = createChildren.find(
      (route) => route.path === '',
    );

    expect(defaultRootRedirect?.redirectTo).toBe('list');
    expect(defaultRootRedirect?.pathMatch).toBe('full');
    expect(defaultCreateRedirect?.redirectTo).toBe('basic-information');
    expect(defaultCreateRedirect?.pathMatch).toBe('full');
  });

  it('Given les routes lazy utilisateurs, When leurs loaders sont invoqués, Then chaque module est résolu', async () => {
    const root = utilisateursRoutes[0];
    const children = root?.children ?? [];

    const listRoute = children.find((route) => route.path === 'list');
    const createRoute = children.find((route) => route.path === 'create');
    const stepRoutes = createRoute?.children?.filter(
      (route) => route.path && route.path !== '',
    );

    expect(listRoute?.loadComponent).toBeTypeOf('function');
    expect(createRoute?.loadComponent).toBeTypeOf('function');
    expect(stepRoutes).toHaveLength(5);

    const loaders = [
      listRoute?.loadComponent,
      createRoute?.loadComponent,
      ...(stepRoutes?.map((route) => route.loadComponent) ?? []),
    ].filter(
      (loader): loader is NonNullable<typeof loader> =>
        typeof loader === 'function',
    );

    const modules = await Promise.all(
      loaders.map(async (loader) => await loader()),
    );
    expect(modules).toHaveLength(7);
    expect(modules.every((module) => module !== undefined)).toBe(true);
  });
});
