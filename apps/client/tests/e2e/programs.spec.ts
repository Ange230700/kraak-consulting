import { expect, test } from '@playwright/test';

test.describe('Page programmes - parcours vitrine', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/programmes', { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Des programmes conçus pour transformer des trajectoires.',
      }),
    ).toBeVisible();
  });

  test('Given la page Programmes, When elle se charge, Then le titre principal et les parcours clés sont visibles', async ({
    page,
  }) => {
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Des programmes conçus pour transformer des trajectoires.',
      }),
    ).toBeVisible();

    await expect(page.getByText('Ateliers leadership jeunesse')).toBeVisible();
    await expect(page.getByText('Engagement communautaire')).toBeVisible();
    await expect(page.getByText('Programmes pour étudiants')).toBeVisible();
    await expect(page.getByText('Conférences et forums')).toBeVisible();
  });

  test("Given la section d'inscription, When elle est lue, Then les quatre étapes de parcours sont présentées", async ({
    page,
  }) => {
    await expect(
      page.getByRole('heading', { name: "Comment s'inscrire ?" }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Candidature' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Entretien' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Inscription' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Démarrage' }),
    ).toBeVisible();
  });

  test("Given le call-to-action de fin de page, When un visiteur veut rejoindre une cohorte, Then l'action mène vers la page contact", async ({
    page,
  }) => {
    const cta = page.getByRole('link', { name: 'Rejoindre un programme' });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/contact');
  });
});
