import { expect, test } from '@playwright/test';

test('Given une page SSR avec JavaScript retardé, When le visiteur ouvre le menu avant hydratation, Then son interaction est conservée après démarrage', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let releaseBootstrap!: () => void;
  let markBootstrapRequested!: () => void;
  const bootstrapReleased = new Promise<void>((resolve) => {
    releaseBootstrap = resolve;
  });
  const bootstrapRequested = new Promise<void>((resolve) => {
    markBootstrapRequested = resolve;
  });
  await page.route(/\/main(?:-[a-z\d]+)?\.js(?:\?|$)/i, async (route) => {
    markBootstrapRequested();
    await bootstrapReleased;
    await route.continue();
  });

  try {
    await page.goto('/fr/a-propos', { waitUntil: 'commit' });
    await bootstrapRequested;

    const menuButton = page.getByRole('button', {
      name: 'Menu de navigation',
    });
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    await menuButton.click();
  } finally {
    releaseBootstrap();
  }

  await expect(page.getByRole('banner').getByRole('button')).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  await expect(
    page
      .getByRole('group', { name: /langue/i })
      .getByRole('link', { name: /anglais/i }),
  ).toBeVisible();
});
