import { expect, test } from '@playwright/test';

test.describe(`SEO technique du site vitrine`, () => {
  test(`Given la page à propos, When elle se charge, Then le title, la canonical et les balises Open Graph correspondent a la route`, async ({
    page,
  }) => {
    await page.goto('/a-propos');

    await expect(page).toHaveTitle(
      /À propos \| Capital humain, impact et trajectoires \| KRAAK Consulting/i,
    );
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      /capital humain, l'employabilit[eé] des jeunes et des trajectoires durables/i,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/a-propos$/,
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      /À propos de KRAAK Consulting/i,
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

  test(`Given les pages programmes et ressources, When elles se chargent, Then leurs métadonnées SEO restent cohérentes avec leurs routes`, async ({
    page,
  }) => {
    const routes = [
      {
        path: '/programmes',
        title:
          /Programmes \| Orientation et formats d'accompagnement \| KRAAK/i,
        description: /catalogue détaillé est partagé après orientation/i,
        ogTitle: /Programmes KRAAK Consulting/i,
      },
      {
        path: '/ressources',
        title:
          /Ressources d'orientation \| Formation, projet et immigration \| KRAAK/i,
        description:
          /page d'orientation vitrine pour clarifier votre prochaine étape/i,
        ogTitle: /Ressources d'orientation KRAAK Consulting/i,
      },
    ];

    for (const route of routes) {
      await page.goto(route.path);

      await expect(page).toHaveTitle(route.title);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        'content',
        route.description,
      );
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        new RegExp(`${route.path.replace(/\//g, '\\/')}$`),
      );
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
        'content',
        route.ogTitle,
      );
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
        'content',
        new RegExp(`${route.path.replace(/\//g, '\\/')}$`),
      );
    }
  });

  test(`Given les pages FAQ et légales, When elles se chargent, Then title canonical et og:url restent alignés`, async ({
    page,
  }) => {
    const routes = [
      {
        path: '/faq',
        title: /FAQ \| Aide et orientation \| KRAAK Consulting/i,
      },
      {
        path: '/mentions-legales',
        title: /Mentions légales \| KRAAK Consulting/i,
      },
      {
        path: '/politique-de-confidentialite',
        title: /Politique de confidentialité \| KRAAK Consulting/i,
      },
    ];

    for (const route of routes) {
      await page.goto(route.path);

      await expect(page).toHaveTitle(route.title);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        'content',
        /.+/,
      );
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        new RegExp(`${route.path.replace(/\//g, '\\/')}$`),
      );
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
        'content',
        new RegExp(`${route.path.replace(/\//g, '\\/')}$`),
      );
    }
  });
});
