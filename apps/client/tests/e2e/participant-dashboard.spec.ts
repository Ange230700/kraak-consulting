// apps\client\tests\e2e\participant-dashboard.spec.ts

import { expect, test } from '@playwright/test';

const participantAreaExpected =
  (process.env['KRAAK_E2E_EXPECT_PARTICIPANT_AREA'] ??
    process.env['CLIENT_FEATURE_PARTICIPANT_AREA'] ??
    'true') === 'true';

// E2E — protection de la vue dashboard web participant (DSH-04)
// Given/When/Then : un visiteur non authentifié ne doit pas voir le dashboard.

test.describe('Dashboard web participant — protection de route', () => {
  test(`Given un visiteur non authentifié, When il navigue vers /participant/dashboard et l'espace est activé, Then la route redirige vers la connexion`, async ({
    page,
  }) => {
    test.skip(
      !participantAreaExpected,
      'Espace participant non activé dans cet environnement',
    );
    await page.goto('/participant/dashboard');
    await expect(page).toHaveURL(/\/connexion$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Connexion' }),
    ).toBeVisible();
  });

  test(`Given un visiteur non authentifié, When il navigue vers /participant/dashboard et l'espace est désactivé, Then une page 404 est affichée`, async ({
    page,
  }) => {
    test.skip(
      participantAreaExpected,
      'Espace participant activé dans cet environnement',
    );
    await page.goto('/participant/dashboard');
    await expect(page).toHaveURL(/\/participant\/dashboard$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Oups.' }),
    ).toBeVisible();
  });

  test(`Given un visiteur non authentifié, When il navigue vers /participant et l'espace est activé, Then la redirection vers le dashboard reste protégée`, async ({
    page,
  }) => {
    test.skip(
      !participantAreaExpected,
      'Espace participant non activé dans cet environnement',
    );
    await page.goto('/participant');
    await expect(page).toHaveURL(/\/connexion$/);
  });

  test(`Given un visiteur non authentifié, When il navigue vers /participant et l'espace est désactivé, Then une page 404 est affichée`, async ({
    page,
  }) => {
    test.skip(
      participantAreaExpected,
      'Espace participant activé dans cet environnement',
    );
    await page.goto('/participant');
    await expect(page).toHaveURL(/\/participant$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Oups.' }),
    ).toBeVisible();
  });

  test(`Given un visiteur non authentifié, When il tente d'accéder à /participant/dashboard et l'espace est activé, Then la vue privée n'est pas affichée`, async ({
    page,
  }) => {
    test.skip(
      !participantAreaExpected,
      'Espace participant non activé dans cet environnement',
    );
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

  test(`Given un visiteur non authentifié, When il tente d'accéder à /participant/dashboard et l'espace est désactivé, Then la vue privée n'est pas affichée`, async ({
    page,
  }) => {
    test.skip(
      participantAreaExpected,
      'Espace participant activé dans cet environnement',
    );
    await page.goto('/participant/dashboard');
    await expect(page).toHaveURL(/\/participant\/dashboard$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Oups.' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: /Bonjour .* vue d'ensemble/,
      }),
    ).toHaveCount(0);
  });
});
