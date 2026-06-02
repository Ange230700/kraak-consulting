import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import express from 'express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { registerSeoRoutes } from './seo-routes';

describe('SSR SEO routes integration', () => {
  let server: Server;
  let baseUrl = '';

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
    expect(body).not.toContain('kraak-consulting.vercel.app');
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
    expect(body).not.toContain('kraak-consulting.vercel.app');
  });

  it('Given no proxy headers, when requesting robots.txt, then host and protocol fallback from the request are used', async () => {
    const response = await fetch(`${baseUrl}/robots.txt`);
    const body = await response.text();
    const expectedSiteUrl = new URL(baseUrl).origin;

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    expect(body).toContain(`Sitemap: ${expectedSiteUrl}/sitemap.xml`);
  });
});
