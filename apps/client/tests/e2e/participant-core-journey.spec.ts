// apps\client\tests\e2e\participant-core-journey.spec.ts

import { expect, test } from '@playwright/test';

const participantAreaExpected =
  (process.env['KRAAK_E2E_EXPECT_PARTICIPANT_AREA'] ??
    process.env['CLIENT_FEATURE_PARTICIPANT_AREA'] ??
    'true') === 'true';

test.describe('Parcours coeur participant - orientation web', () => {
  test('Given un visiteur non authentifie (espace activé), When il tente l\u0027accès dashboard participant, Then il est redirigé vers la connexion et peut naviguer vers les pages publiques', async ({
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

    await page.goto('/programmes');
    await expect(page.locator('h1').first()).toContainText(
      /Orientation d'abord, format adapt\u00e9 ensuite\./i,
    );

    await page.goto('/contact');
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Parlez-nous de votre objectif.',
      }),
    ).toBeVisible();
  });

  test('Given un visiteur non authentifie (espace désactivé), When il tente l\u0027accès dashboard participant, Then une page 404 est affichée et les pages publiques restent accessibles', async ({
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

    await page.goto('/programmes');
    await expect(page.locator('h1').first()).toContainText(
      /Orientation d'abord, format adapt\u00e9 ensuite\./i,
    );

    await page.goto('/contact');
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Parlez-nous de votre objectif.',
      }),
    ).toBeVisible();
  });

  test('Given un visiteur en parcours participant, When il ouvre la page contact, Then le formulaire est disponible et actionnable', async ({
    page,
  }) => {
    await page.goto('/contact');

    const contactForm = page.locator('form').first();
    await expect(contactForm).toBeVisible();

    await expect(page.getByLabel('Nom complet')).toBeEditable();
    await expect(page.getByLabel('Adresse e-mail')).toBeEditable();
    await expect(page.getByLabel('Objectif')).toBeEditable();
    await expect(page.getByLabel('Pays')).toBeEditable();
    await expect(page.getByLabel('Type de service')).toBeVisible();
    await expect(page.getByLabel('Message')).toBeEditable();
    await expect(
      page.getByRole('button', { name: 'Envoyer ma demande' }),
    ).toBeEnabled();
  });
});
