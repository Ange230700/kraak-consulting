import { expect, test } from '@playwright/test';

test.describe('Internationalisation publique de la page Contact', () => {
  test('Given la route /fr/contact, When la page se charge, Then le contenu et les textes accessibles restent en français', async ({
    page,
  }) => {
    await page.goto('/fr/contact', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('html')).toHaveAttribute('lang', 'fr-CI');
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Parlez-nous de votre objectif.',
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('complementary', {
        name: 'Informations de contact KRAAK',
      }),
    ).toBeVisible();
    await expect(
      page.getByAltText(
        "Entretien d'orientation pour clarifier un besoin d'accompagnement",
      ),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Voir les services', exact: true }),
    ).toHaveAttribute('href', '/fr/services');
    await expect(page.getByLabel('Type de service')).toContainText(
      'Gestion de projets',
    );
    await expect(
      page.getByRole('heading', { name: 'Nos coordonnées' }),
    ).toBeVisible();
    await expect(page.locator('body')).not.toContainText(
      '[missing:web.contact.',
    );
    await expect(
      page.locator('link[rel="alternate"][hreflang="en-GB"]'),
    ).toHaveCount(0);
  });

  test('Given la route /en/contact, When every section renders, Then visitor copy links and accessibility text are English while SEO stays noindex', async ({
    page,
  }) => {
    await page.goto('/en/contact', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB');
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Tell us about your goal.',
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('complementary', { name: 'KRAAK contact details' }),
    ).toBeVisible();
    await expect(
      page.getByAltText('A guidance meeting to clarify support needs'),
    ).toBeVisible();
    await expect(
      page.getByRole('navigation', { name: 'KRAAK social media' }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Explore our services', exact: true }),
    ).toHaveAttribute('href', '/en/services');
    await expect(page.getByLabel('Service type')).toContainText(
      'Project management',
    );
    await expect(
      page.getByPlaceholder('Your country of residence'),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Our contact details' }),
    ).toBeVisible();
    await expect(page.getByText('Let’s discuss your next step.')).toBeVisible();
    await expect(page.locator('body')).not.toContainText(
      'Envoyez votre demande',
    );
    await expect(page.locator('body')).not.toContainText('Nos coordonnées');
    await expect(page.locator('body')).not.toContainText(
      '[missing:web.contact.',
    );

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, nofollow',
    );
    await expect(page.locator('link[hreflang="en-GB"]')).toHaveCount(0);
    await expect(
      page.locator('link[rel="alternate"][hreflang="x-default"]'),
    ).toHaveAttribute('href', /\/fr\/contact$/);

    const sitemapResponse = await page.request.get('/sitemap.xml');
    expect(sitemapResponse.ok()).toBe(true);
    const sitemap = await sitemapResponse.text();
    expect(sitemap).toContain('/fr/contact');
    expect(sitemap).not.toContain('/en/contact');
  });

  test('Given the English Contact hero action, When it is activated with the keyboard, Then it reaches the localized contact form', async ({
    page,
  }) => {
    await page.goto('/en/contact');

    const enquiryLink = page.getByRole('link', {
      name: 'Go to the contact form',
    });
    await enquiryLink.focus();
    await expect(enquiryLink).toBeFocused();

    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/en\/contact#contact-form$/);
    await expect(
      page.getByRole('heading', { name: 'Send your enquiry' }),
    ).toBeVisible();
  });

  test('Given an English contact form, When validation and a successful submission occur, Then feedback and submitted operational context stay English while identifiers remain stable', async ({
    page,
  }) => {
    test.setTimeout(90_000);

    await page.route('**/contact', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Request received.',
        }),
      });
    });

    await page.goto('/en/contact');
    const submitButton = page.getByRole('button', {
      name: 'Send my enquiry',
    });

    await expect(async () => {
      await submitButton.click();
      await expect(page.getByText('Name is required.')).toBeVisible();
    }).toPass();
    await expect(page.getByText('Email address is required.')).toBeVisible();
    await expect(page.getByText('Goal is required.')).toBeVisible();
    await expect(page.getByText('Country is required.')).toBeVisible();
    await expect(page.getByText('Message is required.')).toBeVisible();

    const nameField = page.getByRole('textbox', { name: 'Full name' });
    const emailField = page.getByRole('textbox', { name: 'Email address' });
    const subjectField = page.getByRole('textbox', { name: 'Goal' });
    const countryField = page.getByRole('textbox', { name: 'Country' });
    const serviceField = page.getByLabel('Service type');
    const messageField = page.getByRole('textbox', { name: 'Message' });

    await expect(async () => {
      await nameField.fill('Alice Smith');
      await emailField.fill('alice@example.com');
      await subjectField.fill('Discuss training support');
      await countryField.fill('Ghana');
      await serviceField.selectOption('formation');
      await messageField.fill(
        'I would like to discuss the right training programme.',
      );

      const submitRequestPromise = page.waitForRequest(
        (request) =>
          request.method() === 'POST' && request.url().endsWith('/contact'),
        { timeout: 10_000 },
      );

      await submitButton.click();
      const submitRequest = await submitRequestPromise;
      const payload = submitRequest.postDataJSON() as { message: string };

      expect(payload.message).toContain('Country: Ghana');
      expect(payload.message).toContain('Service type: Training');
      expect(payload.message).toContain(
        'Internal queue: formation/orientation-public',
      );
      expect(payload.message).toContain(
        'Response workflow: training guidance within 48 business hours',
      );
      expect(payload.message).toContain(
        'Operational fallback: direct email or WhatsApp',
      );
      await expect(
        page.getByText(
          'Your message has been sent. We will get back to you as soon as possible.',
        ),
      ).toBeVisible({ timeout: 10_000 });
    }).toPass({ timeout: 60_000 });
  });
});
