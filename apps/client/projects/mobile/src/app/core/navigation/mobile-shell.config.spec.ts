import { describe, expect, it } from 'vitest';
import {
  getMobilePrimaryTabs,
  MOBILE_PRIMARY_TABS,
  MOBILE_SHELL_CHILD_ROUTES,
  MOBILE_SHELL_SECTIONS,
} from './mobile-shell.config';

describe('mobile shell config', () => {
  it('Given the frozen MVP shell, when primary tabs are computed, then it keeps the four expected entries', () => {
    expect(MOBILE_PRIMARY_TABS).toEqual([
      {
        label: 'Accueil',
        tab: 'accueil',
        href: '/tabs/accueil',
        icon: 'home-outline',
      },
      {
        label: 'Programmes',
        tab: 'programmes',
        href: '/tabs/programmes',
        icon: 'book-outline',
      },
      {
        label: 'Annonces',
        tab: 'annonces',
        href: '/tabs/annonces',
        icon: 'megaphone-outline',
      },
      {
        label: 'Support',
        tab: 'support',
        href: '/tabs/support',
        icon: 'help-circle-outline',
      },
    ]);
  });

  it('Given the module registry, when shell child routes are generated, then each section keeps its nested stack routes', () => {
    const sectionPaths = MOBILE_SHELL_SECTIONS.map((section) => section.path);
    const routePaths = MOBILE_SHELL_CHILD_ROUTES.map((route) => route.path);

    expect(routePaths).toEqual(sectionPaths);

    const programRoute = MOBILE_SHELL_CHILD_ROUTES.find(
      (route) => route.path === 'programmes',
    );

    expect(programRoute?.children?.map((child) => child.path)).toEqual([
      '',
      'ressources',
      'ressources/:resourceId',
      ':programId/sessions/:sessionId',
      ':programId',
    ]);
  });

  it('Given the lazy participant shell, when each child loader is resolved, then every nested route exposes a component', async () => {
    const lazyChildRoutes = MOBILE_SHELL_CHILD_ROUTES.flatMap((route) =>
      (route.children ?? []).map((childRoute) => ({
        parentPath: route.path,
        childPath: childRoute.path,
        loadComponent: childRoute.loadComponent,
      })),
    );

    const resolvedChildren: {
      parentPath: string | undefined;
      childPath: string | undefined;
      component: unknown;
    }[] = [];

    for (const route of lazyChildRoutes) {
      resolvedChildren.push({
        parentPath: route.parentPath,
        childPath: route.childPath,
        component: await route.loadComponent?.(),
      });
    }

    expect(resolvedChildren).toHaveLength(10);
    expect(
      resolvedChildren.every((route) => route.component !== undefined),
    ).toBe(true);
    expect(resolvedChildren).toContainEqual(
      expect.objectContaining({
        parentPath: 'programmes',
        childPath: 'ressources/:resourceId',
      }),
    );
    expect(resolvedChildren).toContainEqual(
      expect.objectContaining({
        parentPath: 'support',
        childPath: 'demande',
      }),
    );
  }, 30000);

  it('Given a section without tab metadata, when primary tabs are computed, then that section is excluded from the tab list', () => {
    const primaryTabs = getMobilePrimaryTabs([
      ...MOBILE_SHELL_SECTIONS,
      {
        path: 'hidden-stack',
        children: [],
      },
    ]);

    expect(primaryTabs).toEqual(MOBILE_PRIMARY_TABS);
  });
});
