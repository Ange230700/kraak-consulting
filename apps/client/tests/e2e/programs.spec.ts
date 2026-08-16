import { expect, test, type Page } from '@playwright/test';

const FRENCH_FORMAT_TITLES = [
  "Ateliers d'employabilité et de posture professionnelle",
  'Préparation linguistique et tests de langue',
  'Orientation études, travail et mobilité internationale',
  'Interventions collectives pour écoles, associations et entreprises',
] as const;

const ENGLISH_FORMAT_TITLES = [
  'Employability and professional presence workshops',
  'Language preparation and language testing',
  'Guidance for study, work and international mobility',
  'Group sessions for schools, associations and businesses',
] as const;

const FRENCH_PROCESS_TITLES = [
  'Demande de contact',
  "Entretien d'orientation",
  'Proposition de format',
  'Confirmation',
] as const;

const ENGLISH_PROCESS_TITLES = [
  'Contact request',
  'Guidance conversation',
  'Format recommendation',
  'Confirmation',
] as const;

function getLanguageSelector(page: Page, accessibleName: RegExp) {
  return page.getByRole('group', { name: accessibleName });
}

test.describe('Internationalisation publique de la page Programmes', () => {
  test('Given the canonical French Programs route When the page loads Then the complete conversion journey and localized CTA remain French', async ({
    page,
  }) => {
    await page.goto('/fr/programmes', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('html')).toHaveAttribute('lang', 'fr-CI');
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: "Orientation d'abord, format adapté ensuite.",
      }),
    ).toBeVisible();
    for (const title of FRENCH_FORMAT_TITLES) {
      await expect(
        page.getByRole('heading', { name: title, exact: true }),
      ).toBeVisible();
    }
    await expect(
      page.getByRole('heading', {
        name: 'Ce que nous confirmons après orientation.',
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: 'Comment être orienté vers le bon programme ?',
        exact: true,
      }),
    ).toBeVisible();
    for (const title of FRENCH_PROCESS_TITLES) {
      await expect(
        page.getByRole('heading', { name: title, exact: true }),
      ).toBeVisible();
    }
    await expect(
      page.getByRole('heading', {
        name: "Vous n'avez pas à choisir seul dans un catalogue inachevé.",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', {
        name: 'Demander une orientation',
        exact: true,
      }),
    ).toHaveAttribute('href', '/fr/contact');
    await expect(page.locator('link[hreflang="en-GB"]')).toHaveCount(0);
    await expect(page.locator('body')).not.toContainText(
      '[missing:web.programs.',
    );
  });

  test('Given the English Programs route When every conversion section renders Then formats catalogue process reassurance and CTA are English while SEO remains locked', async ({
    page,
  }) => {
    await page.goto('/en/programs', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB');
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Guidance first. The right format follows.',
      }),
    ).toBeVisible();
    for (const title of ENGLISH_FORMAT_TITLES) {
      await expect(
        page.getByRole('heading', { name: title, exact: true }),
      ).toBeVisible();
    }
    await expect(
      page.getByRole('heading', {
        name: 'What we confirm after your guidance conversation.',
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: 'How do you find the right programme?',
        exact: true,
      }),
    ).toBeVisible();
    for (const title of ENGLISH_PROCESS_TITLES) {
      await expect(
        page.getByRole('heading', { name: title, exact: true }),
      ).toBeVisible();
    }
    await expect(
      page.getByRole('heading', {
        name: 'You should not have to choose alone from an unfinished catalogue.',
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Request guidance', exact: true }),
    ).toHaveAttribute('href', '/en/contact');
    await expect(page.locator('body')).not.toContainText("Orientation d'abord");
    await expect(page.locator('body')).not.toContainText(
      'Formats actuellement proposés',
    );
    await expect(page.locator('body')).not.toContainText('Demande de contact');
    await expect(page.locator('body')).not.toContainText(
      'Demander une orientation',
    );
    await expect(page.locator('body')).not.toContainText(
      '[missing:web.programs.',
    );

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, nofollow',
    );
    await expect(page.locator('link[hreflang="en-GB"]')).toHaveCount(0);
    await expect(
      page.locator('link[rel="alternate"][hreflang="x-default"]'),
    ).toHaveAttribute('href', /\/fr\/programmes$/);

    const sitemapResponse = await page.request.get('/sitemap.xml');
    expect(sitemapResponse.ok()).toBe(true);
    const sitemap = await sitemapResponse.text();
    expect(sitemap).toContain('/fr/programmes');
    expect(sitemap).not.toContain('/en/programs');
  });

  test('Given the English Programs CTA When it is activated with the keyboard Then it opens the localized Contact route', async ({
    page,
  }) => {
    await page.goto('/en/programs');

    const guidanceLink = page.getByRole('link', {
      name: 'Request guidance',
      exact: true,
    });
    await expect(guidanceLink).toBeVisible();
    await guidanceLink.focus();
    await expect(guidanceLink).toBeFocused();

    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/en\/contact$/);
  });

  test('Given the French Programs route with query and fragment When the visitor switches to English Then the equivalent route state and English collections are preserved', async ({
    page,
  }) => {
    await page.goto('/fr/programmes?campaign=programs#process', {
      waitUntil: 'domcontentloaded',
    });

    const englishLink = getLanguageSelector(page, /langue|language/i).getByRole(
      'link',
      { name: /anglais|english/i },
    );
    await englishLink.click();

    await expect(page).toHaveURL(/\/en\/programs\?campaign=programs#process$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB');
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Guidance first. The right format follows.',
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: 'Language preparation and language testing',
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Request guidance', exact: true }),
    ).toHaveAttribute('href', '/en/contact');
  });
});
