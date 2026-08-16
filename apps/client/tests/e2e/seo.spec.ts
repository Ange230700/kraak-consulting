import { expect, test, type Page } from '@playwright/test';

type SeoRuntimeErrors = {
  readonly consoleErrors: string[];
  readonly pageErrors: string[];
};

function captureSeoRuntimeErrors(page: Page): SeoRuntimeErrors {
  const errors: SeoRuntimeErrors = {
    consoleErrors: [],
    pageErrors: [],
  };

  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.consoleErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => {
    errors.pageErrors.push(error.message);
  });

  return errors;
}

async function expectHeadLinkCount(
  page: Page,
  selector: string,
  count: number,
): Promise<void> {
  await expect(page.locator(selector)).toHaveCount(count);
}

async function expectCanonicalPath(page: Page, path: string): Promise<void> {
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    new RegExp(`${escapeRegExp(path)}$`),
  );
}

async function expectAlternatePath(
  page: Page,
  hreflang: string,
  path: string,
): Promise<void> {
  await expect(
    page.locator(`link[rel="alternate"][hreflang="${hreflang}"]`),
  ).toHaveAttribute('href', new RegExp(`${escapeRegExp(path)}$`));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test.describe(`SEO i18n du site vitrine`, () => {
  test(`Given la racine publique, When elle se charge, Then elle rejoint la route française canonique sans erreur d'hydratation`, async ({
    page,
  }) => {
    const errors = captureSeoRuntimeErrors(page);

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(/\/fr\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr-CI');
    await expectCanonicalPath(page, '/fr/');
    await expectAlternatePath(page, 'fr-CI', '/fr/');
    await expectAlternatePath(page, 'en-GB', '/en/');
    await expectAlternatePath(page, 'x-default', '/fr/');
    expect(errors.consoleErrors).toEqual([]);
    expect(errors.pageErrors).toEqual([]);
  });

  test(`Given the approved English homepage, When it loads, Then reviewed metadata indexing reciprocal hreflang and sitemap discovery are active`, async ({
    page,
  }) => {
    const errors = captureSeoRuntimeErrors(page);

    await page.goto('/en/', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveTitle(
      'Build your skills. Launch your projects. | KRAAK Consulting',
    );
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      'KRAAK Consulting supports students, professionals, businesses and members of the diaspora with practical solutions in training, project management and immigration.',
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      /index, follow/i,
    );
    await expectCanonicalPath(page, '/en/');
    await expectAlternatePath(page, 'fr-CI', '/fr/');
    await expectAlternatePath(page, 'en-GB', '/en/');
    await expectAlternatePath(page, 'x-default', '/fr/');

    const sitemapResponse = await page.request.get('/sitemap.xml');
    expect(sitemapResponse.ok()).toBe(true);
    const sitemap = await sitemapResponse.text();
    expect(sitemap).toContain(
      '<loc>https://kraak-web-prod.onrender.com/en/</loc>',
    );
    expect(sitemap).not.toContain(
      '<loc>https://kraak-web-prod.onrender.com/en/contact</loc>',
    );
    expect(errors.consoleErrors).toEqual([]);
    expect(errors.pageErrors).toEqual([]);
  });

  test(`Given une route française localisée, When elle se charge, Then canonical hreflang et indexation restent français`, async ({
    page,
  }) => {
    const errors = captureSeoRuntimeErrors(page);

    await page.goto('/fr/services', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveTitle(
      /Services \| Formation, projets, études, immigration et entreprises/i,
    );
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr-CI');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      /index, follow/i,
    );
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
      'content',
      'fr_CI',
    );
    await expectCanonicalPath(page, '/fr/services');
    await expectAlternatePath(page, 'fr-CI', '/fr/services');
    await expectAlternatePath(page, 'x-default', '/fr/services');
    await expect(page.locator('link[hreflang="en-GB"]')).toHaveCount(0);
    await expectHeadLinkCount(page, 'link[rel="canonical"]', 1);
    expect(errors.consoleErrors).toEqual([]);
    expect(errors.pageErrors).toEqual([]);
  });

  test(`Given une route anglaise scaffold, When elle se charge, Then elle reste canonique mais non indexable`, async ({
    page,
  }) => {
    const errors = captureSeoRuntimeErrors(page);

    await page.goto('/en/services', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveTitle(/English route scaffold/i);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      /noindex, nofollow/i,
    );
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
      'content',
      'en_GB',
    );
    await expectCanonicalPath(page, '/en/services');
    await expectAlternatePath(page, 'fr-CI', '/fr/services');
    await expectAlternatePath(page, 'x-default', '/fr/services');
    await expect(page.locator('link[hreflang="en-GB"]')).toHaveCount(0);
    await expectHeadLinkCount(page, 'link[rel="canonical"]', 1);
    expect(errors.consoleErrors).toEqual([]);
    expect(errors.pageErrors).toEqual([]);
  });

  test(`Given un alias public historique, When il est ouvert, Then il rejoint temporairement la route française`, async ({
    page,
  }) => {
    const errors = captureSeoRuntimeErrors(page);

    await page.goto('/about', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(/\/fr\/a-propos$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr-CI');
    await expectCanonicalPath(page, '/fr/a-propos');
    expect(errors.consoleErrors).toEqual([]);
    expect(errors.pageErrors).toEqual([]);
  });

  test(`Given une route anglaise inconnue, When elle se charge, Then la 404 conserve la locale anglaise et reste noindex`, async ({
    page,
  }) => {
    const errors = captureSeoRuntimeErrors(page);

    await page.goto('/en/unknown-route', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveTitle(/English route scaffold/i);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      /noindex, nofollow/i,
    );
    await expectCanonicalPath(page, '/en/404');
    await expectAlternatePath(page, 'x-default', '/fr/404');
    await expect(page.locator('link[hreflang="en-GB"]')).toHaveCount(0);
    expect(errors.consoleErrors).toEqual([]);
    expect(errors.pageErrors).toEqual([]);
  });
});
