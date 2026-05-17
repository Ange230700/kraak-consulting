import { expect, test } from '@playwright/test';

test.describe('Parcours coeur participant - orientation web', () => {
  test('Given un visiteur non authentifie, When il tente l acces dashboard participant, Then il est redirige vers la connexion et oriente vers des pages publiques', async ({
    page,
  }) => {
    await page.goto('/participant/dashboard');

    await expect(page).toHaveURL(/\/connexion$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Connexion' }),
    ).toBeVisible();

    await page.goto('/programmes');
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: "Programmes KRAAK : orientation d'abord, format adapt\u00e9 ensuite.",
      }),
    ).toBeVisible();

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
