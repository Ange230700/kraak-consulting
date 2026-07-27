import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';

import {
  SeoPageDefinition,
  findLocalizedSeoPageByPath,
  findSeoPageByPath,
} from './site-seo';
import { SeoService } from './seo.service';

const LOCAL_BASE_URL = 'http://localhost:4200';
const LOCAL_HOME_URL = `${LOCAL_BASE_URL}/fr/`;
const LOCAL_CONTACT_URL = `${LOCAL_BASE_URL}/fr/contact`;
const LOCAL_ENGLISH_SERVICES_URL = `${LOCAL_BASE_URL}/en/services`;
const LOCAL_OG_IMAGE_URL = `${LOCAL_BASE_URL}/assets/site-visuals/photos/home-hero-workshop.jpg`;

describe('SeoService', () => {
  beforeEach(() => {
    document.head
      .querySelectorAll(
        [
          'meta[name]',
          'meta[property]',
          'link[rel="canonical"]',
          'link[rel="alternate"][hreflang]',
        ].join(','),
      )
      .forEach((element) => element.remove());

    document.title = '';
    document.documentElement.setAttribute('lang', 'fr');

    TestBed.configureTestingModule({
      providers: [SeoService],
    });
  });

  it('Given a localized French page, when applyPageSeo is called, then title canonical metadata and document language are updated', () => {
    const service = TestBed.inject(SeoService);
    const meta = TestBed.inject(Meta);
    const title = TestBed.inject(Title);
    const contactPage = findLocalizedSeoPageByPath('/fr/contact');

    expect(contactPage).toBeDefined();

    service.applyPageSeo(contactPage!, LOCAL_BASE_URL);

    expect(title.getTitle()).toContain('Contact');
    expect(meta.getTag('name="description"')?.content).toContain(
      'gestion de projets, immigration ou besoin entreprise',
    );
    expect(meta.getTag('property="og:title"')?.content).toContain(
      'Parlons de votre projet',
    );
    expect(meta.getTag('property="og:url"')?.content).toBe(LOCAL_CONTACT_URL);
    expect(meta.getTag('property="og:image"')?.content).toBe(
      LOCAL_OG_IMAGE_URL,
    );
    expect(meta.getTag('property="og:locale"')?.content).toBe('fr_CI');
    expect(document.documentElement.getAttribute('lang')).toBe('fr-CI');
    expect(
      document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    ).toBe(LOCAL_CONTACT_URL);
  });

  it('Given the localized homepage, when applyPageSeo is called, then the canonical URL keeps the locale trailing slash', () => {
    const service = TestBed.inject(SeoService);
    const homePage = findLocalizedSeoPageByPath('/fr/');

    expect(homePage).toBeDefined();

    service.applyPageSeo(homePage!, LOCAL_BASE_URL);

    expect(
      document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    ).toBe(LOCAL_HOME_URL);
  });

  it('Given a page-specific robots directive, when applyPageSeo is called, then robots meta uses the page value', () => {
    const service = TestBed.inject(SeoService);
    const meta = TestBed.inject(Meta);
    const resetPageSeo = findSeoPageByPath('auth/reset');

    expect(resetPageSeo).toBeDefined();

    service.applyPageSeo(resetPageSeo!, LOCAL_BASE_URL);

    expect(meta.getTag('name="robots"')?.content).toBe('noindex, nofollow');
  });

  it('Given an English scaffold page, when applyPageSeo is called, then noindex and en-GB metadata are applied', () => {
    const service = TestBed.inject(SeoService);
    const meta = TestBed.inject(Meta);
    const englishServices = findLocalizedSeoPageByPath('/en/services');

    expect(englishServices).toBeDefined();

    service.applyPageSeo(englishServices!, LOCAL_BASE_URL);

    expect(meta.getTag('name="robots"')?.content).toBe('noindex, nofollow');
    expect(meta.getTag('property="og:locale"')?.content).toBe('en_GB');
    expect(document.documentElement.getAttribute('lang')).toBe('en-GB');
    expect(
      document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    ).toBe(LOCAL_ENGLISH_SERVICES_URL);
  });

  it('Given localized alternate links, when applyPageSeo is called, then hreflang and x-default links are created', () => {
    const service = TestBed.inject(SeoService);
    const servicesPage = findLocalizedSeoPageByPath('/fr/services');

    expect(servicesPage).toBeDefined();

    service.applyPageSeo(servicesPage!, LOCAL_BASE_URL);

    expect(
      document
        .querySelector('link[rel="alternate"][hreflang="fr-CI"]')
        ?.getAttribute('href'),
    ).toBe(`${LOCAL_BASE_URL}/fr/services`);
    expect(
      document
        .querySelector('link[rel="alternate"][hreflang="x-default"]')
        ?.getAttribute('href'),
    ).toBe(`${LOCAL_BASE_URL}/fr/services`);
    expect(
      document.querySelector('link[rel="alternate"][hreflang="en-GB"]'),
    ).toBeNull();
  });

  it('Given a future indexable English alternate, when applyPageSeo is called, then Open Graph locale alternates are supported', () => {
    const service = TestBed.inject(SeoService);
    const servicesPage = findLocalizedSeoPageByPath('/fr/services');

    expect(servicesPage).toBeDefined();

    const futureSeo: SeoPageDefinition = {
      ...servicesPage!,
      hreflangLinks: [
        { hreflang: 'fr-CI', path: '/fr/services' },
        { hreflang: 'en-GB', path: '/en/services' },
        { hreflang: 'x-default', path: '/fr/services' },
      ],
    };

    service.applyPageSeo(futureSeo, LOCAL_BASE_URL);

    expect(
      document.querySelectorAll('meta[property="og:locale:alternate"]'),
    ).toHaveLength(1);
    expect(
      document
        .querySelector('meta[property="og:locale:alternate"]')
        ?.getAttribute('content'),
    ).toBe('en_GB');
  });

  it('Given canonical and alternate links already exist, when applyPageSeo is called again, then existing SEO links are updated without duplicates', () => {
    const service = TestBed.inject(SeoService);
    const contactPage = findLocalizedSeoPageByPath('/fr/contact');
    const homePage = findLocalizedSeoPageByPath('/fr/');

    expect(contactPage).toBeDefined();
    expect(homePage).toBeDefined();

    service.applyPageSeo(contactPage!, LOCAL_BASE_URL);
    service.applyPageSeo(homePage!, LOCAL_BASE_URL);

    expect(document.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(
      document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    ).toBe(LOCAL_HOME_URL);
    expect(
      document.querySelectorAll('link[rel="alternate"][hreflang]'),
    ).toHaveLength(2);
  });
});
