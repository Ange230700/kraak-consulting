import { expect, test } from '@playwright/test';

test.describe('Auth flow - connexion, inscription et reset', () => {
  test('Given une page de connexion, When elle se charge, Then le formulaire et les liens d acces sont visibles', async ({
    page,
  }) => {
    await page.goto('/connexion');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Connexion' }),
    ).toBeVisible();
    await expect(
      page.getByRole('textbox', { name: 'Adresse email' }),
    ).toBeVisible();
    await expect(
      page.getByRole('textbox', { name: 'Mot de passe' }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Créer un compte' }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Mot de passe oublié' }),
    ).toBeVisible();
  });

  test('Given une page de connexion, When le visiteur ouvre la creation de compte, Then la page d inscription est affichée', async ({
    page,
  }) => {
    await page.goto('/connexion');

    await page.getByRole('link', { name: 'Créer un compte' }).click();

    await expect(page).toHaveURL(/\/inscription$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Créer un compte' }),
    ).toBeVisible();
  });

  test('Given une page de connexion, When le visiteur ouvre le reset, Then la page de reinitialisation est affichée', async ({
    page,
  }) => {
    await page.goto('/connexion');

    await page.getByRole('link', { name: 'Mot de passe oublié' }).click();

    await expect(page).toHaveURL(/\/mot-de-passe-oublie$/);
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Reinitialiser mon mot de passe',
      }),
    ).toBeVisible();
  });
});
