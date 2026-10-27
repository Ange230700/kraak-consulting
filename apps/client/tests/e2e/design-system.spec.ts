import { expect, test } from '@playwright/test';

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
    await expect(heroCopy).toHaveCSS('text-align', 'start');
    const expectedPadding = await heroInner.evaluate(() => {
      const width = window.innerWidth;
      if (width >= 1280) return '64px';
      if (width >= 1024) return '48px';
      if (width >= 640) return '32px';
      return '24px';
    });
    await expect(heroInner).toHaveCSS('padding-right', expectedPadding);
    await expect(heroInner).toHaveCSS('padding-left', expectedPadding);
  });

  test(`Given la page d'accueil, When le design system se charge, Then le CTA principal applique le style KRAAK`, async ({
    page,
  }) => {
    const primaryCta = page
      .locator('kraak-home-page .hero-copy')
      .getByRole('link', {
        name: 'Réserver une consultation',
      });

    await expect(primaryCta).toBeVisible();
    await expect(primaryCta).toHaveCSS('display', 'flex');
    await expect(primaryCta).toHaveClass(/kr-button-primary/);
    await expect(primaryCta).toHaveClass(/rounded-full/);
    await expect(primaryCta).toHaveCSS('padding-top', '14px');
    await expect(primaryCta).toHaveCSS('padding-right', '28px');
    await expect(primaryCta).toHaveCSS('padding-bottom', '14px');
    await expect(primaryCta).toHaveCSS('padding-left', '28px');
  });
});
