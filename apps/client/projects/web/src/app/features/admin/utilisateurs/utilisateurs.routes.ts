import { inject } from '@angular/core';
import type { ResolveFn, Routes } from '@angular/router';

import { KraakI18nService } from '../../../../../../shared/i18n';

const translatedTitle = (key: string): ResolveFn<string> => {
  return () => inject(KraakI18nService).translate(key);
};

const utilisateursRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'list',
        title: translatedTitle('web.admin.users.routes.list'),
        loadComponent: () => import('./admin-user-list.page'),
      },
      {
        path: 'create',
        title: translatedTitle('web.admin.users.routes.create'),
        loadComponent: () => import('./admin-user-create-layout.page'),
        children: [
          { path: '', redirectTo: 'basic-information', pathMatch: 'full' },
          {
            path: 'basic-information',
            title: translatedTitle('web.admin.users.routes.basicInformation'),
            loadComponent: () => import('./steps/basic-information.page'),
          },
          {
            path: 'business-information',
            title: translatedTitle(
              'web.admin.users.routes.businessInformation',
            ),
            loadComponent: () => import('./steps/business-information.page'),
          },
          {
            path: 'location-information',
            title: translatedTitle(
              'web.admin.users.routes.locationInformation',
            ),
            loadComponent: () => import('./steps/location-information.page'),
          },
          {
            path: 'authorization',
            title: translatedTitle('web.admin.users.routes.authorization'),
            loadComponent: () => import('./steps/authorization.page'),
          },
          {
            path: 'account-status',
            title: translatedTitle('web.admin.users.routes.accountStatus'),
            loadComponent: () => import('./steps/account-status.page'),
          },
        ],
      },
      { path: '', redirectTo: 'list', pathMatch: 'full' },
    ],
  },
];

export default utilisateursRoutes;
