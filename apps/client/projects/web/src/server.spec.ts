// apps\client\projects\web\src\server.spec.ts

import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import express, { type Express } from 'express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { registerSeoRoutes } from './seo-routes';

async function withSeoServer(
  configureApp: (app: Express) => void,
  runAssertions: (baseUrl: string) => Promise<void>,
): Promise<void> {
  const app = express();
  configureApp(app);
  registerSeoRoutes(app);
  const temporaryServer = app.listen(0);

  try {
    await new Promise<void>((resolve) => {
      temporaryServer.once('listening', () => resolve());
    });

    const address = temporaryServer.address() as AddressInfo;
    await runAssertions(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      temporaryServer.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
}

describe('SSR SEO routes integration', () => {
  let server: Server;
  let baseUrl = '';
  const legacyHostMarker = `ver${'cel.app'}`;

  beforeAll(async () => {
    const app = express();
    registerSeoRoutes(app);
    server = app.listen(0);

    await new Promise<void>((resolve) => {
      server.once('listening', () => resolve());
    });

    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  });

  it('Given forwarded host headers, when requesting robots.txt, then the SSR response is dynamically generated', async () => {
    const response = await fetch(`${baseUrl}/robots.txt`, {
      headers: {
        'x-forwarded-host': 'seo.kraak.test',
        'x-forwarded-proto': 'https',
      },
    });

    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    expect(body).toContain('Sitemap: https://seo.kraak.test/sitemap.xml');
    expect(body).not.toContain(legacyHostMarker);
  });

  it('Given forwarded host headers, when requesting sitemap.xml, then the SSR response is dynamically generated', async () => {
    const response = await fetch(`${baseUrl}/sitemap.xml`, {
      headers: {
        'x-forwarded-host': 'seo.kraak.test',
        'x-forwarded-proto': 'https',
      },
    });

    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/xml');
    expect(body).toContain('<loc>https://seo.kraak.test/</loc>');
    expect(body).toContain('<loc>https://seo.kraak.test/contact</loc>');
    expect(body).not.toContain(legacyHostMarker);
  });

  it('Given no proxy headers, when requesting robots.txt, then host and protocol fallback from the request are used', async () => {
    const response = await fetch(`${baseUrl}/robots.txt`);
    const body = await response.text();
    const expectedSiteUrl = new URL(baseUrl).origin;

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    expect(body).toContain(`Sitemap: ${expectedSiteUrl}/sitemap.xml`);
  });

  it('Given forwarded headers are not strings, when requesting robots.txt, then the request host is used', async () => {
    await withSeoServer(
      (app) => {
        app.use((req, _res, next) => {
          req.headers['x-forwarded-host'] = ['array-host.kraak.example'];
          req.headers['x-forwarded-proto'] = ['https'];
          next();
        });
      },
      async (temporaryBaseUrl) => {
        const response = await fetch(`${temporaryBaseUrl}/robots.txt`);
        const body = await response.text();
        const expectedSiteUrl = new URL(temporaryBaseUrl).origin;

        expect(response.status).toBe(200);
        expect(body).toContain(`Sitemap: ${expectedSiteUrl}/sitemap.xml`);
      },
    );
  });

  it('Given no host is available, when requesting robots.txt, then the sitemap uses the default public site URL', async () => {
    await withSeoServer(
      (app) => {
        app.use((req, _res, next) => {
          delete req.headers.host;
          delete req.headers['x-forwarded-host'];
          delete req.headers['x-forwarded-proto'];
          next();
        });
      },
      async (temporaryBaseUrl) => {
        const response = await fetch(`${temporaryBaseUrl}/robots.txt`);
        const body = await response.text();

        expect(response.status).toBe(200);
        expect(body).toContain(
          'Sitemap: https://kraak-web-prod.onrender.com/sitemap.xml',
        );
      },
    );
  });

  it('Given the request has a host but no protocol, when requesting robots.txt, then http is used as protocol fallback', async () => {
    await withSeoServer(
      (app) => {
        app.use((req, _res, next) => {
          req.headers.host = 'fallback-protocol.kraak.example';
          delete req.headers['x-forwarded-host'];
          delete req.headers['x-forwarded-proto'];
          Object.defineProperty(req, 'protocol', {
            configurable: true,
            value: '',
          });
          next();
        });
      },
      async (temporaryBaseUrl) => {
        const response = await fetch(`${temporaryBaseUrl}/robots.txt`);
        const body = await response.text();

        expect(response.status).toBe(200);
        expect(body).toContain(
          'Sitemap: http://fallback-protocol.kraak.example/sitemap.xml',
        );
      },
    );
  });
});
