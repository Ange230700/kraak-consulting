// apps\client\projects\web\src\seo-routes.ts

import type express from 'express';

import { buildRobotsTxt, buildSitemapXml } from './app/seo/site-seo';

export function registerSeoRoutes(app: express.Express): void {
  app.get('/sitemap.xml', (req, res) => {
    const siteUrl = resolveRequestSiteUrl(req);
    const sitemapXml = buildSitemapXml(siteUrl);

    res.type('application/xml').send(sitemapXml);
  });

  app.get('/robots.txt', (req, res) => {
    const siteUrl = resolveRequestSiteUrl(req);
    const robotsTxt = buildRobotsTxt(siteUrl);

    res.type('text/plain').send(robotsTxt);
  });
}

function resolveRequestSiteUrl(req: express.Request): string {
  const forwardedHostHeader = req.headers['x-forwarded-host'];
  const forwardedProtocolHeader = req.headers['x-forwarded-proto'];

  const forwardedHost =
    typeof forwardedHostHeader === 'string'
      ? forwardedHostHeader.split(',')[0]?.trim()
      : undefined;
  const forwardedProtocol =
    typeof forwardedProtocolHeader === 'string'
      ? forwardedProtocolHeader.split(',')[0]?.trim()
      : undefined;

  const host = forwardedHost || req.get('host') || '';
  const protocol = forwardedProtocol || req.protocol || 'http';

  if (host.length === 0) {
    return '';
  }

  return `${protocol}://${host}`;
}
