// apps\client\projects\web\src\app\seo\site-seo.spec.ts

import {
  buildAbsoluteUrl,
  buildRobotsTxt,
  buildSitemapXml,
  findLocalizedSeoPageByPath,
  findSeoPageByPath,
  localizedSeoPages,
  normalizeSiteUrl,
  resolvePublicSiteUrl,
  seoPages,
  type SeoPageDefinition,
} from './site-seo';

const DEFAULT_SITE_URL = 'https://kraak-web-prod.onrender.com';
const EXAMPLE_SITE_URL = 'https://example.com';
const RUNTIME_CONFIG_SITE_URL = 'https://render-staging.kraak.example';

describe('site-seo', () => {
  it('Given the existing SEO source, when raw pages are listed, then the French copy source remains unchanged', () => {
    expect(seoPages.map((page) => page.path)).toEqual([
      '',
      'a-propos',
      'services',
      'programmes',
      'ressources',
      'contact',
      'faq',
      'mentions-legales',
      'politique-de-confidentialite',
      'connexion',
      'inscription',
      'mot-de-passe-oublie',
      'auth/reset',
    ]);
  });

  it('Given localized SEO pages, when paths are listed, then French and English public routes are represented', () => {
    expect(localizedSeoPages.map((page) => page.path)).toEqual([
      '/fr/',
      '/en/',
      '/fr/a-propos',
      '/en/about',
      '/fr/services',
      '/en/services',
      '/fr/faq',
      '/en/faq',
      '/fr/programmes',
      '/en/programs',
      '/fr/ressources',
      '/en/resources',
      '/fr/contact',
      '/en/contact',
      '/fr/mentions-legales',
      '/en/legal-notice',
      '/fr/politique-de-confidentialite',
      '/en/privacy-policy',
      '/fr/401',
      '/en/401',
      '/fr/403',
      '/en/403',
      '/fr/404',
      '/en/404',
      '/fr/500',
      '/en/500',
    ]);
  });

  it('Given a localized French page, when SEO is resolved, then canonical and locale metadata use fr-CI', () => {
    const servicesPage = findLocalizedSeoPageByPath('/fr/services');

    expect(servicesPage).toBeDefined();
    expect(servicesPage?.canonicalPath).toBe('/fr/services');
    expect(servicesPage?.htmlLang).toBe('fr-CI');
    expect(servicesPage?.openGraphLocale).toBe('fr_CI');
    expect(servicesPage?.robots).toBeUndefined();
    expect(servicesPage?.hreflangLinks).toEqual([
      { hreflang: 'fr-CI', path: '/fr/services' },
      { hreflang: 'x-default', path: '/fr/services' },
    ]);
  });

  it('Given a localized English page, when SEO is resolved, then it stays temporary and noindex in PR 3', () => {
    const servicesPage = findLocalizedSeoPageByPath('/en/services');

    expect(servicesPage).toBeDefined();
    expect(servicesPage?.canonicalPath).toBe('/en/services');
    expect(servicesPage?.htmlLang).toBe('en-GB');
    expect(servicesPage?.openGraphLocale).toBe('en_GB');
    expect(servicesPage?.robots).toBe('noindex, nofollow');
    expect(servicesPage?.temporary).toBe(true);
  });

  it('Given the approved English homepage, When SEO is resolved, Then reviewed metadata and reciprocal locale links are indexable', () => {
    const homePage = findLocalizedSeoPageByPath('/en/');

    expect(homePage).toBeDefined();
    expect(homePage?.title).toBe(
      'Build your skills. Launch your projects. | KRAAK Consulting',
    );
    expect(homePage?.description).toBe(
      'KRAAK Consulting supports students, professionals, businesses and members of the diaspora with practical solutions in training, project management and immigration.',
    );
    expect(homePage?.canonicalPath).toBe('/en/');
    expect(homePage?.htmlLang).toBe('en-GB');
    expect(homePage?.openGraphLocale).toBe('en_GB');
    expect(homePage?.robots).toBeUndefined();
    expect(homePage?.temporary).toBe(false);
    expect(homePage?.hreflangLinks).toEqual([
      { hreflang: 'fr-CI', path: '/fr/' },
      { hreflang: 'en-GB', path: '/en/' },
      { hreflang: 'x-default', path: '/fr/' },
    ]);
  });

  it('Given approved English homepage SEO, When XML is built, Then the English homepage is included while unreviewed English pages stay excluded', () => {
    const sitemap = buildSitemapXml(DEFAULT_SITE_URL);

    expect(sitemap).toContain(`<loc>${DEFAULT_SITE_URL}/fr/services</loc>`);
    expect(sitemap).toContain(`<loc>${DEFAULT_SITE_URL}/fr/</loc>`);
    expect(sitemap).toContain(`<loc>${DEFAULT_SITE_URL}/en/</loc>`);
    expect(sitemap).toContain(`<loc>${DEFAULT_SITE_URL}/fr/a-propos</loc>`);
    expect(sitemap).not.toContain(`<loc>${DEFAULT_SITE_URL}/en/services</loc>`);
    expect(sitemap).not.toContain(`<loc>${DEFAULT_SITE_URL}/connexion</loc>`);
    expect(sitemap).not.toContain(`<loc>${DEFAULT_SITE_URL}/auth/reset</loc>`);
    expect(sitemap).not.toContain(`<loc>${DEFAULT_SITE_URL}/fr/404</loc>`);
    expect(sitemap).not.toContain(`<loc>${DEFAULT_SITE_URL}/about</loc>`);
  });

  it('Given approved English homepage SEO, When alternates are emitted, Then the homepage is reciprocal while unreviewed pages remain French-only', () => {
    const sitemap = buildSitemapXml(DEFAULT_SITE_URL);

    expect(sitemap).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    expect(sitemap).toContain(
      `<xhtml:link rel="alternate" hreflang="fr-CI" href="${DEFAULT_SITE_URL}/fr/services" />`,
    );
    expect(sitemap).toContain(
      `<xhtml:link rel="alternate" hreflang="x-default" href="${DEFAULT_SITE_URL}/fr/services" />`,
    );
    expect(sitemap).toContain(
      `<xhtml:link rel="alternate" hreflang="en-GB" href="${DEFAULT_SITE_URL}/en/" />`,
    );
    expect(sitemap).not.toContain(
      `<xhtml:link rel="alternate" hreflang="en-GB" href="${DEFAULT_SITE_URL}/en/services" />`,
    );
  });

  it('Given an English page becomes indexable later, when sitemap XML is built with that fixture, then hreflang pairs can be emitted without changing routes', () => {
    const frenchServices = findLocalizedSeoPageByPath('/fr/services');
    const englishServices = findLocalizedSeoPageByPath('/en/services');

    expect(frenchServices).toBeDefined();
    expect(englishServices).toBeDefined();

    const englishFixture: SeoPageDefinition = {
      ...englishServices!,
      robots: 'index, follow',
      temporary: false,
      hreflangLinks: [
        { hreflang: 'fr-CI', path: '/fr/services' },
        { hreflang: 'en-GB', path: '/en/services' },
        { hreflang: 'x-default', path: '/fr/services' },
      ],
    };
    const frenchFixture: SeoPageDefinition = {
      ...frenchServices!,
      hreflangLinks: englishFixture.hreflangLinks,
    };

    const sitemap = buildSitemapXml(DEFAULT_SITE_URL, {
      pages: [frenchFixture, englishFixture],
      blogPages: [],
    });

    expect(sitemap).toContain(`<loc>${DEFAULT_SITE_URL}/en/services</loc>`);
    expect(sitemap).toContain(
      `<xhtml:link rel="alternate" hreflang="en-GB" href="${DEFAULT_SITE_URL}/en/services" />`,
    );
  });

  it('Given sitemap generation, when it runs twice, then the XML output is deterministic', () => {
    expect(buildSitemapXml(DEFAULT_SITE_URL)).toBe(
      buildSitemapXml(DEFAULT_SITE_URL),
    );
  });

  it('Given robots.txt generation, when it runs, then crawlers keep the production sitemap URL', () => {
    const robots = buildRobotsTxt(DEFAULT_SITE_URL);

    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Allow: /');
    expect(robots).toContain(`Sitemap: ${DEFAULT_SITE_URL}/sitemap.xml`);
  });

  it('Given public sharing previews, when the homepage SEO is resolved, then the image source remains configured', () => {
    const homePage = findSeoPageByPath('/fr/');

    expect(homePage).toBeDefined();
    expect(homePage?.openGraph.imagePath).toBe(
      '/assets/site-visuals/photos/home-hero-workshop.jpg',
    );
  });

  it('Given an empty siteUrl, when normalizeSiteUrl is called, then the default site URL is returned', () => {
    expect(normalizeSiteUrl('')).toBe(DEFAULT_SITE_URL);
  });

  it('Given no siteUrl argument, when resolvePublicSiteUrl is called, then the default site URL is returned', () => {
    globalThis.__KRAAK_RUNTIME_CONFIG__ = undefined;

    expect(resolvePublicSiteUrl()).toBe(DEFAULT_SITE_URL);
  });

  it('Given runtime config siteUrl, when resolvePublicSiteUrl is called, then runtime siteUrl is returned', () => {
    globalThis.__KRAAK_RUNTIME_CONFIG__ = {
      siteUrl: `${RUNTIME_CONFIG_SITE_URL}/`,
    };

    expect(resolvePublicSiteUrl()).toBe(RUNTIME_CONFIG_SITE_URL);

    globalThis.__KRAAK_RUNTIME_CONFIG__ = undefined;
  });

  it('Given a siteUrl with trailing slash, when normalizeSiteUrl is called, then trailing slash is trimmed', () => {
    expect(normalizeSiteUrl(`${EXAMPLE_SITE_URL}/`)).toBe(EXAMPLE_SITE_URL);
  });

  it('Given a path with leading slash, when buildAbsoluteUrl is called, then the URL is correctly built', () => {
    expect(buildAbsoluteUrl('/fr/contact', EXAMPLE_SITE_URL)).toBe(
      `${EXAMPLE_SITE_URL}/fr/contact`,
    );
  });

  it('Given an absolute URL path, when buildAbsoluteUrl is called, then the URL is returned unchanged', () => {
    expect(
      buildAbsoluteUrl('https://cdn.example.com/asset.webp', EXAMPLE_SITE_URL),
    ).toBe('https://cdn.example.com/asset.webp');
  });
});
