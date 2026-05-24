import { Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';

import { PublicConversionTrackingDirective } from '../../shared/analytics/public-conversion-tracking.directive';
import { ParticipantNavCta } from '../../shared/participant-nav-cta/participant-nav-cta.component';

interface NavLink {
  label: string;
  path: string;
}

@Component({
  selector: 'kraak-navbar',
  standalone: true,
  imports: [RouterModule, ParticipantNavCta, PublicConversionTrackingDirective],
  templateUrl: './navbar.component.html',
})
export class Navbar {
  protected readonly links: NavLink[] = [
    { label: '\u00C0 propos', path: '/a-propos' },
    { label: 'Services', path: '/services' },
    { label: 'Programmes', path: '/programmes' },
    { label: 'Blog', path: '/blog' },
    { label: 'Contact', path: '/contact' },
  ];

  protected readonly mobileMenuOpen = signal(false);

  protected toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  protected closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}
