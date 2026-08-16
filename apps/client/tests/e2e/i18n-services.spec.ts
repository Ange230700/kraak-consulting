import { expect, test, type Page } from '@playwright/test';

function getLanguageSelector(page: Page, accessibleName: RegExp) {
  return page.getByRole('group', { name: accessibleName });
}

test.describe('Internationalisation publique de la page Services', () => {
  test('Given la route /fr/services, When la page se charge, Then les quatre familles la méthode la FAQ et le CTA restent en français', async ({
    page,
  }) => {
    await page.goto('/fr/services', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('html')).toHaveAttribute('lang', 'fr-CI');
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Des offres claires pour renforcer les parcours, les projets et les organisations.',
      }),
    ).toBeVisible();
    await expect(page.locator('body')).toContainText('KRAAK Training Centre');
    await expect(page.locator('body')).toContainText(
      "Centre de Recherche et d'Innovation",
    );
    await expect(page.locator('body')).toContainText(
      'Centre de Conseils en Immigration',
    );
    await expect(page.locator('body')).toContainText('Offres entreprises');
    await expect(
      page.getByRole('heading', { name: "Notre méthode d'intervention" }),
    ).toBeVisible();
    await expect(page.getByText('Clarifier', { exact: true })).toBeVisible();
    await expect(page.getByText('Structurer', { exact: true })).toBeVisible();
    await expect(page.getByText('Avancer', { exact: true })).toBeVisible();
    await expect(
      page.getByText(
        'Comment choisir le service le plus adapté à mon objectif ?',
        { exact: true },
      ),
    ).toBeVisible();
    await expect(
      page.getByRole('link', {
        name: 'Réserver une consultation',
        exact: true,
      }),
    ).toHaveAttribute('href', '/fr/contact');
    await expect(page.locator('link[hreflang="en-GB"]')).toHaveCount(0);
    await expect(page.locator('body')).not.toContainText(
      '[missing:web.services.',
    );
  });

  test('Given la route /en/services, When every section renders, Then all service families method FAQ CTAs and accessible copy are English while SEO stays noindex', async ({
    page,
  }) => {
    await page.goto('/en/services', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB');
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Clear solutions to strengthen careers, projects and organisations.',
      }),
    ).toBeVisible();
    await expect(page.locator('body')).toContainText('KRAAK Training Centre');
    await expect(page.locator('body')).toContainText(
      'Research and Innovation Centre',
    );
    await expect(page.locator('body')).toContainText(
      'Immigration Advisory Centre',
    );
    await expect(page.locator('body')).toContainText('Business solutions');
    await expect(page.locator('body')).toContainText('Who it is for');
    await expect(page.locator('body')).toContainText('Your challenge');
    await expect(page.locator('body')).toContainText('What we deliver');
    await expect(page.locator('body')).toContainText('Next step');
    await expect(
      page.getByRole('heading', { name: 'Our approach' }),
    ).toBeVisible();
    await expect(page.getByText('Clarify', { exact: true })).toBeVisible();
    await expect(page.getByText('Structure', { exact: true })).toBeVisible();
    await expect(page.getByText('Move forward', { exact: true })).toBeVisible();
    await expect(
      page.getByText('How do I choose the service best suited to my goal?', {
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.locator('kraak-faq-accordion img[alt=""]')).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Book a consultation', exact: true }),
    ).toHaveAttribute('href', '/en/contact');
    await expect(page.locator('main a[href="/en/contact"]')).toHaveCount(9);
    await expect(page.locator('body')).not.toContainText('Des offres claires');
    await expect(page.locator('body')).not.toContainText('Pour qui');
    await expect(page.locator('body')).not.toContainText(
      'Questions fréquentes',
    );
    await expect(page.locator('body')).not.toContainText(
      '[missing:web.services.',
    );

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, nofollow',
    );
    await expect(page.locator('link[hreflang="en-GB"]')).toHaveCount(0);
    await expect(
      page.locator('link[rel="alternate"][hreflang="x-default"]'),
    ).toHaveAttribute('href', /\/fr\/services$/);

    const sitemapResponse = await page.request.get('/sitemap.xml');
    expect(sitemapResponse.ok()).toBe(true);
    const sitemap = await sitemapResponse.text();
    expect(sitemap).toContain('/fr/services');
    expect(sitemap).not.toContain('/en/services');
  });

  test('Given the English Services final CTA, When it is activated with the keyboard, Then it opens the localized Contact route', async ({
    page,
  }) => {
    await page.goto('/en/services');

    const consultationLink = page.getByRole('link', {
      name: 'Book a consultation',
      exact: true,
    });
    await expect(consultationLink).toBeVisible();
    await consultationLink.focus();
    await expect(consultationLink).toBeFocused();

    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/en\/contact$/);
  });

  test('Given the French Services route with query and fragment, When the visitor switches to English, Then the equivalent route state and English content are preserved', async ({
    page,
  }) => {
    await page.goto('/fr/services?campaign=services#method', {
      waitUntil: 'domcontentloaded',
    });

    const englishLink = getLanguageSelector(page, /langue|language/i).getByRole(
      'link',
      { name: /anglais|english/i },
    );
    await englishLink.click();

    await expect(page).toHaveURL(/\/en\/services\?campaign=services#method$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB');
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Clear solutions to strengthen careers, projects and organisations.',
      }),
    ).toBeVisible();
    await expect(
      page.getByText('How do I choose the service best suited to my goal?', {
        exact: true,
      }),
    ).toBeVisible();
  });
});
