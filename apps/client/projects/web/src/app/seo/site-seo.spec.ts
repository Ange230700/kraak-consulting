// apps\client\projects\web\src\app\seo\site-seo.spec.ts

import {
  buildAbsoluteUrl,
  buildLocalizedSeoPage,
  buildRobotsTxt,
  buildSitemapXml,
  buildSitemapUrlXml,
  findLocalizedSeoPageByPath,
  findSeoPageByPath,
  localizedSeoPages,
  normalizeSiteUrl,
  normalizeRoutePath,
  resolvePublicSiteUrl,
  seoPages,
  type SeoPageDefinition,
} from './site-seo';
import { localizedPublicRouteEntries } from '../routing/localized-public-routes';

const DEFAULT_SITE_URL = 'https://kraak-web-prod.onrender.com';
const EXAMPLE_SITE_URL = 'https://example.com';
const RUNTIME_CONFIG_SITE_URL = 'https://render-staging.kraak.example';

describe('site-seo', () => {
  it('Given une page temporaire avec un code non documenté, When son SEO est construit, Then le contenu temporaire générique est conservé', () => {
    const entry = localizedPublicRouteEntries.find(
      (item) => item.locale === 'en-GB' && item.pageId === 'contact',
    )!;
    const page = buildLocalizedSeoPage({
      ...entry,
      temporary: true,
      statusCode: 418,
    });
    expect(page.temporary).toBe(true);
    expect(page.robots).toContain('noindex');
    expect(page.title).toContain('KRAAK');
  });

  it('Given une nouvelle page sans équivalent source, When ses liens linguistiques sont construits, Then sa canonique reste le repli x-default', () => {
    const entry = localizedPublicRouteEntries[0];
    const page = buildLocalizedSeoPage({
      ...entry,
      pageId: 'nouvelle-page' as never,
    });
    expect(page.hreflangLinks).toEqual([
      { hreflang: 'x-default', path: entry.canonicalPath },
    ]);
  });

  it('Given une alternative de langue non prise en charge, When le sitemap est produit, Then seuls les liens reconnus et x-default sont publiés', () => {
    const page = seoPages.find((item) => item.path === 'contact')!;
    const xml = buildSitemapUrlXml(
      {
        ...page,
        hreflangLinks: [
          { hreflang: 'de-DE' as never, path: '/de/contact' },
          { hreflang: 'x-default', path: '/fr/contact' },
        ],
      },
      EXAMPLE_SITE_URL,
    );
    expect(xml).not.toContain('/de/contact');
    expect(xml).toContain('hreflang="x-default"');
  });
  it('Given un chemin entouré de barres, When il est normalisé, Then seules les barres périphériques sont retirées', () => {
    expect(normalizeRoutePath('///contact///')).toBe('contact');
    expect(normalizeRoutePath('/')).toBe('');
  });

  it('Given une entrée publique sans métadonnées source, When le SEO est construit, Then l’erreur identifie la configuration manquante', () => {
    const entry = localizedPublicRouteEntries[0];
    expect(() =>
      buildLocalizedSeoPage({ ...entry, seoPath: 'page-absente' }),
    ).toThrow('Missing SEO metadata');
  });

  it('Given une page anglaise sans contenu révisé, When sa publication est demandée, Then la génération refuse une traduction absente', () => {
    const entry = localizedPublicRouteEntries.find(
      (item) => item.locale === 'en-GB',
    )!;
    expect(() =>
      buildLocalizedSeoPage({
        ...entry,
        temporary: false,
        seoPath: 'auth/reset',
      }),
    ).toThrow('Métadonnées SEO révisées introuvables');
  });

  it('Given une page non indexable révisée, When le SEO est construit, Then la directive noindex est appliquée', () => {
    const entry = localizedPublicRouteEntries.find(
      (item) => item.locale === 'fr-CI' && item.pageId === 'contact',
    )!;
    const page = buildLocalizedSeoPage({ ...entry, indexable: false });
    expect(page.robots).toContain('noindex');
  });

  it('Given une URL sans alternatives ni canonique, When son XML est produit, Then son propre chemin est utilisé sans lien alternatif vide', () => {
    const page = seoPages.find((item) => item.path === 'contact')!;
    const xml = buildSitemapUrlXml(
      { ...page, hreflangLinks: undefined, canonicalPath: undefined },
      EXAMPLE_SITE_URL,
    );
    expect(xml).toContain('<loc>https://example.com/contact</loc>');
    expect(xml).not.toContain('<xhtml:link');
  });
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
      'blog',
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
      '/fr/blog',
      '/en/blog',
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

  it('Given localized English status pages, when SEO is resolved, then reviewed English metadata is used while status routes remain temporary and noindex', () => {
    const expectations = [
      {
        path: '/en/401',
        title: 'Authentication required | KRAAK Consulting',
      },
      {
        path: '/en/403',
        title: 'Access denied | KRAAK Consulting',
      },
      {
        path: '/en/404',
        title: 'Page not found | KRAAK Consulting',
      },
      {
        path: '/en/500',
        title: 'Technical issue | KRAAK Consulting',
      },
    ] as const;

    for (const expectation of expectations) {
      const page = findLocalizedSeoPageByPath(expectation.path);

      expect(page).toBeDefined();
      expect(page?.title).toBe(expectation.title);
      expect(page?.htmlLang).toBe('en-GB');
      expect(page?.openGraphLocale).toBe('en_GB');
      expect(page?.robots).toBe('noindex, nofollow');
      expect(page?.temporary).toBe(true);
      expect(page?.openGraph?.title).toBe(expectation.title);
    }
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
