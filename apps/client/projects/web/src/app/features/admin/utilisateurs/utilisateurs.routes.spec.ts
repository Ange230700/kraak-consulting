import { describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ResolveFn, Routes } from '@angular/router';
import { KraakI18nService } from '../../../../../../shared/i18n';

import utilisateursRoutes from './utilisateurs.routes';

describe('utilisateurs.routes', () => {
  it('Given les routes utilisateurs traduites, When leurs titres sont résolus, Then chaque clé de navigation est transmise au service de langue', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: KraakI18nService,
          useValue: { translate: (key: string) => `traduit:${key}` },
        },
      ],
    });
    const titles: string[] = [];
    const visit = (entries: Routes) => {
      for (const route of entries) {
        if (typeof route.title === 'function') {
          titles.push(
            TestBed.runInInjectionContext(() =>
              (route.title as ResolveFn<string>)({} as never, {} as never),
            ) as string,
          );
        }
        if (route.children) visit(route.children);
      }
    };
    visit(utilisateursRoutes);
    expect(titles).toHaveLength(7);
    expect(titles).toContain('traduit:web.admin.users.routes.basicInformation');
    expect(
      titles.every((title) =>
        title.startsWith('traduit:web.admin.users.routes.'),
      ),
    ).toBe(true);
  });
  it('Given le shell utilisateurs, When sa route racine est chargée, Then le composant de navigation est disponible', async () => {
    expect(utilisateursRoutes[0].children).toBeDefined();
  });
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
