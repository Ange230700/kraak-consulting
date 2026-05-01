import { Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';

interface NavLink {
  label: string;
  path: string;
}

@Component({
  selector: 'kraak-navbar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './navbar.html',
})
export class Navbar {
  protected readonly links: NavLink[] = [
    { label: 'À propos', path: '/a-propos' },
    { label: 'Services', path: '/services' },
    { label: 'Programmes', path: '/programmes' },
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
