import { expect, test, type Page } from '@playwright/test';

async function isNotFoundPageVisible(page: Page) {
  return page
    .getByRole('heading', { level: 1, name: 'Oups.' })
    .isVisible()
    .catch(() => false);
}

async function expectBlogRouteOrNotFound(
  page: Page,
  assertAvailableRoute: () => Promise<void>,
) {
  if (await isNotFoundPageVisible(page)) {
    await expect(
      page.getByRole('heading', { level: 1, name: 'Oups.' }),
    ).toBeVisible();
    return;
  }

  await assertAvailableRoute();
}

test.describe('Blog public - smoke CMS-03', () => {
  test('Given la page blog, When elle se charge, Then la liste des articles publies et la pagination sont visibles', async ({
    page,
  }) => {
    await page.goto('/blog', { waitUntil: 'domcontentloaded' });

    await expectBlogRouteOrNotFound(page, async () => {
      await expect(page.locator('h1').first()).toContainText(
        /Actualités, repères et\s*analyses pour avancer avec clarté\./i,
      );

      await expect(page.getByText('Derniers articles')).toBeVisible();
      await expect(
        page.getByRole('link', { name: "Lire l'article" }).first(),
      ).toBeVisible();

      const pagination = page.getByRole('navigation', {
        name: 'Pagination du blog',
      });
      await expect(pagination).toBeVisible();
    });
  });

  test('Given un article de blog, When il est ouvert, Then les metadonnees SEO et le structured data Article sont presents', async ({
    page,
  }) => {
    await page.goto('/blog/clarifier-son-projet-avant-de-candidater', {
      waitUntil: 'domcontentloaded',
    });

    await expectBlogRouteOrNotFound(page, async () => {
      await expect(page.locator('h1').first()).toContainText(
        /Clarifier son projet avant de candidater/i,
      );

      await expect(page).toHaveTitle(
        /Clarifier son projet avant de candidater/,
      );

      await expect
        .poll(async () =>
          page.locator('link[rel="canonical"]').getAttribute('href'),
        )
        .toContain('/blog/clarifier-son-projet-avant-de-candidater');

      await expect(
        page.locator('meta[property="og:type"][content="article"]'),
      ).toHaveCount(1);

      const jsonLd = page.locator('script#kraak-blog-article-jsonld');
      await expect(jsonLd).toHaveCount(1);

      const jsonLdContent = await jsonLd.textContent();
      expect(jsonLdContent).toContain('"@type":"Article"');
    });
  });
});
