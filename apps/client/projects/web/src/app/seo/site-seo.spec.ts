import {
  buildAbsoluteUrl,
  buildRobotsTxt,
  buildSitemapXml,
  findSeoPageByPath,
  normalizeSiteUrl,
  resolvePublicSiteUrl,
  seoPages,
} from './site-seo';

const DEFAULT_SITE_URL = 'https://kraak-consulting.vercel.app';
const EXAMPLE_SITE_URL = 'https://example.com';

describe('site-seo', () => {
  it('should expose every public marketing page as a single source of truth', () => {
    expect(seoPages.map((page) => page.path)).toEqual([
      '',
      'a-propos',
      'services',
      'programmes',
      'blog',
      'ressources',
      'contact',
      'faq',
      'mentions-legales',
      'politique-de-confidentialite',
    ]);
  });

  it('should build an XML sitemap with absolute URLs for every public page', () => {
    const sitemap = buildSitemapXml(DEFAULT_SITE_URL);

    expect(sitemap).toContain(`<loc>${DEFAULT_SITE_URL}/</loc>`);
    expect(sitemap).toContain(`<loc>${DEFAULT_SITE_URL}/a-propos</loc>`);
    expect(sitemap).toContain(`<loc>${DEFAULT_SITE_URL}/services</loc>`);
    expect(sitemap).toContain(`<loc>${DEFAULT_SITE_URL}/programmes</loc>`);
    expect(sitemap).toContain(`<loc>${DEFAULT_SITE_URL}/blog</loc>`);
    expect(sitemap).toContain(
      `<loc>${DEFAULT_SITE_URL}/blog/clarifier-son-projet-avant-de-candidater</loc>`,
    );
    expect(sitemap).toContain(
      `<loc>${DEFAULT_SITE_URL}/blog/choisir-un-format-de-formation-utile</loc>`,
    );
    expect(sitemap).toContain(
      `<loc>${DEFAULT_SITE_URL}/blog/preparer-un-dossier-immigration-sans-perdre-le-fil</loc>`,
    );
    expect(sitemap).toContain(`<loc>${DEFAULT_SITE_URL}/ressources</loc>`);
    expect(sitemap).toContain(`<loc>${DEFAULT_SITE_URL}/contact</loc>`);
  });

  it('should build robots.txt pointing crawlers to the sitemap', () => {
    const robots = buildRobotsTxt(DEFAULT_SITE_URL);

    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Allow: /');
    expect(robots).toContain(`Sitemap: ${DEFAULT_SITE_URL}/sitemap.xml`);
  });

  it('should define an Open Graph image for public sharing previews', () => {
    const homePage = findSeoPageByPath('');

    expect(homePage).toBeDefined();
    expect(homePage?.openGraph.imagePath).toBe(
      '/assets/site-visuals/photos/home-hero-workshop.jpg',
    );
  });

  // Given an empty string is passed to normalizeSiteUrl
  // When the function is called
  // Then it returns the DEFAULT_SITE_URL fallback
  it('Given an empty siteUrl, when normalizeSiteUrl is called, then the default site URL is returned', () => {
    expect(normalizeSiteUrl('')).toBe(DEFAULT_SITE_URL);
  });

  // Given no PUBLIC_SITE_URL env var and no siteUrl argument
  // When resolvePublicSiteUrl is called
  // Then it returns the default site URL
  it('Given no siteUrl argument, when resolvePublicSiteUrl is called, then the default site URL is returned', () => {
    expect(resolvePublicSiteUrl()).toBe(DEFAULT_SITE_URL);
  });

  // Given a siteUrl with trailing slash
  // When normalizeSiteUrl is called
  // Then the trailing slash is trimmed
  it('Given a siteUrl with trailing slash, when normalizeSiteUrl is called, then trailing slash is trimmed', () => {
    expect(normalizeSiteUrl(`${EXAMPLE_SITE_URL}/`)).toBe(EXAMPLE_SITE_URL);
  });

  // Given a path with leading slash
  // When buildAbsoluteUrl is called
  // Then leading slash in path is handled correctly
  it('Given a path with leading slash, when buildAbsoluteUrl is called, then the URL is correctly built', () => {
    expect(buildAbsoluteUrl('/contact', EXAMPLE_SITE_URL)).toBe(
      `${EXAMPLE_SITE_URL}/contact`,
    );
  });

  it('Given an absolute URL path, when buildAbsoluteUrl is called, then the URL is returned unchanged', () => {
    expect(
      buildAbsoluteUrl('https://cdn.example.com/asset.webp', EXAMPLE_SITE_URL),
    ).toBe('https://cdn.example.com/asset.webp');
  });
});
