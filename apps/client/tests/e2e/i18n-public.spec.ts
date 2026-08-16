import { expect, test, type Page } from '@playwright/test';

const FRENCH_NAVIGATION_LABELS = [
  'ACCUEIL',
  'SERVICES',
  'PROGRAMMES',
  'À PROPOS',
  'CONTACT',
];

const ENGLISH_NAVIGATION_LABELS = [
  'HOME',
  'SERVICES',
  'PROGRAMMES',
  'ABOUT',
  'CONTACT',
];

function getLanguageSelector(page: Page, accessibleName: RegExp) {
  return page.getByRole('group', { name: accessibleName });
}

async function expectNavigationLabels(
  page: Page,
  expectedLabels: readonly string[],
): Promise<void> {
  await expect(page.getByRole('banner').locator('a.kr-nav-link')).toHaveText(
    expectedLabels,
  );
}

test.describe('Internationalisation publique de la page d’accueil', () => {
  test('Given la route /fr/, When la page d’accueil se charge, Then le hero, la navbar et la langue du document sont en français', async ({
    page,
  }) => {
    await page.goto('/fr/', { waitUntil: 'domcontentloaded' });

    const heroHeading = page.getByRole('heading', { level: 1 }).first();

    await expect(page.locator('html')).toHaveAttribute('lang', 'fr-CI');
    await expect(heroHeading).toContainText('Développez vos compétences.');
    await expect(heroHeading).toContainText('Lancez vos projets.');
    await expect(heroHeading).toContainText(
      'Accédez aux opportunités internationales.',
    );
    await expectNavigationLabels(page, FRENCH_NAVIGATION_LABELS);
    await expect(page.locator('body')).not.toContainText('[missing:web.');
  });

  test('Given la route /en/, When la page d’accueil se charge, Then le hero, la navbar et la langue du document sont en anglais', async ({
    page,
  }) => {
    await page.goto('/en/', { waitUntil: 'domcontentloaded' });

    const heroHeading = page.getByRole('heading', { level: 1 }).first();

    await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB');
    await expect(heroHeading).toContainText('Build your skills.');
    await expect(heroHeading).toContainText('Launch your projects.');
    await expect(heroHeading).toContainText(
      'Access international opportunities.',
    );
    await expectNavigationLabels(page, ENGLISH_NAVIGATION_LABELS);
    await expect(page.locator('body')).not.toContainText('[missing:web.');
  });

  test('Given la page française, When le visiteur active au clavier le lien anglais du sélecteur de langue, Then la page anglaise devient active', async ({
    page,
  }) => {
    await page.goto('/fr/', { waitUntil: 'domcontentloaded' });

    const languageSelector = getLanguageSelector(page, /langue|language/i);
    const englishLink = languageSelector.getByRole('link', {
      name: /anglais|english/i,
    });

    await expect(languageSelector).toBeVisible();
    await expect(englishLink).toHaveAttribute('hreflang', 'en-GB');
    expect(await englishLink.getAttribute('lang')).toBeNull();
    await expect(englishLink.locator('[lang="en-GB"]')).toHaveText('EN');

    await englishLink.focus();
    await expect(englishLink).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/en\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB');
    await expect(page.getByRole('heading', { level: 1 }).first()).toContainText(
      'Build your skills.',
    );
  });

  test('Given une largeur mobile, When le menu anglais est ouvert, Then les liens, le sélecteur et le CTA restent empilés dans la fenêtre', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/en/', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Open navigation menu' }).click();

    const header = page.getByRole('banner');
    const navList = header.locator('ul').first();
    const languageSelector = getLanguageSelector(page, /choose language/i);
    const navListBox = await navList.boundingBox();
    const languageBox = await languageSelector.boundingBox();

    expect(navListBox).not.toBeNull();
    expect(languageBox).not.toBeNull();
    expect(languageBox!.y).toBeGreaterThanOrEqual(
      navListBox!.y + navListBox!.height,
    );
    expect(languageBox!.x + languageBox!.width).toBeLessThanOrEqual(390);

    const participantLink = header.getByRole('link', {
      name: 'Participant area',
    });
    const participantBox = await participantLink.boundingBox();

    await expect(participantLink).toBeVisible();
    expect(participantBox).not.toBeNull();
    expect(participantBox!.y).toBeGreaterThanOrEqual(
      languageBox!.y + languageBox!.height,
    );
    expect(participantBox!.x + participantBox!.width).toBeLessThanOrEqual(390);
  });

  test('Given une page publique française avec query et fragment, When la langue change dans les deux sens, Then la page équivalente, la query et le fragment sont conservés', async ({
    page,
  }) => {
    await page.goto('/fr/programmes?campaign=summer#offres', {
      waitUntil: 'domcontentloaded',
    });

    const englishLink = getLanguageSelector(page, /langue|language/i).getByRole(
      'link',
      { name: /anglais|english/i },
    );

    await englishLink.click();
    await expect(page).toHaveURL(/\/en\/programs\?campaign=summer#offres$/);

    const frenchLink = getLanguageSelector(page, /langue|language/i).getByRole(
      'link',
      { name: /français|french/i },
    );

    await frenchLink.click();
    await expect(page).toHaveURL(/\/fr\/programmes\?campaign=summer#offres$/);
  });

  test('Given une route française inconnue, When le visiteur choisit l’anglais, Then le sélecteur retombe sur la page d’accueil anglaise sans état obsolète', async ({
    page,
  }) => {
    await page.goto('/fr/route-inconnue?campaign=summer#offres', {
      waitUntil: 'domcontentloaded',
    });

    const englishLink = getLanguageSelector(page, /langue|language/i).getByRole(
      'link',
      { name: /anglais|english/i },
    );

    await englishLink.click();

    await expect(page).toHaveURL(/\/en\/?$/);
    await expect(page.getByRole('heading', { level: 1 }).first()).toContainText(
      'Build your skills.',
    );
  });
});
