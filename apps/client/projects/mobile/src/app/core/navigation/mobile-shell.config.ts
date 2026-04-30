import type { Route } from '@angular/router';

interface MobileShellChildRouteConfig {
  readonly path: string;
  readonly loadComponent: Route['loadComponent'];
}

export interface MobileShellSectionConfig {
  readonly path: string;
  readonly tab?: {
    readonly label: string;
    readonly tab: string;
    readonly href: string;
    readonly icon: string;
  };
  readonly children: readonly MobileShellChildRouteConfig[];
}

export const MOBILE_SHELL_SECTIONS: readonly MobileShellSectionConfig[] = [
  {
    path: 'accueil',
    tab: {
      label: 'Accueil',
      tab: 'accueil',
      href: '/tabs/accueil',
      icon: 'home-outline',
    },
    children: [
      {
        path: '',
        loadComponent: () => import('../../features/dashboard/home.page'),
      },
    ],
  },
  {
    path: 'programmes',
    tab: {
      label: 'Programmes',
      tab: 'programmes',
      href: '/tabs/programmes',
      icon: 'book-outline',
    },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('../../features/programs/program-list.page'),
      },
      {
        path: 'ressources',
        loadComponent: () =>
          import('../../features/resources/resource-list.page'),
      },
      {
        path: 'ressources/:resourceId',
        loadComponent: () =>
          import('../../features/resources/resource-detail.page'),
      },
      {
        path: ':programId/sessions/:sessionId',
        loadComponent: () =>
          import('../../features/programs/session-detail.page'),
      },
      {
        path: ':programId',
        loadComponent: () =>
          import('../../features/programs/program-detail.page'),
      },
    ],
  },
  {
    path: 'annonces',
    tab: {
      label: 'Annonces',
      tab: 'annonces',
      href: '/tabs/annonces',
      icon: 'megaphone-outline',
    },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('../../features/announcements/announcement-list.page'),
      },
      {
        path: ':announcementId',
        loadComponent: () =>
          import('../../features/announcements/announcement-detail.page'),
      },
    ],
  },
  {
    path: 'support',
    tab: {
      label: 'Support',
      tab: 'support',
      href: '/tabs/support',
      icon: 'help-circle-outline',
    },
    children: [
      {
        path: '',
        loadComponent: () => import('../../features/support/support.page'),
      },
      {
        path: 'demande',
        loadComponent: () =>
          import('../../features/support/support-request.page'),
      },
    ],
  },
] as const;

export const MOBILE_PRIMARY_TABS = MOBILE_SHELL_SECTIONS.flatMap((section) =>
  section.tab
    ? [
        {
          label: section.tab.label,
          tab: section.tab.tab,
          href: section.tab.href,
          icon: section.tab.icon,
        },
      ]
    : [],
);

export const MOBILE_SHELL_CHILD_ROUTES: readonly Route[] =
  MOBILE_SHELL_SECTIONS.map((section) => ({
    path: section.path,
    children: section.children.map((childRoute) => ({
      path: childRoute.path,
      loadComponent: childRoute.loadComponent,
    })),
  }));
