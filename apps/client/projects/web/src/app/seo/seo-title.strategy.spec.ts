import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { vi } from 'vitest';

import type { SeoPageDefinition } from './site-seo';
import { SeoService } from './seo.service';
import { SEO_PAGE_LOOKUP, SeoTitleStrategy } from './seo-title.strategy';
import * as siteSeo from './site-seo';

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
  let pageLookup: {
    findLocalizedSeoPageByPath: ReturnType<typeof vi.fn>;
    findSeoPageByPath: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    applyPageSeo = vi.fn();
    pageLookup = {
      findLocalizedSeoPageByPath: vi.fn(siteSeo.findLocalizedSeoPageByPath),
      findSeoPageByPath: vi.fn(siteSeo.findSeoPageByPath),
    };

    TestBed.configureTestingModule({
      providers: [
        SeoTitleStrategy,
        { provide: SeoService, useValue: { applyPageSeo } },
        { provide: SEO_PAGE_LOOKUP, useValue: pageLookup },
      ],
    });

    strategy = TestBed.inject(SeoTitleStrategy);
  });

  it('should create', () => {
    expect(strategy).toBeTruthy();
  });

  describe('updateTitle', () => {
    it('Given le registre SEO par défaut, When une page sans définition est activée, Then les métadonnées réelles de l’accueil sont appliquées', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          SeoTitleStrategy,
          { provide: SeoService, useValue: { applyPageSeo } },
        ],
      });
      TestBed.inject(SeoTitleStrategy).updateTitle(mockSnapshot(mockRoute({})));
      expect(applyPageSeo).toHaveBeenCalledWith(
        siteSeo.findLocalizedSeoPageByPath('/fr/'),
      );
    });
    it('Given une page d’accueil localisée absente, When le titre est mis à jour, Then le SEO historique sert de repli', () => {
      pageLookup.findLocalizedSeoPageByPath.mockReturnValue(undefined);
      strategy.updateTitle(mockSnapshot(mockRoute({})));
      expect(applyPageSeo).toHaveBeenCalledWith(siteSeo.findSeoPageByPath(''));
    });

    it('Given aucune définition SEO disponible, When le titre est mis à jour, Then aucune métadonnée invalide n’est appliquée', () => {
      pageLookup.findLocalizedSeoPageByPath.mockReturnValue(undefined);
      pageLookup.findSeoPageByPath.mockReturnValue(undefined);
      strategy.updateTitle(mockSnapshot(mockRoute({})));
      expect(applyPageSeo).not.toHaveBeenCalled();
    });
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
      expect(calledWith.path).toBe('/fr/');
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
