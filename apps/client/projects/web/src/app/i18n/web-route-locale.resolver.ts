import { inject } from '@angular/core';
import { type ResolveFn } from '@angular/router';
import {
  SOURCE_LOCALE,
  type SupportedLocale,
  resolveSupportedLocale,
} from '@kraak/domain';

import { KraakI18nService } from '../../../../shared/i18n';

export const webRouteLocaleResolver: ResolveFn<SupportedLocale> = async (
  route,
) => {
  const routeLocale = route.data['locale'];
  const locale = resolveSupportedLocale(
    typeof routeLocale === 'string' ? routeLocale : SOURCE_LOCALE,
  );

  await inject(KraakI18nService).setLocale(locale);

  return locale;
};
