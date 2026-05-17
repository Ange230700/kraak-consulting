import { expect, test } from '@playwright/test';

// Analytics E2E — vérification du gating GA4
// Given/When/Then : sans identifiant GA4 configuré, aucun script GA n'est chargé.

const PUBLIC_CTA_SURFACES = [
  {
    path: '/',
    ctaLabel: 'Réserver une consultation',
  },
  {
    path: '/a-propos',
    ctaLabel: 'Nous contacter',
  },
  {
    path: '/services',
    ctaLabel: 'Réserver une consultation',
  },
  {
    path: '/ressources',
    ctaLabel: 'Demander une orientation',
  },
  {
    path: '/programmes',
    ctaLabel: 'Demander une orientation',
  },
  {
    path: '/mentions-legales',
    ctaLabel: 'Nous contacter',
  },
  {
    path: '/politique-de-confidentialite',
    ctaLabel: 'Nous contacter',
  },
] as const;

const PUBLIC_CTA_MATRIX_TIMEOUT_MS = 90000;

function isAnalyticsRequestUrl(url: string): boolean {
  return (
    url.includes('googletagmanager.com') || url.includes('google-analytics.com')
  );
}

test.describe('Analytics — gating GA4', () => {
  test(`Given aucun identifiant GA4 configuré, When la page d'accueil se charge, Then aucun loader gtag.js n'est injecté`, async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('banner')).toBeVisible();

    await expect(
      page.locator('script[data-kraak-analytics="loader"]'),
    ).toHaveCount(0);
  });

  test(`Given aucun identifiant GA4 configuré, When la page d'accueil se charge, Then aucun appel à googletagmanager.com n'est émis`, async ({
    page,
  }) => {
    const gtagRequests: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (
        url.includes('googletagmanager.com') ||
        url.includes('google-analytics.com')
      ) {
        gtagRequests.push(url);
      }
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('banner')).toBeVisible();

    expect(gtagRequests).toEqual([]);
  });

  test(`Given aucun identifiant GA4 configuré, When les pages publiques à CTA se chargent puis déclenchent leur CTA principal, Then aucun loader GA4 ni requête tierce n'est émis`, async ({
    page,
  }) => {
    test.setTimeout(PUBLIC_CTA_MATRIX_TIMEOUT_MS);

    for (const surface of PUBLIC_CTA_SURFACES) {
      const capturedRequests: string[] = [];
      const captureRequest = (request: { url: () => string }) =>
        capturedRequests.push(...[request.url()].filter(isAnalyticsRequestUrl));

      page.on('request', captureRequest);

      try {
        await page.goto(surface.path, { waitUntil: 'domcontentloaded' });

        await expect(
          page.locator('script[data-kraak-analytics="loader"]'),
        ).toHaveCount(0);

        const ctaBanner = page.locator('kraak-cta-banner');
        await expect(ctaBanner).toBeVisible();

        const ctaLink = ctaBanner.getByRole('link', {
          name: surface.ctaLabel,
        });
        await expect(ctaLink).toBeVisible();

        const ctaHref = await ctaLink.getAttribute('href');
        await ctaLink.click();

        try {
          await page.waitForURL('**/contact', {
            timeout: 10000,
            waitUntil: 'domcontentloaded',
          });
        } catch {
          // WebKit can occasionally miss the client-side navigation after a click.
          if (ctaHref) {
            await page.goto(ctaHref, { waitUntil: 'domcontentloaded' });
          } else {
            throw new Error(`CTA href introuvable pour ${surface.path}`);
          }
        }

        await expect(page).toHaveTitle(/Contact/i);
        expect(capturedRequests).toEqual([]);
      } finally {
        page.off('request', captureRequest);
      }
    }
  });
});
