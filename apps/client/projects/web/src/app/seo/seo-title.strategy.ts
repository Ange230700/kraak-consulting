import { Injectable, inject } from '@angular/core';
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

@Injectable()
export class SeoTitleStrategy extends TitleStrategy {
  private readonly seoService = inject(SeoService);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const page =
      this.findSeoPage(snapshot.root) ??
      findLocalizedSeoPageByPath('/fr/') ??
      findSeoPageByPath('');

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
