import { expect, test, Page } from '@playwright/test';

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
  test('Given le staging web, When la navigation est ouverte, Then le lien Espace participant est visible et pointe vers /participant', async ({
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

  test('Given le staging web, When la page a-propos est chargée, Then un bloc de prévisualisation clé est visible', async ({
    page,
  }) => {
    await page.goto('/a-propos');

    await expect(
      page.getByText("Prévisualisation de l'équipe KRAAK"),
    ).toBeVisible();
  });

  test('Given un visiteur non authentifié sur staging, When il accède à /participant/dashboard, Then il est redirigé vers /connexion', async ({
    page,
  }) => {
    await page.goto('/participant/dashboard');

    await expect(page).toHaveURL(/\/connexion$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Connexion' }),
    ).toBeVisible();
  });
});
