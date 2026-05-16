import { expect, test } from '@playwright/test';

test.describe(`SEO technique du site vitrine`, () => {
  test(`Given la page à propos, When elle se charge, Then le title, la description et la canonical correspondent à la route`, async ({
    page,
  }) => {
    await page.goto('/a-propos');

    await expect(page).toHaveTitle(/À propos|A propos/i);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      /capital humain|employabilité|trajectoires durables/i,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/a-propos$/,
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content',
      /\/a-propos$/,
    );
  });

  test(`Given la page services, When elle se charge, Then le title, la canonical et les balises Open Graph correspondent a la route`, async ({
    page,
  }) => {
    await page.goto('/services');

    await expect(page).toHaveTitle(
      /Services \| Formation, projets, études, immigration et entreprises/i,
    );
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      /formation, recherche et gestion de projets, études et immigration, et solutions entreprises/i,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/services$/,
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      /Services/,
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content',
      /\/services$/,
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /open-graph\/kraak-share-card\.svg$/,
    );
  });

  test(`Given la page contact, When elle se charge, Then ses métadonnées SEO orientent vers la prise de contact`, async ({
    page,
  }) => {
    await page.goto('/contact');

    await expect(page).toHaveTitle(/Contact \| Parlons de votre projet/i);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      /formation, gestion de projets, immigration ou besoin entreprise/i,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/contact$/,
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      /Parlons de votre projet/i,
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content',
      /\/contact$/,
    );
  });

  test(`Given les pages légales, When elles se chargent, Then title canonical et og:url restent cohérents`, async ({
    page,
  }) => {
    const legalRoutes = [
      {
        route: '/mentions-legales',
        title: /Mentions légales/i,
      },
      {
        route: '/politique-de-confidentialite',
        title: /Politique de confidentialité/i,
      },
    ];

    for (const legalRoute of legalRoutes) {
      await page.goto(legalRoute.route);

      await expect(page).toHaveTitle(legalRoute.title);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        'content',
        /.+/,
      );
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        new RegExp(`${legalRoute.route.replace(/\//g, '\\/')}$`),
      );
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
        'content',
        new RegExp(`${legalRoute.route.replace(/\//g, '\\/')}$`),
      );
    }
  });
});
