import { expect, type Page } from '@playwright/test';

export async function revealNavigation(page: Page): Promise<void> {
  const banner = page.getByRole('banner');
  await expect(banner).toBeVisible();

  const menuButton = banner.getByRole('button', { name: /menu/i });
  if (
    (await menuButton.isVisible()) &&
    (await menuButton.getAttribute('aria-expanded')) !== 'true'
  ) {
    await menuButton.click();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
  }
}

export async function getLanguageSelector(page: Page, accessibleName: RegExp) {
  await revealNavigation(page);
  const selector = page.getByRole('group', { name: accessibleName });
  await expect(selector).toBeVisible();
  return selector;
}
