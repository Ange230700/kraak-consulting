import { expect, test, type Page } from '@playwright/test';

const FRENCH_FOCUS_TITLES = [
  'Développement des compétences',
  'Structuration des projets',
  'Accès aux opportunités internationales',
] as const;

const ENGLISH_FOCUS_TITLES = [
  'Skills development',
  'Project structuring',
  'Access to international opportunities',
] as const;

const FRENCH_VALUE_TITLES = [
  'Humanisme',
  'Responsabilité personnelle',
  'Leadership par le service',
  'Solidarité et esprit collectif',
  'Résilience et courage',
  'Ouverture et connexion globale',
] as const;

const ENGLISH_VALUE_TITLES = [
  'Humanism',
  'Personal responsibility',
  'Servant leadership',
  'Solidarity and collective strength',
  'Resilience and courage',
  'Openness and global connection',
] as const;

function getLanguageSelector(page: Page, accessibleName: RegExp) {
  return page.getByRole('group', { name: accessibleName });
}

async function expectHeadingsVisible(
  page: Page,
  headings: readonly string[],
): Promise<void> {
  for (const heading of headings) {
    await expect(
      page.getByRole('heading', { name: heading, exact: true }),
    ).toBeVisible();
  }
}

async function expectTextsVisible(
  page: Page,
  texts: readonly string[],
): Promise<void> {
  for (const text of texts) {
    await expect(page.getByText(text, { exact: true })).toBeVisible();
  }
}

test.describe('Internationalisation publique de la page À propos', () => {
  test('Given the canonical French About route When the page loads Then the complete narrative leadership content and localized CTA remain French', async ({
    page,
  }) => {
    await page.goto('/fr/a-propos', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('html')).toHaveAttribute('lang', 'fr-CI');
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Une structure engagée pour le capital humain et les trajectoires durables.',
      }),
    ).toBeVisible();
    await expectHeadingsVisible(page, FRENCH_FOCUS_TITLES);
    await expect(
      page.getByRole('heading', {
        name: 'Une mission claire, une vision utile.',
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: 'Révéler, former et accompagner les jeunes dans leur transformation.',
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: 'Un acteur de référence pour les jeunes professionnels africains.',
        exact: true,
      }),
    ).toBeVisible();
    await expectTextsVisible(page, FRENCH_VALUE_TITLES);
    await expect(
      page.getByRole('article', { name: 'Citation du Directeur Général' }),
    ).toContainText('Mr AKA');
    await expect(
      page.getByAltText(
        'Portrait de Mr AKA, Directeur Général et Co-Fondateur de KRAAK',
      ),
    ).toBeVisible();
    await expect(
      page
        .locator('kraak-cta-banner')
        .getByRole('link', { name: 'Nous contacter', exact: true }),
    ).toHaveAttribute('href', '/fr/contact');
    await expect(page.locator('link[hreflang="en-GB"]')).toHaveCount(0);
    await expect(page.locator('body')).not.toContainText('[missing:web.about.');
  });

  test('Given the English About route When every narrative section renders Then capabilities mission vision values leadership quote CTA and accessibility copy are English while SEO remains locked', async ({
    page,
  }) => {
    await page.goto('/en/about', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB');
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'A purpose-driven organisation for human capital and sustainable pathways.',
      }),
    ).toBeVisible();
    await expectHeadingsVisible(page, ENGLISH_FOCUS_TITLES);
    await expect(
      page.getByRole('heading', {
        name: 'A clear mission and a meaningful vision.',
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: 'Unlock potential, build skills and support young people through transformation.',
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: 'A leading partner for young African professionals.',
        exact: true,
      }),
    ).toBeVisible();
    await expectTextsVisible(page, ENGLISH_VALUE_TITLES);
    const quote = page.getByRole('article', {
      name: 'Quote from the Chief Executive Officer',
    });
    await expect(quote).toContainText(
      'KRAAK Consulting is more than a business venture; it is a life mission.',
    );
    await expect(quote).toContainText('Chief Executive Officer / Co-Founder');
    await expect(
      page.getByAltText(
        'Portrait of Mr AKA, Chief Executive Officer and Co-Founder of KRAAK',
      ),
    ).toBeVisible();
    await expect(quote.getByAltText('KRAAK symbol')).toBeVisible();
    await expect(
      page
        .locator('kraak-cta-banner')
        .getByRole('link', { name: 'Contact us', exact: true }),
    ).toHaveAttribute('href', '/en/contact');
    await expect(page.locator('body')).not.toContainText('Notre cap');
    await expect(page.locator('body')).not.toContainText('Nos valeurs');
    await expect(page.locator('body')).not.toContainText('Directeur Général');
    await expect(page.locator('body')).not.toContainText('[missing:web.about.');

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, nofollow',
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/en\/about$/,
    );
    await expect(
      page.locator('link[rel="alternate"][hreflang="fr-CI"]'),
    ).toHaveAttribute('href', /\/fr\/a-propos$/);
    await expect(
      page.locator('link[rel="alternate"][hreflang="x-default"]'),
    ).toHaveAttribute('href', /\/fr\/a-propos$/);
    await expect(page.locator('link[hreflang="en-GB"]')).toHaveCount(0);

    const sitemapResponse = await page.request.get('/sitemap.xml');
    expect(sitemapResponse.ok()).toBe(true);
    const sitemap = await sitemapResponse.text();
    expect(sitemap).toContain('/fr/a-propos');
    expect(sitemap).not.toContain('/en/about');
  });

  test('Given the English About CTA When it is activated with the keyboard Then it opens the localized Contact route', async ({
    page,
  }) => {
    await page.goto('/en/about');

    const contactLink = page.locator('kraak-cta-banner').getByRole('link', {
      name: 'Contact us',
      exact: true,
    });
    await expect(contactLink).toBeVisible();
    await contactLink.focus();
    await expect(contactLink).toBeFocused();

    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/en\/contact$/);
  });

  test('Given the French About route with query and fragment When the visitor switches language in both directions Then the equivalent About route query fragment and localized content are preserved', async ({
    page,
  }) => {
    await page.goto('/fr/a-propos?campaign=about#mission', {
      waitUntil: 'domcontentloaded',
    });

    const frenchLanguageSelector = getLanguageSelector(
      page,
      /langue|language/i,
    );
    await frenchLanguageSelector
      .getByRole('link', { name: /anglais|english/i })
      .click();

    await expect(page).toHaveURL(/\/en\/about\?campaign=about#mission$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB');
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'A purpose-driven organisation for human capital and sustainable pathways.',
      }),
    ).toBeVisible();

    const englishLanguageSelector = getLanguageSelector(
      page,
      /langue|language/i,
    );
    await englishLanguageSelector
      .getByRole('link', { name: /français|french/i })
      .click();

    await expect(page).toHaveURL(/\/fr\/a-propos\?campaign=about#mission$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr-CI');
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Une structure engagée pour le capital humain et les trajectoires durables.',
      }),
    ).toBeVisible();
  });
});
