import { expect, test } from '@playwright/test';

test.describe('Page programmes - parcours vitrine', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/programmes', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      "Orientation d'abord, format adapté ensuite.",
    );
  });

  test('Given la page Programmes, When elle se charge, Then le titre principal et les formats clés sont visibles', async ({
    page,
  }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      "Orientation d'abord, format adapté ensuite.",
    );

    await expect(
      page.getByText("Ateliers d'employabilité et de posture professionnelle"),
    ).toBeVisible();
    await expect(
      page.getByText('Préparation linguistique et tests de langue'),
    ).toBeVisible();
    await expect(
      page.getByText('Orientation études, travail et mobilité internationale'),
    ).toBeVisible();
    await expect(
      page.getByText(
        'Interventions collectives pour écoles, associations et entreprises',
      ),
    ).toBeVisible();
  });

  test("Given la section d'orientation, When elle est lue, Then les quatre étapes de parcours sont présentées", async ({
    page,
  }) => {
    await expect(
      page.getByRole('heading', {
        name: 'Comment être orienté vers le bon programme ?',
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

  test("Given le call-to-action de fin de page, When un visiteur veut être orienté, Then l'action mène vers la page contact", async ({
    page,
  }) => {
    const cta = page.getByRole('link', { name: 'Demander une orientation' });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/contact');
  });
});
