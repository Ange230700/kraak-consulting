import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { existsSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

import { buildPrerenderedHtmlPath } from './ssr-path';

const browserDistFolder = join(import.meta.dirname, '../browser');
const resolvedBrowserDistFolder = resolve(browserDistFolder);
const participantAreaEnabled =
  process.env['CLIENT_FEATURE_PARTICIPANT_AREA'] === 'true';

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
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

app.use((req, res, next) => {
  if (participantAreaEnabled) {
    next();
    return;
  }

  const notFoundHtmlPath = resolveStaticNotFoundHtmlPath(req);

  if (!notFoundHtmlPath) {
    next();
    return;
  }

  res.status(404).sendFile(notFoundHtmlPath, (error) => {
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
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);

function resolvePrerenderedHtmlPath(req: express.Request): string | undefined {
  if (!['GET', 'HEAD'].includes(req.method) || !req.accepts('html')) {
    return undefined;
  }

  const routePath = parseRequestPath(req);
  return routePath
    ? buildPrerenderedHtmlPath(routePath, resolvedBrowserDistFolder, existsSync)
    : undefined;
}

function resolveStaticNotFoundHtmlPath(
  req: express.Request,
): string | undefined {
  if (!['GET', 'HEAD'].includes(req.method) || !req.accepts('html')) {
    return undefined;
  }

  const routePath = parseRequestPath(req);
  if (!routePath || extname(routePath)) {
    return undefined;
  }

  const rootNotFoundHtmlPath = resolve(resolvedBrowserDistFolder, '404.html');
  if (existsSync(rootNotFoundHtmlPath)) {
    return rootNotFoundHtmlPath;
  }

  const routeNotFoundHtmlPath = resolve(
    resolvedBrowserDistFolder,
    '404',
    'index.html',
  );
  if (existsSync(routeNotFoundHtmlPath)) {
    return routeNotFoundHtmlPath;
  }

  return undefined;
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
