import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function revealPrimaryCta(page: Page) {
  const primaryCta = page
    .getByRole('link', { name: 'Réserver une consultation' })
    .first();
  const mobileMenuButton = page.getByRole('button', {
    name: 'Menu de navigation',
  });

  await expect(page.getByRole('banner')).toBeVisible();

  const mobileMenuVisible = await mobileMenuButton
    .waitFor({ state: 'visible', timeout: 2_000 })
    .then(() => true)
    .catch(() => false);

  if (mobileMenuVisible) {
    await mobileMenuButton.click();
  }

  await expect(primaryCta).toBeVisible();

  return primaryCta;
}

test.describe(`Design system web — smoke styling`, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test(`Given la page d'accueil, When le design system se charge, Then la section hero applique les utilitaires Tailwind`, async ({
    page,
  }) => {
    const heroSection = page.locator('kraak-home-page section').first();
    const heroCopy = page.locator('kraak-home-page .hero-copy').first();
    const heroInner = heroSection.locator('div.relative.z-10').first();

    await expect(heroSection).toBeVisible();
    await expect(heroSection).toHaveCSS('text-align', 'start');
    await expect(heroCopy).toHaveCSS('text-align', 'left');
    await expect(heroInner).toHaveCSS('padding-right', '24px');
    await expect(heroInner).toHaveCSS('padding-left', '24px');
  });

  test(`Given la page d'accueil, When le design system se charge, Then le CTA principal applique le style KRAAK`, async ({
    page,
  }) => {
    const primaryCta = await revealPrimaryCta(page);

    await expect(primaryCta).toBeVisible();
    await expect(primaryCta).toHaveCSS('display', 'flex');
    await expect(primaryCta).toHaveClass(/kr-button-primary/);
    await expect(primaryCta).toHaveClass(/rounded-2xl/);
    await expect(primaryCta).toHaveCSS('padding-top', '16px');
    await expect(primaryCta).toHaveCSS('padding-right', '32px');
    await expect(primaryCta).toHaveCSS('padding-bottom', '16px');
    await expect(primaryCta).toHaveCSS('padding-left', '32px');
  });
});
