import { expect, test } from '@playwright/test';

test.describe('Page ressources - parcours vitrine', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ressources', { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Ressources pour clarifier votre prochaine étape',
      }),
    ).toBeVisible();
  });

  test('Given la page Ressources, When elle se charge, Then les trois piliers de ressources sont visibles', async ({
    page,
  }) => {
    await expect(
      page.getByRole('heading', { name: 'Formation' }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Projet' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Immigration' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Entreprise' }),
    ).toBeVisible();
  });

  test('Given la page Ressources, When un visiteur veut un accompagnement ciblé, Then le CTA principal mène vers la page contact', async ({
    page,
  }) => {
    const cta = page.getByRole('link', { name: 'Demander une orientation' });

    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/contact');
  });
});
