// apps/client/projects/web/src/server.ts

import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { registerPublicRedirectRoutes } from './public-redirects';
import { registerSeoRoutes } from './seo-routes';
import { buildPrerenderedHtmlPath } from './ssr-path';

const browserDistFolder = join(import.meta.dirname, '../browser');
const resolvedBrowserDistFolder = resolve(browserDistFolder);

const app = express();
const angularApp = new AngularNodeAppEngine();

registerPublicRedirectRoutes(app);
registerSeoRoutes(app);

/**
 * Serve runtime config without long-term caching.
 */
app.get('/assets/runtime-config.js', (_req, res, next) => {
  res.setHeader(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate',
  );

  res.sendFile(
    join(browserDistFolder, 'assets', 'runtime-config.js'),
    (error) => {
      if (error) {
        next(error);
      }
    },
  );
});

/**
 * Serve static files from /browser.
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  }),
);

app.use((req, res, next) => {
  const prerenderedHtmlPath = resolvePrerenderedHtmlPath(req);

  if (!prerenderedHtmlPath) {
    next();
    return;
  }

  res.sendFile(prerenderedHtmlPath, (error) => {
    if (error) {
      next(error);
    }
  });
});

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI for dev-server/build or serverless adapters.
 */
export const reqHandler = createNodeRequestHandler(app);
export { app };

function resolvePrerenderedHtmlPath(req: express.Request): string | undefined {
  if (!['GET', 'HEAD'].includes(req.method) || !req.accepts('html')) {
    return undefined;
  }

  const routePath = parseRequestPath(req);

  return routePath
    ? buildPrerenderedHtmlPath(routePath, resolvedBrowserDistFolder, existsSync)
    : undefined;
}

function parseRequestPath(req: express.Request): string | undefined {
  try {
    return decodeURIComponent(
      new URL(req.originalUrl, 'http://localhost').pathname,
    );
  } catch (error) {
    console.warn('web.ssr.prerendered-path.invalid-url', {
      url: req.originalUrl,
      error,
    });

    return undefined;
  }
}
