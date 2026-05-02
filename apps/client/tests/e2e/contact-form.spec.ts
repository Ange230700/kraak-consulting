import { expect, test } from '@playwright/test';

test.describe(`Page contact — comportement formulaire`, () => {
  test(`Given la page contact, When l'utilisateur soumet un formulaire valide, Then un message de confirmation est affiché`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const runtimeErrors: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'error') {
        runtimeErrors.push(message.text());
      }
    });

    page.on('pageerror', (error) => {
      runtimeErrors.push(error.message);
    });

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
            'Votre message a bien été reçu. Nous vous répondrons dans les plus brefs délais.',
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

    // Remplir, vérifier, soumettre et valider le succès dans un seul bloc
    // toPass(). Si l'hydratation Angular SSR vide les champs entre le
    // remplissage et le clic, la soumission échoue (formulaire invalide,
    // pas de POST envoyé, pas de message de succès) et toPass() relance
    // l'ensemble automatiquement.
    await expect(async () => {
      await nameField.fill('Alice Dupont');
      await emailField.fill('alice@exemple.com');
      await subjectField.fill('Évaluer un projet de formation');
      await countryField.fill('Canada');
      await serviceField.selectOption('formation');
      await messageField.fill(
        'Bonjour, je souhaite discuter de vos programmes de formation.',
      );

      await expect(nameField).toHaveValue('Alice Dupont', { timeout: 500 });
      await expect(emailField).toHaveValue('alice@exemple.com', {
        timeout: 500,
      });
      await expect(subjectField).toHaveValue('Évaluer un projet de formation', {
        timeout: 500,
      });
      await expect(countryField).toHaveValue('Canada', { timeout: 500 });
      await expect(serviceField).toHaveValue('formation', { timeout: 500 });
      await expect(messageField).toHaveValue(
        'Bonjour, je souhaite discuter de vos programmes de formation.',
        { timeout: 500 },
      );

      await page.getByRole('button', { name: 'Envoyer ma demande' }).click();

      await expect(
        page.getByText(
          'Votre message a bien été envoyé. Nous vous répondrons dans les plus brefs délais.',
        ),
      ).toBeVisible({ timeout: 10_000 });
    }).toPass({ timeout: 60_000 });

    await expect(async () => {
      expect(
        runtimeErrors.filter((message) =>
          /ResizeObserver loop completed with undelivered notifications\.|An ErrorEvent with no error occurred\./.test(
            message,
          ),
        ),
      ).toEqual([]);
    }).toPass({ timeout: 2_000 });
  });
});
