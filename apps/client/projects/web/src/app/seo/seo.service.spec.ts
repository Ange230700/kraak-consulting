import { Meta, Title } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';

import { findSeoPageByPath } from './site-seo';
import { SeoService } from './seo.service';

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

    service.applyPageSeo(contactPage!, 'http://localhost:4200');

    expect(title.getTitle()).toContain('Contact');
    expect(meta.getTag('name="description"')?.content).toContain(
      'gestion de projets, immigration ou besoin entreprise',
    );
    expect(meta.getTag('property="og:title"')?.content).toContain(
      'Parlons de votre projet',
    );
    expect(meta.getTag('property="og:url"')?.content).toBe(
      'http://localhost:4200/contact',
    );
    expect(meta.getTag('property="og:image"')?.content).toBe(
      'http://localhost:4200/open-graph/kraak-share-card.svg',
    );
    expect(
      document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    ).toBe('http://localhost:4200/contact');
  });

  it('should normalize the homepage canonical URL with a trailing slash', () => {
    const service = TestBed.inject(SeoService);
    const homePage = findSeoPageByPath('');

    expect(homePage).toBeDefined();

    service.applyPageSeo(homePage!, 'http://localhost:4200/');

    expect(
      document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    ).toBe('http://localhost:4200/');
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
