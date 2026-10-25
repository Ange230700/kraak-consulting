import { Injectable, InjectionToken, inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  TitleStrategy,
} from '@angular/router';

import {
  SeoPageDefinition,
  findLocalizedSeoPageByPath,
  findSeoPageByPath,
} from './site-seo';
import { SeoService } from './seo.service';

export const SEO_PAGE_LOOKUP = new InjectionToken('SEO_PAGE_LOOKUP', {
  providedIn: 'root',
  factory: () => ({
    findLocalizedSeoPageByPath,
    findSeoPageByPath,
  }),
});

@Injectable()
export class SeoTitleStrategy extends TitleStrategy {
  private readonly seoService = inject(SeoService);
  private readonly pageLookup = inject(SEO_PAGE_LOOKUP);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const page =
      this.findSeoPage(snapshot.root) ??
      this.pageLookup.findLocalizedSeoPageByPath('/fr/') ??
      this.pageLookup.findSeoPageByPath('');

    if (page) {
      this.seoService.applyPageSeo(page);
    }
  }

  private findSeoPage(
    route: ActivatedRouteSnapshot,
  ): SeoPageDefinition | undefined {
    let currentRoute: ActivatedRouteSnapshot | null = route;
    let currentPage: SeoPageDefinition | undefined;

    while (currentRoute) {
      const routePage = currentRoute.data['seo'] as
        | SeoPageDefinition
        | undefined;

      if (routePage) {
        currentPage = routePage;
      }

      currentRoute = currentRoute.firstChild;
    }

    return currentPage;
  }
}
