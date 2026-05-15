import { expect, test } from '@playwright/test';

async function revealParticipantCta(page: Parameters<typeof test>[0]['page']) {
  const participantCta = page
    .getByRole('link', { name: 'Espace participant' })
    .first();
  const mobileMenuButton = page.getByRole('button', {
    name: 'Menu de navigation',
  });

  await expect(page.getByRole('banner')).toBeVisible();

  const mobileMenuVisible = await mobileMenuButton
    .waitFor({ state: 'visible', timeout: 2_000 })
    .then(() => true)
    .catch(() => false);

  if (mobileMenuVisible) {
    await mobileMenuButton.click();
  }

  await expect(participantCta).toBeVisible();

  return participantCta;
}

// Smoke E2E — shell web KRAAK
// Given/When/Then : vérification des éléments visibles après chargement

test.describe(`Page d'accueil — smoke tests`, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test(`Given la page d'accueil, When elle se charge, Then le titre du document contient "KRAAK"`, async ({
    page,
  }) => {
    await expect(page).toHaveTitle(
      'KRAAK Consulting | Développez vos compétences, lancez vos projets',
    );
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
    await expect(await revealParticipantCta(page)).toBeVisible();
  });

  test(`Given la page d'accueil, When elle se charge, Then le pied de page affiche la promesse KRAAK`, async ({
    page,
  }) => {
    await expect(page.getByRole('contentinfo')).toContainText(
      `KRAAK Consulting — Expertise internationale au service de votre croissance.`,
    );
  });
});
