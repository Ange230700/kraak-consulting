import { expect, test } from '@playwright/test';

// Analytics E2E — vérification du gating GA4
// Given/When/Then : sans identifiant GA4 configuré, aucun script GA n'est chargé.

test.describe('Analytics — gating GA4', () => {
  test(`Given aucun identifiant GA4 configuré, When la page d'accueil se charge, Then aucun loader gtag.js n'est injecté`, async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('link', { name: 'Espace participant' }).first(),
    ).toBeVisible();

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
    await page
      .getByRole('link', { name: 'Espace participant' })
      .first()
      .waitFor();

    expect(gtagRequests).toEqual([]);
  });
});
