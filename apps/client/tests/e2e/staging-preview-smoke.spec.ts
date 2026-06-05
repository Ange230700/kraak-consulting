import { expect, test, Page } from '@playwright/test';

const participantAreaExpected =
  process.env['KRAAK_E2E_EXPECT_PARTICIPANT_AREA'] === 'true';

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
  test('Given le staging web, When la navigation est ouverte, Then le lien Espace participant respecte le périmètre activé', async ({
    page,
  }) => {
    await page.goto('/');
    await revealNavigation(page);

    const participantLink = page
      .getByRole('link', { name: 'Espace participant' })
      .first();

    if (participantAreaExpected) {
      await expect(participantLink).toBeVisible();
      await expect(participantLink).toHaveAttribute('href', '/participant');
      return;
    }

    await expect(participantLink).toHaveCount(0);
  });

  test('Given le staging web, When la page a-propos est chargée, Then un bloc de prévisualisation clé est visible', async ({
    page,
  }) => {
    await page.goto('/a-propos');

    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      /structure\s+engagée|capital humain/i,
    );
  });

  test('Given un visiteur non authentifié sur staging, When il accède à /participant/dashboard, Then le résultat respecte l activation de l espace participant', async ({
    page,
  }) => {
    await page.goto('/participant/dashboard');

    if (participantAreaExpected) {
      await expect(page).toHaveURL(/\/connexion$/);
      await expect(
        page.getByRole('heading', { level: 1, name: 'Connexion' }),
      ).toBeVisible();
      return;
    }

    await expect(page).toHaveURL(/\/participant\/dashboard$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Oups.' }),
    ).toBeVisible();
  });
});
