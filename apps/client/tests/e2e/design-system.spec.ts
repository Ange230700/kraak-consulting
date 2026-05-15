import { expect, test } from '@playwright/test';

async function revealParticipantCta(page: Parameters<typeof test>[0]['page']) {
  const participantCta = page
    .getByRole('link', { name: 'Espace participant' })
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

  await expect(participantCta).toBeVisible();

  return participantCta;
}

test.describe(`Design system web — smoke styling`, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test(`Given la page d'accueil, When le design system se charge, Then la section hero applique les utilitaires Tailwind`, async ({
    page,
  }) => {
    const heroSection = page.locator('kraak-home-page section').first();
    const heroInner = heroSection.locator('div.relative.z-10').first();
    const viewportSize = page.viewportSize();
    const isDesktopViewport = (viewportSize?.width ?? 0) >= 1024;

    await expect(heroSection).toBeVisible();
    await expect(heroSection).toHaveCSS('text-align', 'center');
    await expect(heroSection).toHaveCSS(
      'padding-top',
      isDesktopViewport ? '112px' : '80px',
    );
    await expect(heroSection).toHaveCSS(
      'padding-bottom',
      isDesktopViewport ? '112px' : '80px',
    );
    await expect(heroInner).toHaveCSS('padding-right', '24px');
    await expect(heroInner).toHaveCSS('padding-left', '24px');
  });

  test(`Given la page d'accueil, When le design system se charge, Then le CTA principal applique le style KRAAK`, async ({
    page,
  }) => {
    const primaryCta = await revealParticipantCta(page);

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
