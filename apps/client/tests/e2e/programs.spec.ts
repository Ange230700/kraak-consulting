import { expect, test } from '@playwright/test';

test.describe('Page programmes - parcours vitrine', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/programmes', { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: "Programmes KRAAK : orientation d'abord, format adapt\u00e9 ensuite.",
      }),
    ).toBeVisible();
  });

  test('Given la page Programmes, When elle se charge, Then le titre principal et les formats clés sont visibles', async ({
    page,
  }) => {
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: "Programmes KRAAK : orientation d'abord, format adapt\u00e9 ensuite.",
      }),
    ).toBeVisible();

    await expect(
      page.getByText(
        "Ateliers d'employabilit\u00e9 et de posture professionnelle",
      ),
    ).toBeVisible();
    await expect(
      page.getByText('Pr\u00e9paration linguistique et tests de langue'),
    ).toBeVisible();
    await expect(
      page.getByText(
        'Orientation \u00e9tudes, travail et mobilit\u00e9 internationale',
      ),
    ).toBeVisible();
    await expect(
      page.getByText(
        'Interventions collectives pour \u00e9coles, associations et entreprises',
      ),
    ).toBeVisible();
  });

  test("Given la section d'orientation, When elle est lue, Then les quatre étapes de parcours sont presentees", async ({
    page,
  }) => {
    await expect(
      page.getByRole('heading', {
        name: 'Comment \u00eatre orient\u00e9 vers le bon programme ?',
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Demande de contact' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: "Entretien d'orientation" }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Proposition de format' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Confirmation' }),
    ).toBeVisible();
  });

  test("Given le call-to-action de fin de page, When un visiteur veut être oriente, Then l'action mene vers la page contact", async ({
    page,
  }) => {
    const cta = page.getByRole('link', { name: 'Demander une orientation' });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/contact');
  });
});
