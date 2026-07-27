// apps\client\tests\e2e\smoke.spec.ts

import { expect, test, Page } from '@playwright/test';

const expectParticipantCta =
  process.env['KRAAK_E2E_EXPECT_PARTICIPANT_CTA'] ??
  process.env['CLIENT_FEATURE_PARTICIPANT_AREA'] ??
  'true';
const participantCtaExpected = expectParticipantCta === 'true';
const expectedParticipantCtaCount = participantCtaExpected ? 1 : 0;

async function revealNavigation(page: Page) {
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
}

// Smoke E2E — shell web KRAAK
// Given/When/Then : vérification des éléments visibles après chargement

test.describe(`Page d'accueil — smoke tests`, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/fr\/?$/);
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
    const banner = page.getByRole('banner');
    await expect(banner).toContainText('KRAAK');
    await expect(
      banner.getByRole('img', { name: 'Symbole KRAAK' }),
    ).toBeVisible();
  });

  test(`Given la page d'accueil, When elle se charge, Then l'appel public vers le contact est visible`, async ({
    page,
  }) => {
    await revealNavigation(page);

    await expect(
      page.getByRole('link', { name: 'Contact' }).first(),
    ).toBeVisible();
  });

  test(`Given la page d'accueil, When elle se charge, Then le CTA participant respecte le périmètre attendu`, async ({
    page,
  }) => {
    await revealNavigation(page);

    const participantCta = page.getByRole('link', {
      name: 'Espace participant',
    });

    await expect(participantCta).toHaveCount(expectedParticipantCtaCount);
    await expect(participantCta.first()).toBeVisible({
      visible: participantCtaExpected,
    });
  });

  test(`Given la page d'accueil, When elle se charge, Then le pied de page affiche la promesse KRAAK`, async ({
    page,
  }) => {
    await expect(page.getByRole('contentinfo')).toContainText(
      `L'excellence opérationnelle au service du développement humain.`,
    );
  });

  test(`Given la navigation publique, When le visiteur ouvre la page à propos, Then le titre et le contenu principal sont visibles`, async ({
    page,
  }) => {
    await page.goto('/fr/a-propos', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveTitle(/À propos|A propos/i);
    await expect(page.locator('h1').first()).toContainText(/capital humain/i);
  });
});
