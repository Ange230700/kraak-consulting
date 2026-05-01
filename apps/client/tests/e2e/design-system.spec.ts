import { expect, test } from '@playwright/test';

test.describe(`Design system web — smoke styling`, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test(`Given la page d'accueil, When le design system se charge, Then la section hero applique les utilitaires Tailwind`, async ({
    page,
  }) => {
    const heroSection = page.locator('kraak-home-page section').first();
    const heroInner = heroSection.locator('div.relative.z-10').first();

    await expect(heroSection).toBeVisible();
    await expect(heroSection).toHaveCSS('text-align', 'center');
    await expect(heroSection).toHaveCSS('padding-top', '112px');
    await expect(heroSection).toHaveCSS('padding-bottom', '112px');
    await expect(heroInner).toHaveCSS('padding-right', '24px');
    await expect(heroInner).toHaveCSS('padding-left', '24px');
  });

  test(`Given la page d'accueil, When le design system se charge, Then le CTA principal applique le style KRAAK`, async ({
    page,
  }) => {
    const primaryCta = page
      .getByRole('link', { name: 'Espace participant' })
      .first();

    await expect(primaryCta).toBeVisible();
    await expect(primaryCta).toHaveCSS('display', 'inline-flex');
    await expect(primaryCta).toHaveCSS('border-top-left-radius', '12px');
    await expect(primaryCta).toHaveCSS('border-top-right-radius', '12px');
    await expect(primaryCta).toHaveCSS('background-color', 'rgb(22, 115, 174)');
    await expect(primaryCta).toHaveCSS('padding-top', '10px');
    await expect(primaryCta).toHaveCSS('padding-right', '20px');
    await expect(primaryCta).toHaveCSS('padding-bottom', '10px');
    await expect(primaryCta).toHaveCSS('padding-left', '20px');
  });
});
