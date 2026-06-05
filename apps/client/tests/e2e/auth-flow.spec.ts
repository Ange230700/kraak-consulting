import { expect, test } from '@playwright/test';

const participantAreaExpected =
  process.env['KRAAK_E2E_EXPECT_PARTICIPANT_AREA'] === 'true';

test.describe('Auth flow - connexion, inscription et reset', () => {
  test('Given une page de connexion, When elle se charge, Then le formulaire et les liens d\u0027accès sont visibles', async ({
    page,
  }) => {
    test.skip(
      !participantAreaExpected,
      'Espace participant non activé dans cet environnement',
    );
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

  test('Given une page de connexion, When le visiteur ouvre la création de compte, Then la page d inscription est affichée', async ({
    page,
  }) => {
    test.skip(
      !participantAreaExpected,
      'Espace participant non activé dans cet environnement',
    );
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
    test.skip(
      !participantAreaExpected,
      'Espace participant non activé dans cet environnement',
    );
    await page.goto('/connexion');

    await page.getByRole('link', { name: 'Mot de passe oublié' }).click();

    await expect(page).toHaveURL(/\/mot-de-passe-oublie$/);
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Réinitialiser mon mot de passe',
      }),
    ).toBeVisible();
  });
});
