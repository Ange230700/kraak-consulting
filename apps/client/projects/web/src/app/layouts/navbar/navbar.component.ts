// apps\client\projects\web\src\app\layouts\navbar\navbar.component.ts

import { Location } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import type { SupportedLocale } from '@kraak/domain';

import {
  KraakI18nService,
  KraakTranslatePipe,
  type TranslationKey,
} from '../../../../../shared/i18n';

import { LocalizedPublicPathPipe } from '../../routing/localized-public-path.pipe';
import {
  buildLocalizedPublicLocalePath,
  type LocalizedPublicPageId,
} from '../../routing/localized-public-routes';
import { PublicConversionTrackingDirective } from '../../shared/analytics/public-conversion-tracking.directive';
import { ParticipantNavCta } from '../../shared/participant-nav-cta/participant-nav-cta.component';

interface NavLink {
  labelKey: TranslationKey;
  pageId: LocalizedPublicPageId;
}

@Component({
  selector: 'kraak-navbar',
  standalone: true,
  imports: [
    RouterModule,
    PublicConversionTrackingDirective,
    ParticipantNavCta,
    LocalizedPublicPathPipe,
    KraakTranslatePipe,
  ],
  templateUrl: './navbar.component.html',
})
export class Navbar {
  private readonly location = inject(Location);
  private readonly i18n = inject(KraakI18nService);

  protected readonly links: NavLink[] = [
    { labelKey: 'web.nav.links.home', pageId: 'home' },
    { labelKey: 'web.nav.links.services', pageId: 'services' },
    { labelKey: 'web.nav.links.programs', pageId: 'programs' },
    { labelKey: 'web.nav.links.about', pageId: 'about' },
    { labelKey: 'web.nav.links.contact', pageId: 'contact' },
  ];

  protected readonly locale = this.i18n.locale;
  protected readonly mobileMenuOpen = signal(false);

  protected buildLanguageHref(targetLocale: SupportedLocale): string {
    return buildLocalizedPublicLocalePath(
      this.location.path(true),
      targetLocale,
    );
  }

  protected toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  protected closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}
