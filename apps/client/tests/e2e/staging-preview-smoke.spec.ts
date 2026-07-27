// apps\client\tests\e2e\staging-preview-smoke.spec.ts

import { expect, test, Page } from '@playwright/test';

const participantAreaExpected =
  (process.env['KRAAK_E2E_EXPECT_PARTICIPANT_AREA'] ??
    process.env['CLIENT_FEATURE_PARTICIPANT_AREA'] ??
    'true') === 'true';

async function revealNavigation(page: Page) {
  const mobileMenuButton = page.getByRole('button', {
    name: 'Menu de navigation',
  });

  const mobileMenuVisible = await mobileMenuButton
    .waitFor({ state: 'visible', timeout: 2_000 })
    .then(() => true)
    .catch(() => false);

  if (mobileMenuVisible) {
    await mobileMenuButton.click();
  }
}

test.describe('Smoke staging preview - espace participant', () => {
  if (participantAreaExpected) {
    test('Given le staging web, When la navigation est ouverte et l’espace est activé, Then le lien Espace participant est visible', async ({
      page,
    }) => {
      await page.goto('/');
      await revealNavigation(page);
      const participantLink = page
        .getByRole('link', { name: 'Espace participant' })
        .first();
      await expect(participantLink).toBeVisible();
      await expect(participantLink).toHaveAttribute('href', '/participant');
    });
  } else {
    test('Given le staging web, When la navigation est ouverte et l’espace est désactivé, Then le lien Espace participant est absent', async ({
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

  test('Given le staging web, When la page a-propos est chargée, Then un bloc de prévisualisation clé est visible', async ({
    page,
  }) => {
    await page.goto('/a-propos');

    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      /structure\s+engagée|capital humain/i,
    );
  });

  if (participantAreaExpected) {
    test('Given un visiteur non authentifié sur staging, When il accède à /participant/dashboard et l’espace est activé, Then il est redirigé vers la connexion', async ({
      page,
    }) => {
      await page.goto('/participant/dashboard');
      await expect(page).toHaveURL(/\/connexion$/);
      await expect(
        page.getByRole('heading', { level: 1, name: 'Connexion' }),
      ).toBeVisible();
    });
  } else {
    test('Given un visiteur non authentifié sur staging, When il accède à /participant/dashboard et l’espace est désactivé, Then une page 404 est affichée', async ({
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
