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
      page.getByRole('heading', { level: 1, name: 'Parlons de votre projet.' }),
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

    const nameField = page.getByRole('textbox', { name: 'Nom complet' });
    const emailField = page.getByRole('textbox', { name: 'Adresse e-mail' });
    const subjectField = page.getByRole('textbox', { name: 'Objectif' });
    const countryField = page.getByRole('textbox', { name: 'Pays' });
    const serviceField = page.getByLabel('Type de service');
    const messageField = page.getByRole('textbox', { name: 'Message' });

    await expect(async () => {
      await nameField.fill('Aline Kouassi');
      await emailField.fill('aline@exemple.com');
      await subjectField.fill("Demande d'accompagnement");
      await countryField.fill('Bénin');
      await serviceField.selectOption('immigration');
      await messageField.fill(
        'Bonjour, je souhaite être guidée sur les prochaines étapes.',
      );

      await expect(nameField).toHaveValue('Aline Kouassi', { timeout: 500 });
      await expect(emailField).toHaveValue('aline@exemple.com', {
        timeout: 500,
      });
      await expect(subjectField).toHaveValue("Demande d'accompagnement", {
        timeout: 500,
      });
      await expect(countryField).toHaveValue('Bénin', { timeout: 500 });
      await expect(serviceField).toHaveValue('immigration', { timeout: 500 });
      await expect(messageField).toHaveValue(
        'Bonjour, je souhaite être guidée sur les prochaines étapes.',
        { timeout: 500 },
      );

      await page.getByRole('button', { name: 'Envoyer ma demande' }).click();

      await expect(
        page.getByText(
          'Votre message a bien été envoyé. Nous vous répondrons dans les plus brefs délais.',
        ),
      ).toBeVisible({ timeout: 10_000 });
    }).toPass({ timeout: 60_000 });
  });
});
