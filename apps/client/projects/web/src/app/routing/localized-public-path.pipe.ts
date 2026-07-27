import { Pipe, PipeTransform, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SOURCE_LOCALE } from '@kraak/domain';

import {
  findLocalizedPublicRouteEntry,
  resolveLocaleFromPublicPath,
  type LocalizedPublicPageId,
} from './localized-public-routes';

@Pipe({
  name: 'localizedPublicPath',
  standalone: true,
  pure: false,
})
export class LocalizedPublicPathPipe implements PipeTransform {
  private readonly router = inject(Router);

  transform(pageId: LocalizedPublicPageId): string {
    return findLocalizedPublicRouteEntry(
      pageId,
      resolveLocaleFromPublicPath(this.router.url) ?? SOURCE_LOCALE,
    ).path;
  }
}
