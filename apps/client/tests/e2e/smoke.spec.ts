import { expect, test } from '@playwright/test';

// Smoke E2E — shell web KRAAK
// Given/When/Then : vérification des éléments visibles après chargement

test.describe(`Page d'accueil — smoke tests`, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test(`Given la page d'accueil, When elle se charge, Then le titre du document contient "KRAAK"`, async ({
    page,
  }) => {
    await expect(page).toHaveTitle('KRAAK | Développez votre potentiel');
  });

  test(`Given la page d'accueil, When elle se charge, Then la marque KRAAK est visible dans la navigation`, async ({
    page,
  }) => {
    await expect(page.getByRole('banner')).toContainText('KRAAK');
    await expect(
      page.getByRole('img', { name: 'Logo KRAAK Consulting' }),
    ).toBeVisible();
  });

  test(`Given la page d'accueil, When elle se charge, Then l'appel à l'action "Espace participant" est visible`, async ({
    page,
  }) => {
    await expect(
      page.getByRole('link', { name: 'Espace participant' }).first(),
    ).toBeVisible();
  });

  test(`Given la page d'accueil, When elle se charge, Then le pied de page affiche la promesse KRAAK`, async ({
    page,
  }) => {
    await expect(page.getByRole('contentinfo')).toContainText(
      `Accompagner l'ambition. Former le leadership. Ouvrir les chemins.`,
    );
  });
});
