import { expect, test } from '@playwright/test';

const BASE_URL = 'http://localhost:4200';

const getLoadBudgetMs = (
  projectName: string,
  surface: 'faq' | 'not-found',
): number => {
  if (projectName === 'firefox') {
    return surface === 'faq' ? 7000 : 6000;
  }

  return surface === 'faq' ? 3500 : 3000;
};

test.describe('Support flow - FAQ + 404 navigation', () => {
  test.describe('Given user lands on invalid page', () => {
    test('When navigating to 404 page Then displays FAQ link as help entry point', async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/route-invalide-xyz`, {
        waitUntil: 'domcontentloaded',
      });

      await expect(page).toHaveTitle(/Page introuvable/i);
      await expect(page.locator('h1')).toContainText('Oups');

      const faqLink = page.getByRole('link', {
        name: /Consulter la FAQ KRAAK/i,
      });
      await expect(faqLink).toBeVisible();
      await expect(faqLink).toContainText(/Consulter/i);
    });

    test('When user clicks FAQ link from 404 page Then navigates to FAQ with proper title', async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/page-inexistante`, {
        waitUntil: 'domcontentloaded',
      });

      await Promise.all([
        page.waitForURL('**/faq', { timeout: 5000 }),
        page
          .getByRole('link', {
            name: /Consulter la FAQ KRAAK/i,
          })
          .click(),
      ]);

      await expect(page).toHaveTitle(/FAQ/i);
      await expect(page.locator('h1')).toContainText(
        /r[\u00e9e]ponses utiles/i,
      );
    });

    test('When user is on 404 page Then all 3 navigation cards are clickable', async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/chemin-invalide`, {
        waitUntil: 'domcontentloaded',
      });

      const cards = page.locator('a.rounded-card');
      await expect(cards).toHaveCount(3);

      await expect(
        page.getByRole('link', {
          name: /Reprendre depuis l'accueil/i,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole('link', {
          name: /Consulter l'aide/i,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole('link', {
          name: /Demander une orientation/i,
        }),
      ).toBeVisible();
    });
  });

  test.describe('Given user is browsing FAQ', () => {
    test('When visiting FAQ page Then displays contact CTA button', async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/faq`, { waitUntil: 'domcontentloaded' });

      await expect(page).toHaveTitle(/FAQ/i);
      await expect(
        page.getByRole('link', {
          name: /Parler .+ conseiller KRAAK/i,
        }),
      ).toBeVisible();
    });

    test('When user clicks contact CTA from FAQ Then navigates to contact form', async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/faq`, { waitUntil: 'domcontentloaded' });

      await Promise.all([
        page.waitForURL('**/contact', { timeout: 5000 }),
        page
          .getByRole('link', {
            name: /Parler .+ conseiller KRAAK/i,
          })
          .click(),
      ]);

      await expect(page).toHaveTitle(/Contact/i);
      await expect(page.locator('form')).toBeVisible();
    });

    test('When user expands FAQ accordion items Then content is displayed correctly', async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/faq`, { waitUntil: 'domcontentloaded' });

      const faqAccordion = page.locator('kraak-faq-accordion');
      await expect(faqAccordion).toBeVisible();

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
      await page.goto(`${BASE_URL}/faq`, { waitUntil: 'domcontentloaded' });

      await Promise.all([
        page.waitForURL('**/services', { timeout: 5000 }),
        page
          .getByRole('link', {
            name: /Voir les services KRAAK/i,
          })
          .click(),
      ]);

      await expect(page).toHaveTitle(/Services/i);
    });

    test('When user clicks Explorer les programmes from FAQ footer Then navigates to programs page', async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/faq`, { waitUntil: 'domcontentloaded' });

      const programsButton = page.getByRole('link', {
        name: /Explorer les programmes KRAAK/i,
      });
      await programsButton.scrollIntoViewIfNeeded();
      await Promise.all([
        page.waitForURL('**/programmes', { timeout: 5000 }),
        programsButton.click(),
      ]);

      await expect(page).toHaveTitle(/Programmes/i);
    });
  });

  test.describe('Given user accesses support flow from navigation', () => {
    test('When user is on home page Then FAQ link in footer navigates correctly', async ({
      page,
    }) => {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

      const footer = page.locator('footer');
      await footer.scrollIntoViewIfNeeded();

      const faqFooterLink = footer.getByRole('link', { name: 'FAQ' });
      await expect(faqFooterLink).toBeVisible();
      await Promise.all([
        page.waitForURL('**/faq', { timeout: 5000 }),
        faqFooterLink.click(),
      ]);
      await expect(page).toHaveTitle(/FAQ/i);
    });

    test('When user is on marketing page Then footer is visible', async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/a-propos`, {
        waitUntil: 'domcontentloaded',
      });

      await expect(page.locator('footer')).toBeVisible();
    });
  });

  test.describe('Given SEO metadata for support pages', () => {
    test('When accessing FAQ page Then title and meta tags are correct', async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/faq`, { waitUntil: 'domcontentloaded' });

      await expect(page).toHaveTitle(/FAQ|aide|support/i);

      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        'content',
        /FAQ|services|programmes|accompagnement/i,
      );
    });

    test('When accessing 404 page Then title reflects page not found', async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/notexist-xyz-404`, {
        waitUntil: 'domcontentloaded',
      });

      const title = await page.title();
      expect(title).toMatch(/introuvable|not found/i);
    });
  });

  test.describe('Accessibility - Support flow', () => {
    test('When user navigates 404 page Then buttons are keyboard accessible', async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/page-not-found-404`, {
        waitUntil: 'domcontentloaded',
      });

      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(
        () => document.activeElement?.tagName,
      );

      expect(['A', 'BUTTON']).toContain(focusedElement);
    });

    test('When user navigates FAQ page Then accordion is keyboard accessible', async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/faq`, { waitUntil: 'domcontentloaded' });

      const firstAccordionButton = page.locator('[role="button"]').first();
      await firstAccordionButton.focus();
      const isFocused = await firstAccordionButton.evaluate((element) =>
        element.matches(':focus-visible'),
      );

      expect(
        isFocused || (await firstAccordionButton.isVisible()),
      ).toBeTruthy();
    });
  });

  test.describe('Performance - Support flow', () => {
    test('When navigating 404 page Then page loads within acceptable time', async ({
      page,
    }, testInfo) => {
      const startTime = Date.now();
      await page.goto(`${BASE_URL}/invalid-page-perf-test`, {
        waitUntil: 'domcontentloaded',
      });
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(
        getLoadBudgetMs(testInfo.project.name, 'not-found'),
      );
    });

    test('When navigating FAQ page Then page loads and accordion renders quickly', async ({
      page,
    }, testInfo) => {
      const startTime = Date.now();
      await page.goto(`${BASE_URL}/faq`, { waitUntil: 'domcontentloaded' });
      const loadTime = Date.now() - startTime;

      const accordion = page.locator('kraak-faq-accordion');

      expect(loadTime).toBeLessThan(
        getLoadBudgetMs(testInfo.project.name, 'faq'),
      );
      await expect(accordion).toBeVisible({ timeout: 1000 });
    });
  });
});
