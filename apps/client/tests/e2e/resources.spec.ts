import { expect, test } from '@playwright/test';

test.describe('Page ressources - parcours vitrine', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ressources', { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Ressources utiles pour avancer avec méthode',
      }),
    ).toBeVisible();
  });

  test('Given la page Ressources, When elle se charge, Then les trois piliers de ressources sont visibles', async ({
    page,
  }) => {
    await expect(
      page.getByRole('heading', { name: 'Formation' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Gestion de projet' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'International' }),
    ).toBeVisible();
  });

  test('Given la page Ressources, When un visiteur veut un accompagnement ciblé, Then le CTA principal mène vers la page contact', async ({
    page,
  }) => {
    const cta = page.getByRole('link', { name: "Parler à l'équipe KRAAK" });

    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/contact');
  });
});
