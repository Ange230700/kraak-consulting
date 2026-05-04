import {
  buildRobotsTxt,
  buildSitemapXml,
  findSeoPageByPath,
  seoPages,
} from './site-seo';

describe('site-seo', () => {
  it('should expose every public marketing page as a single source of truth', () => {
    expect(seoPages.map((page) => page.path)).toEqual([
      '',
      'a-propos',
      'services',
      'programmes',
      'ressources',
      'contact',
    ]);
  });

  it('should build an XML sitemap with absolute URLs for every public page', () => {
    const sitemap = buildSitemapXml('https://kraak-consulting.vercel.app');

    expect(sitemap).toContain(
      '<loc>https://kraak-consulting.vercel.app/</loc>',
    );
    expect(sitemap).toContain(
      '<loc>https://kraak-consulting.vercel.app/a-propos</loc>',
    );
    expect(sitemap).toContain(
      '<loc>https://kraak-consulting.vercel.app/services</loc>',
    );
    expect(sitemap).toContain(
      '<loc>https://kraak-consulting.vercel.app/programmes</loc>',
    );
    expect(sitemap).toContain(
      '<loc>https://kraak-consulting.vercel.app/ressources</loc>',
    );
    expect(sitemap).toContain(
      '<loc>https://kraak-consulting.vercel.app/contact</loc>',
    );
  });

  it('should build robots.txt pointing crawlers to the sitemap', () => {
    const robots = buildRobotsTxt('https://kraak-consulting.vercel.app');

    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Allow: /');
    expect(robots).toContain(
      'Sitemap: https://kraak-consulting.vercel.app/sitemap.xml',
    );
  });

  it('should define an Open Graph image for public sharing previews', () => {
    const homePage = findSeoPageByPath('');

    expect(homePage).toBeDefined();
    expect(homePage?.openGraph.imagePath).toBe(
      '/open-graph/kraak-share-card.svg',
    );
  });
});
