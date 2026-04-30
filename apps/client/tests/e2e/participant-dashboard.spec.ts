import { expect, test } from '@playwright/test';

// E2E — protection de la vue dashboard web participant (DSH-04)
// Given/When/Then : un visiteur non authentifié ne doit pas voir le dashboard.

test.describe('Dashboard web participant — protection de route', () => {
  test(`Given un visiteur non authentifié, When il navigue vers /participant/dashboard, Then la route est protégée et redirige vers la connexion`, async ({
    page,
  }) => {
    await page.goto('/participant/dashboard');

    // Le guard participant redirige vers la connexion quand l'utilisateur n'est
    // pas authentifié comme participant.
    await expect(page).toHaveURL(/\/connexion$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Connexion' }),
    ).toBeVisible();
  });

  test(`Given un visiteur non authentifié, When il navigue vers /participant, Then la redirection vers le dashboard reste protégée`, async ({
    page,
  }) => {
    await page.goto('/participant');

    await expect(page).toHaveURL(/\/connexion$/);
  });

  test(`Given un visiteur non authentifié, When il tente d'accéder à /participant/dashboard, Then la vue privée n'est pas affichée`, async ({
    page,
  }) => {
    await page.goto('/participant/dashboard');

    await expect(page).toHaveURL(/\/connexion$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Connexion' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: /Bonjour .* vue d'ensemble/,
      }),
    ).toHaveCount(0);
  });
});
