import {
  buildAbsoluteUrl,
  buildRobotsTxt,
  buildSitemapXml,
  findSeoPageByPath,
  normalizeSiteUrl,
  resolvePublicSiteUrl,
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
      'mentions-legales',
      'politique-de-confidentialite',
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

  // Given an empty string is passed to normalizeSiteUrl
  // When the function is called
  // Then it returns the DEFAULT_SITE_URL fallback
  it('Given an empty siteUrl, when normalizeSiteUrl is called, then the default site URL is returned', () => {
    expect(normalizeSiteUrl('')).toBe('https://kraak-consulting.vercel.app');
  });

  // Given no PUBLIC_SITE_URL env var and no siteUrl argument
  // When resolvePublicSiteUrl is called
  // Then it returns the default site URL
  it('Given no siteUrl argument, when resolvePublicSiteUrl is called, then the default site URL is returned', () => {
    expect(resolvePublicSiteUrl()).toBe('https://kraak-consulting.vercel.app');
  });

  // Given a siteUrl with trailing slash
  // When normalizeSiteUrl is called
  // Then the trailing slash is trimmed
  it('Given a siteUrl with trailing slash, when normalizeSiteUrl is called, then trailing slash is trimmed', () => {
    expect(normalizeSiteUrl('https://example.com/')).toBe(
      'https://example.com',
    );
  });

  // Given a path with leading slash
  // When buildAbsoluteUrl is called
  // Then leading slash in path is handled correctly
  it('Given a path with leading slash, when buildAbsoluteUrl is called, then the URL is correctly built', () => {
    expect(buildAbsoluteUrl('/contact', 'https://example.com')).toBe(
      'https://example.com/contact',
    );
  });
});
