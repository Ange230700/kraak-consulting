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
        name: 'Des programmes conçus pour transformer des trajectoires.',
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

  test('Given un visiteur en parcours participant, When il soumet une demande de contact, Then il recoit un message de confirmation', async ({
    page,
  }) => {
    await page.route('**/contact', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message:
            'Votre message a bien été envoyé. Nous vous répondrons dans les plus brefs délais.',
        }),
      });
    });

    await page.goto('/contact');
    const contactForm = page.locator('form').first();
    await expect(contactForm).toBeVisible();

    const nameField = page.locator('#name');
    const emailField = page.locator('#email');
    const subjectField = page.locator('#subject');
    const countryField = page.locator('#country');
    const serviceField = page.locator('#serviceType');
    const messageField = page.locator('#message');

    await nameField.fill('Aline Kouassi');
    await emailField.fill('aline@exemple.com');
    await subjectField.fill("Demande d'accompagnement");
    await countryField.fill('Bénin');
    await serviceField.selectOption('immigration');
    await messageField.fill(
      'Bonjour, je souhaite être guidée sur les prochaines étapes.',
    );

    await page.getByRole('button', { name: 'Envoyer ma demande' }).click();

    await expect(
      page.getByText(/Votre message a bien été envoyé\./i).first(),
    ).toBeVisible({ timeout: 15_000 });
  });
});
