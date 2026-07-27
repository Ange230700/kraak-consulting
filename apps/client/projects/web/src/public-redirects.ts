import type express from 'express';

import { findLegacyPublicRedirectBySourcePath } from './app/routing/localized-public-routes';

const LOCAL_URL_BASE = 'http://localhost';

export function registerPublicRedirectRoutes(app: express.Express): void {
  app.use((req, res, next) => {
    if (!['GET', 'HEAD'].includes(req.method)) {
      next();
      return;
    }

    const destination = resolvePublicRedirectDestination(req.originalUrl);

    if (!destination) {
      next();
      return;
    }

    res.redirect(301, destination);
  });
}

export function resolvePublicRedirectDestination(
  originalUrl: string,
): string | undefined {
  try {
    const url = new URL(originalUrl, LOCAL_URL_BASE);
    const redirect = findLegacyPublicRedirectBySourcePath(
      decodeURIComponent(url.pathname),
    );

    if (!redirect) {
      return undefined;
    }

    return `${redirect.destination}${url.search}`;
  } catch (error) {
    console.warn('web.redirect.invalid-url', { url: originalUrl, error });
    return undefined;
  }
}
