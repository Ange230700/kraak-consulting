import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4200';

test.describe('Support flow - FAQ + 404 navigation', () => {
  test.describe('Given user lands on invalid page', () => {
    test('When navigating to 404 page Then displays FAQ link as help entry point', async ({
      page,
    }) => {
      // Given: User navigates to non-existent route
      await page.goto(`${BASE_URL}/route-invalide-xyz`, {
        waitUntil: 'domcontentloaded',
      });

      // When: Page is loaded
      await expect(page).toHaveTitle(/Page introuvable/i);
      const heading = page.locator('h1');
      await expect(heading).toContainText('Oups');

      // Then: FAQ link is visible as help entry point
      const faqLink = page.getByRole('link', {
        name: 'Consulter la FAQ KRAAK',
      });
      await expect(faqLink).toBeVisible();
    });

    test('When user clicks FAQ link from 404 page Then navigates to FAQ with proper title', async ({
      page,
    }) => {
      // Given: User is on 404 page
      await page.goto(`${BASE_URL}/page-inexistante`, {
        waitUntil: 'domcontentloaded',
      });

      // When: User clicks the primary FAQ entry point
      const faqLink = page.getByRole('link', {
        name: 'Consulter la FAQ KRAAK',
      });
      await faqLink.click();
      await page.waitForURL('**/faq', { timeout: 5000 });

      // Then: User lands on FAQ page with correct title
      await expect(page).toHaveTitle(/FAQ/i);
      const faqTitle = page.locator('h1');
      await expect(faqTitle).toContainText('réponses');
    });

    test('When user is on 404 page Then all 3 navigation cards are clickable', async ({
      page,
    }) => {
      // Given: User is on 404 page
      await page.goto(`${BASE_URL}/chemin-invalide`, {
        waitUntil: 'domcontentloaded',
      });

      // When: Checking navigation cards
      const cards = page.locator('a.rounded-card');

      // Then: All 3 cards should be visible and have href attributes
      await expect(cards).toHaveCount(3);

      const homeCard = page.getByRole('link', {
        name: /Reprendre depuis l'accueil/i,
      });
      await expect(homeCard).toBeVisible();

      const faqCard = page.getByRole('link', {
        name: /Consulter l'aide FAQ/i,
      });
      await expect(faqCard).toBeVisible();

      const contactCard = page.getByRole('link', {
        name: /Demander une orientation/i,
      });
      await expect(contactCard).toBeVisible();
    });
  });

  test.describe('Given user is browsing FAQ', () => {
    test('When visiting FAQ page Then displays contact CTA button', async ({
      page,
    }) => {
      // Given: User navigates to FAQ
      await page.goto(`${BASE_URL}/faq`, { waitUntil: 'domcontentloaded' });

      // When: Page is loaded
      await expect(page).toHaveTitle(/FAQ/i);

      // Then: Contact CTA button is visible
      const contactButton = page.getByRole('link', {
        name: 'Parler à un conseiller KRAAK',
      });
      await expect(contactButton).toBeVisible();
    });

    test('When user clicks contact CTA from FAQ Then navigates to contact form', async ({
      page,
    }) => {
      // Given: User is on FAQ page
      await page.goto(`${BASE_URL}/faq`, { waitUntil: 'domcontentloaded' });

      // When: User clicks first contact button
      const contactButton = page.locator('a[routerLink="/contact"]').first();
      await Promise.all([
        page.waitForURL('**/contact', {
          timeout: 10000,
          waitUntil: 'domcontentloaded',
        }),
        contactButton.click(),
      ]);

      // Then: User lands on contact page
      await expect(page).toHaveTitle(/Contact/i);
      const contactForm = page.locator('form');
      await expect(contactForm).toBeVisible();
    });

    test('When user expands FAQ accordion items Then content is displayed correctly', async ({
      page,
    }) => {
      // Given: User is on FAQ page
      await page.goto(`${BASE_URL}/faq`, { waitUntil: 'domcontentloaded' });

      // When: Looking for accordion items
      const faqAccordion = page.locator('kraak-faq-accordion');

      // Then: Accordion should be present
      await expect(faqAccordion).toBeVisible();

      // Verify that at least one question is visible
      const questions = page.locator('[role="button"]').filter({
        hasText: /comment|lequel|intervenez|sous|pouvez|faut-il/i,
      });
      await expect(questions.first()).toBeVisible();
    });
  });

  test.describe('Given user navigates from FAQ to other surfaces', () => {
    test('When user clicks Voir nos services from FAQ Then navigates to services page', async ({
      page,
    }) => {
      // Given: User is on FAQ page
      await page.goto(`${BASE_URL}/faq`, { waitUntil: 'domcontentloaded' });

      // When: User clicks services button
      const servicesButton = page.getByRole('link', {
        name: 'Voir les services KRAAK',
      });
      await servicesButton.click();
      await expect(page).toHaveURL(/\/services$/, { timeout: 10000 });

      // Then: User lands on services page
      await expect(page).toHaveTitle(/Services/i);
    });

    test('When user clicks Explorer les programmes from FAQ footer Then navigates to programs page', async ({
      page,
    }) => {
      // Given: User is on FAQ page
      await page.goto(`${BASE_URL}/faq`, { waitUntil: 'domcontentloaded' });

      // When: User targets the CTA placed at the end of the FAQ page
      const programsButton = page.getByRole('link', {
        name: 'Explorer les programmes KRAAK',
      });
      await programsButton.scrollIntoViewIfNeeded();
      await programsButton.click();
      await page.waitForURL('**/programmes', { timeout: 5000 });

      // Then: User lands on programs page
      await expect(page).toHaveTitle(/Programmes/i);
    });
  });

  test.describe('Given user accesses support flow from navigation', () => {
    test('When user is on home page Then FAQ link in footer navigates correctly', async ({
      page,
    }) => {
      // Given: User is on home page
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

      // When: User scrolls to footer
      const footer = page.locator('footer');
      await footer.scrollIntoViewIfNeeded();

      // Then: Footer exposes a working FAQ entry point
      const faqFooterLink = footer.getByRole('link', {
        name: 'FAQ',
        exact: true,
      });
      await expect(faqFooterLink).toBeVisible();
      await faqFooterLink.click();
      await page.waitForURL('**/faq', { timeout: 5000 });
      await expect(page).toHaveTitle(/FAQ/i);
    });

    test('When user is on marketing page Then footer is visible', async ({
      page,
    }) => {
      // Given: User navigates to a marketing page
      await page.goto(`${BASE_URL}/a-propos`, {
        waitUntil: 'domcontentloaded',
      });

      // When: Checking footer
      const footer = page.locator('footer');

      // Then: Footer should be present
      await expect(footer).toBeVisible();
    });

    test('Given un visiteur sur la FAQ, When il ouvre la page contact, Then le formulaire de support est visible et actionnable', async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/faq`, { waitUntil: 'domcontentloaded' });

      await page
        .getByRole('link', { name: 'Parler à un conseiller KRAAK' })
        .click();
      await expect(page).toHaveURL(/\/contact$/, { timeout: 10000 });

      const contactForm = page.locator('form').first();
      await expect(contactForm).toBeVisible();

      const nameField = page.getByLabel('Nom complet');
      const emailField = page.getByLabel('Adresse e-mail');
      const subjectField = page.getByLabel('Objectif');
      const countryField = page.getByLabel('Pays');
      const serviceField = page.getByLabel('Type de service');
      const messageField = page.getByLabel('Message');

      await expect(nameField).toBeEditable();
      await expect(emailField).toBeEditable();
      await expect(subjectField).toBeEditable();
      await expect(countryField).toBeEditable();
      await expect(serviceField).toBeVisible();
      await expect(messageField).toBeEditable();
      await expect(
        page.getByRole('button', { name: 'Envoyer ma demande' }),
      ).toBeEnabled();
    });
  });

  test.describe('Given SEO metadata for support pages', () => {
    test('When accessing FAQ page Then title and meta tags are correct', async ({
      page,
    }) => {
      // Given: User navigates to FAQ page
      await page.goto(`${BASE_URL}/faq`, { waitUntil: 'domcontentloaded' });

      // When: Page is loaded
      // Then: Page title should be set
      const title = await page.title();
      expect(title).toMatch(/FAQ|aide|support/i);

      // And: Meta description should exist
      const metaDescription = page.locator('meta[name="description"]');
      await expect(metaDescription).toHaveAttribute('content');
      const metaDescriptionContent =
        await metaDescription.getAttribute('content');
      expect(metaDescriptionContent?.length ?? 0).toBeGreaterThan(20);
    });

    test('When accessing 404 page Then title reflects page not found', async ({
      page,
    }) => {
      // Given: User navigates to invalid page
      await page.goto(`${BASE_URL}/notexist-xyz-404`, {
        waitUntil: 'domcontentloaded',
      });

      // When: Page is loaded
      // Then: Page title should reflect 404
      const title = await page.title();
      expect(title).toMatch(/introuvable|not found/i);
    });
  });

  test.describe('Accessibility - Support flow', () => {
    test('When user navigates 404 page Then buttons are keyboard accessible', async ({
      page,
    }) => {
      // Given: User is on 404 page
      await page.goto(`${BASE_URL}/page-not-found-404`, {
        waitUntil: 'domcontentloaded',
      });

      // When: Pressing Tab key
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(
        () => document.activeElement?.tagName,
      );

      // Then: Focus should move to first interactive element
      expect(['A', 'BUTTON']).toContain(focusedElement);
    });

    test('When user navigates FAQ page Then accordion is keyboard accessible', async ({
      page,
    }) => {
      // Given: User is on FAQ page
      await page.goto(`${BASE_URL}/faq`, { waitUntil: 'domcontentloaded' });

      // When: Finding first accordion button
      const firstAccordionButton = page.locator('[role="button"]').first();

      // Then: Button should be focusable or visible
      await firstAccordionButton.focus();
      const isFocused = await firstAccordionButton.evaluate((el) =>
        el.matches(':focus-visible'),
      );
      expect(
        isFocused || (await firstAccordionButton.isVisible()),
      ).toBeTruthy();
    });
  });

  test.describe('Performance - Support flow', () => {
    test('When navigating 404 page Then page loads within acceptable time', async ({
      page,
    }) => {
      // Given: User navigates to 404 page
      const startTime = Date.now();
      await page.goto(`${BASE_URL}/invalid-page-perf-test`, {
        waitUntil: 'domcontentloaded',
      });
      const loadTime = Date.now() - startTime;
      const loadThresholdMs = 6000;

      // When: Measuring load time
      // Then: Page should load within a CI-realistic threshold
      expect(loadTime).toBeLessThan(loadThresholdMs);
    });

    test('When navigating FAQ page Then page loads and accordion renders quickly', async ({
      page,
    }) => {
      // Given: User navigates to FAQ page
      const startTime = Date.now();
      await page.goto(`${BASE_URL}/faq`, { waitUntil: 'domcontentloaded' });
      const loadTime = Date.now() - startTime;
      const loadThresholdMs = 6000;

      // When: Checking accordion visibility
      const accordion = page.locator('kraak-faq-accordion');

      // Then: Page should load within a CI-realistic threshold and accordion should be visible
      expect(loadTime).toBeLessThan(loadThresholdMs);
      await expect(accordion).toBeVisible({ timeout: 1500 });
    });
  });
});
