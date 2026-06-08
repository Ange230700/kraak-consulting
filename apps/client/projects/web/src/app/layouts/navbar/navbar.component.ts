// apps\client\projects\web\src\app\layouts\navbar\navbar.component.ts

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
  imports: [RouterModule, PublicConversionTrackingDirective, ParticipantNavCta],
  templateUrl: './navbar.component.html',
})
export class Navbar {
  protected readonly links: NavLink[] = [
    { label: 'ACCUEIL', path: '/' },
    { label: 'SERVICES', path: '/services' },
    { label: 'PROGRAMMES', path: '/programmes' },
    { label: 'À PROPOS', path: '/a-propos' },
    { label: 'CONTACT', path: '/contact' },
  ];

  protected readonly mobileMenuOpen = signal(false);

  protected toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  protected closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}
