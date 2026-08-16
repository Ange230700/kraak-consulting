import { expect, test } from '@playwright/test';

test.describe('Internationalisation de la coque publique', () => {
  test('Given la route /fr/, When la coque publique se charge, Then le pied de page et les textes d’accessibilité globaux sont en français', async ({
    page,
  }) => {
    await page.goto('/fr/', { waitUntil: 'domcontentloaded' });

    const skipLink = page.locator('a.kr-skip-link');
    const footer = page.getByRole('contentinfo');
    const scrollControl = page.locator('kraak-scroll-to-top button');

    await expect(skipLink).toHaveText('Aller au contenu principal');
    await expect(scrollControl).toHaveAttribute(
      'aria-label',
      'Remonter vers le haut de la page',
    );
    await expect(
      footer.getByRole('heading', {
        name: "Prêt à passer à l'action ?",
      }),
    ).toBeVisible();
    await expect(
      footer.getByRole('link', { name: 'Nous contacter', exact: true }),
    ).toHaveAttribute('href', '/fr/contact');
    await expect(
      footer.getByRole('link', { name: "Retour à l'accueil KRAAK" }),
    ).toHaveAttribute('href', '/fr');
    await expect(footer.getByAltText('Symbole KRAAK')).toBeAttached();
    await expect(
      footer.getByRole('navigation', { name: 'Réseaux sociaux' }),
    ).toBeAttached();
    await expect(footer).toContainText('Tous droits réservés.');
    await expect(page.locator('body')).not.toContainText('[missing:web.');
  });

  test('Given la route /en/, When la coque publique se charge, Then le pied de page et les textes d’accessibilité globaux sont en anglais et utilisables au clavier', async ({
    page,
  }) => {
    await page.goto('/en/', { waitUntil: 'domcontentloaded' });

    const skipLink = page.locator('a.kr-skip-link');
    const footer = page.getByRole('contentinfo');
    const scrollControl = page.locator('kraak-scroll-to-top button');

    await expect(skipLink).toHaveText('Skip to main content');
    await expect(scrollControl).toHaveAttribute('tabindex', '-1');
    await expect(scrollControl).toHaveAttribute('aria-hidden', 'true');
    await skipLink.focus();
    await expect(skipLink).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main#main-content')).toBeFocused();
    await expect(scrollControl).toHaveAttribute('aria-label', 'Back to top');
    await expect(
      footer.getByRole('heading', { name: 'Ready to take action?' }),
    ).toBeVisible();
    await expect(
      footer.getByRole('link', { name: 'Contact us', exact: true }),
    ).toHaveAttribute('href', '/en/contact');
    await expect(
      footer.getByRole('link', { name: 'Back to the KRAAK homepage' }),
    ).toHaveAttribute('href', '/en');
    await expect(footer.getByAltText('KRAAK symbol')).toBeAttached();
    await expect(
      footer.getByRole('navigation', { name: 'Social media' }),
    ).toBeAttached();
    await expect(footer).toContainText('Professional training');
    await expect(footer).toContainText('Project management');
    await expect(footer).toContainText('International mobility');
    await expect(footer).toContainText('All rights reserved.');
    await expect(footer).not.toContainText("Prêt à passer à l'action ?");
    await expect(page.locator('body')).not.toContainText('[missing:web.');

    await page.evaluate(() =>
      globalThis.scrollTo(0, document.documentElement.scrollHeight),
    );
    await expect(scrollControl).toHaveAttribute('tabindex', '0');
    await expect(scrollControl).not.toHaveAttribute('aria-hidden', 'true');
    await scrollControl.focus();
    await expect(scrollControl).toBeFocused();
  });
});
