import { expect, test } from '@playwright/test';

test.describe('Page ressources - parcours vitrine', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ressources', { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: "Ressources d'orientation pour clarifier votre prochaine \u00e9tape",
      }),
    ).toBeVisible();
  });

  test("Given la page Ressources, When elle se charge, Then elle se presente comme une page d'orientation et non comme un hub de contenus", async ({
    page,
  }) => {
    await expect(
      page.getByText(
        "Cette page n'est pas un hub d'actualit\u00e9s ou une biblioth\u00e8que de contenus",
      ),
    ).toBeVisible();
  });

  test('Given la page Ressources, When elle se charge, Then les quatre piliers d orientation sont visibles', async ({
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

  test('Given la page Ressources, When un visiteur veut un accompagnement cible, Then le CTA principal mene vers la page contact', async ({
    page,
  }) => {
    const cta = page.getByRole('link', { name: 'Demander une orientation' });

    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/contact');
  });
});
