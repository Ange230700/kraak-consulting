// apps\client\projects\web\src\app\layouts\navbar\navbar.component.ts

import { Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';

import { LocalizedPublicPathPipe } from '../../routing/localized-public-path.pipe';
import type { LocalizedPublicPageId } from '../../routing/localized-public-routes';
import { PublicConversionTrackingDirective } from '../../shared/analytics/public-conversion-tracking.directive';
import { ParticipantNavCta } from '../../shared/participant-nav-cta/participant-nav-cta.component';

interface NavLink {
  label: string;
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
  ],
  templateUrl: './navbar.component.html',
})
export class Navbar {
  protected readonly links: NavLink[] = [
    { label: 'ACCUEIL', pageId: 'home' },
    { label: 'SERVICES', pageId: 'services' },
    { label: 'PROGRAMMES', pageId: 'programs' },
    { label: '\u00C0 PROPOS', pageId: 'about' },
    { label: 'CONTACT', pageId: 'contact' },
  ];

  protected readonly mobileMenuOpen = signal(false);

  protected toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  protected closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}
