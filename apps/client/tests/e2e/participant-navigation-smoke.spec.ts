import { expect, test } from '@playwright/test';

import { revealNavigation } from './navigation';

const participantAreaExpected =
  (process.env['KRAAK_E2E_EXPECT_PARTICIPANT_AREA'] ??
    process.env['CLIENT_FEATURE_PARTICIPANT_AREA'] ??
    'true') === 'true';

test.describe('Navigation et disponibilité de l’espace participant', () => {
  if (participantAreaExpected) {
    test('Given le site web, When la navigation est ouverte et l’espace est activé, Then le lien Espace participant est visible', async ({
      page,
    }) => {
      await page.goto('/');
      await revealNavigation(page);
      const participantLink = page
        .getByRole('link', { name: 'Espace participant' })
        .first();
      await expect(participantLink).toBeVisible();
      await expect(participantLink).toHaveAttribute(
        'href',
        '/participant/dashboard',
      );
    });
  } else {
    test('Given le site web, When la navigation est ouverte et l’espace est désactivé, Then le lien Espace participant est absent', async ({
      page,
    }) => {
      await page.goto('/');
      await revealNavigation(page);
      const participantLink = page
        .getByRole('link', { name: 'Espace participant' })
        .first();
      await expect(participantLink).toHaveCount(0);
    });
  }

  test('Given le site web, When la page a-propos est chargée, Then sa présentation est visible', async ({
    page,
  }) => {
    await page.goto('/a-propos');

    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      /structure\s+engagée|capital humain/i,
    );
  });

  if (participantAreaExpected) {
    test('Given un visiteur non authentifié, When il accède à /participant/dashboard et l’espace est activé, Then il est redirigé vers la connexion', async ({
      page,
    }) => {
      await page.goto('/participant/dashboard');
      await expect(page).toHaveURL(/\/connexion$/);
      await expect(
        page.getByRole('heading', { level: 1, name: 'Connexion' }),
      ).toBeVisible();
    });
  } else {
    test('Given un visiteur non authentifié, When il accède à /participant/dashboard et l’espace est désactivé, Then une page 404 est affichée', async ({
      page,
    }) => {
      await page.goto('/participant/dashboard');
      await expect(page).toHaveURL(/\/participant\/dashboard$/);
      await expect(
        page.getByRole('heading', { level: 1, name: 'Oups.' }),
      ).toBeVisible();
    });
  }
});
