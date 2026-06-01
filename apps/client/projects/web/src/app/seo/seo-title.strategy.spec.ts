import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { vi } from 'vitest';

import type { SeoPageDefinition } from './site-seo';
import { SeoService } from './seo.service';
import { SeoTitleStrategy } from './seo-title.strategy';

function mockRoute(
  data: Record<string, unknown>,
  firstChild: ActivatedRouteSnapshot | null = null,
): ActivatedRouteSnapshot {
  return { data, firstChild } as unknown as ActivatedRouteSnapshot;
}

function mockSnapshot(root: ActivatedRouteSnapshot): RouterStateSnapshot {
  return { root } as unknown as RouterStateSnapshot;
}

const CONTACT_SEO: SeoPageDefinition = {
  path: 'contact',
  title: 'Contact | KRAAK Consulting',
  description: 'Prenez contact avec nous.',
  openGraph: {
    title: 'Contact | KRAAK Consulting',
    description: 'Prenez contact avec nous.',
    imagePath: '/assets/img.jpg',
    imageAlt: 'Photo atelier KRAAK.',
  },
  sitemap: { changeFrequency: 'monthly', priority: 0.5 },
};

describe('SeoTitleStrategy', () => {
  let strategy: SeoTitleStrategy;
  let applyPageSeo: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    applyPageSeo = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        SeoTitleStrategy,
        { provide: SeoService, useValue: { applyPageSeo } },
      ],
    });

    strategy = TestBed.inject(SeoTitleStrategy);
  });

  it('should create', () => {
    expect(strategy).toBeTruthy();
  });

  describe('updateTitle', () => {
    it('Given a root route with SEO data, when updateTitle is called, then applyPageSeo is called with that page definition', () => {
      const snapshot = mockSnapshot(mockRoute({ seo: CONTACT_SEO }));

      strategy.updateTitle(snapshot);

      expect(applyPageSeo).toHaveBeenCalledOnce();
      expect(applyPageSeo).toHaveBeenCalledWith(CONTACT_SEO);
    });

    it('Given a route tree with no SEO data, when updateTitle is called, then applyPageSeo falls back to the home page', () => {
      const snapshot = mockSnapshot(mockRoute({}));

      strategy.updateTitle(snapshot);

      expect(applyPageSeo).toHaveBeenCalledOnce();
      const [calledWith] = applyPageSeo.mock.calls[0] as [SeoPageDefinition];
      expect(calledWith.path).toBe('');
    });

    it('Given a child route with SEO data, when updateTitle is called, then the child page definition is used', () => {
      const child = mockRoute({ seo: CONTACT_SEO });
      const parent = mockRoute({}, child);
      const snapshot = mockSnapshot(parent);

      strategy.updateTitle(snapshot);

      expect(applyPageSeo).toHaveBeenCalledWith(CONTACT_SEO);
    });

    it('Given multiple nested routes each with SEO data, when updateTitle is called, then the deepest definition wins', () => {
      const deepSeo: SeoPageDefinition = {
        path: 'programmes/detail',
        title: 'Détail programme | KRAAK',
        description: 'Détail.',
        openGraph: {
          title: 'Détail programme | KRAAK',
          description: 'Détail.',
          imagePath: '/assets/img.jpg',
          imageAlt: 'img',
        },
        sitemap: { changeFrequency: 'never', priority: 0.3 },
      };

      const deepRoute = mockRoute({ seo: deepSeo });
      const shallowRoute = mockRoute({ seo: CONTACT_SEO }, deepRoute);
      const snapshot = mockSnapshot(shallowRoute);

      strategy.updateTitle(snapshot);

      expect(applyPageSeo).toHaveBeenCalledWith(deepSeo);
      expect(applyPageSeo).not.toHaveBeenCalledWith(CONTACT_SEO);
    });
  });
});
