import { Meta, Title } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';

import { SeoPageDefinition, findSeoPageByPath } from './site-seo';
import { SeoService } from './seo.service';

const LOCAL_BASE_URL = 'http://localhost:4200';
const LOCAL_HOME_URL = `${LOCAL_BASE_URL}/`;
const LOCAL_CONTACT_URL = `${LOCAL_BASE_URL}/contact`;
const LOCAL_OG_IMAGE_URL = `${LOCAL_BASE_URL}/assets/site-visuals/photos/home-hero-workshop.jpg`;

describe('SeoService', () => {
  beforeEach(() => {
    document.head
      .querySelectorAll('meta[name], meta[property], link[rel="canonical"]')
      .forEach((element) => {
        const metaName = element.getAttribute('name');
        const metaProperty = element.getAttribute('property');
        const isSeoMeta =
          metaName === 'description' ||
          metaName === 'robots' ||
          metaName === 'twitter:card' ||
          metaName === 'twitter:title' ||
          metaName === 'twitter:description' ||
          metaName === 'twitter:image' ||
          metaProperty === 'og:title' ||
          metaProperty === 'og:description' ||
          metaProperty === 'og:type' ||
          metaProperty === 'og:url' ||
          metaProperty === 'og:image' ||
          metaProperty === 'og:site_name' ||
          metaProperty === 'og:locale' ||
          element.getAttribute('rel') === 'canonical';

        if (isSeoMeta) {
          element.remove();
        }
      });

    document.title = '';

    TestBed.configureTestingModule({
      providers: [SeoService],
    });
  });

  it('should apply title, canonical URL and meta tags for the current page', () => {
    const service = TestBed.inject(SeoService);
    const meta = TestBed.inject(Meta);
    const title = TestBed.inject(Title);
    const contactPage = findSeoPageByPath('contact');

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
    expect(
      document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    ).toBe(LOCAL_CONTACT_URL);
  });

  it('should normalize the homepage canonical URL with a trailing slash', () => {
    const service = TestBed.inject(SeoService);
    const homePage = findSeoPageByPath('');

    expect(homePage).toBeDefined();

    service.applyPageSeo(homePage!, LOCAL_HOME_URL);

    expect(
      document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    ).toBe(LOCAL_HOME_URL);
  });

  it('Given a page-specific robots directive, when applyPageSeo is called, then robots meta uses the page value', () => {
    const service = TestBed.inject(SeoService);
    const meta = TestBed.inject(Meta);
    const resetPageSeo: SeoPageDefinition = {
      path: 'auth/reset',
      title: 'Finaliser la réinitialisation | KRAAK Consulting',
      description:
        'Définissez un nouveau mot de passe pour sécuriser votre accès à l’espace KRAAK.',
      robots: 'noindex, nofollow',
      openGraph: {
        title: 'Finaliser la réinitialisation | KRAAK Consulting',
        description:
          'Définissez un nouveau mot de passe pour sécuriser votre accès à l’espace KRAAK.',
        imagePath: '/assets/site-visuals/photos/home-hero-workshop.jpg',
        imageAlt:
          "Photo d'un atelier KRAAK Consulting avec des participants en session de travail.",
      },
      sitemap: {
        changeFrequency: 'never',
        priority: 0.1,
      },
    };

    service.applyPageSeo(resetPageSeo, LOCAL_BASE_URL);

    expect(meta.getTag('name="robots"')?.content).toBe('noindex, nofollow');
  });

  // Given the canonical link already exists in the document head
  // When applyPageSeo is called again for a different page
  // Then the existing canonical link href is updated without creating a new element
  it('Given a canonical link already exists, when applyPageSeo is called again, then the href is updated in place', () => {
    const service = TestBed.inject(SeoService);
    const contactPage = findSeoPageByPath('contact');
    const homePage = findSeoPageByPath('');

    expect(contactPage).toBeDefined();
    expect(homePage).toBeDefined();

    service.applyPageSeo(contactPage!, LOCAL_BASE_URL);
    expect(
      document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    ).toBe(LOCAL_CONTACT_URL);

    service.applyPageSeo(homePage!, LOCAL_HOME_URL);
    expect(document.querySelectorAll('link[rel="canonical"]').length).toBe(1);
    expect(
      document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    ).toBe(LOCAL_HOME_URL);
  });

  // Given the canonical link already exists in the document head
  // When applyPageSeo is called again for a different page
  // Then the existing canonical link href is updated without creating a new element
  it('Given a canonical link already exists, when applyPageSeo is called again, then the href is updated in place', () => {
    const service = TestBed.inject(SeoService);
    const contactPage = findSeoPageByPath('contact');
    const homePage = findSeoPageByPath('');

    expect(contactPage).toBeDefined();
    expect(homePage).toBeDefined();

    service.applyPageSeo(contactPage!, 'http://localhost:4200');
    expect(
      document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    ).toBe('http://localhost:4200/contact');

    service.applyPageSeo(homePage!, 'http://localhost:4200/');
    expect(document.querySelectorAll('link[rel="canonical"]').length).toBe(1);
    expect(
      document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    ).toBe('http://localhost:4200/');
  });
});
