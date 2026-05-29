import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';

import { Navbar } from './navbar.component';

interface NavbarInternals {
  links: { label: string; path: string }[];
  mobileMenuOpen: () => boolean;
}

describe('Navbar', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('Given la navbar est créée, When Angular initialise le composant, Then la configuration de base existe', () => {
    const fixture = TestBed.createComponent(Navbar);
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as NavbarInternals;
    expect(component.links).toHaveLength(5);
    expect(component.mobileMenuOpen()).toBe(false);
  });

  it('Given le rendu desktop, When la navbar est affichée, Then les liens principaux sont visibles', () => {
    const fixture = TestBed.createComponent(Navbar);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const navLinks = Array.from(host.querySelectorAll('a.kr-nav-link'));

    expect(navLinks.map((link) => link.textContent?.trim())).toEqual([
      'À propos',
      'Services',
      'Programmes',
      'Blog',
      'Contact',
    ]);
  });

  it('Given le menu mobile est fermé, When on clique sur le bouton menu, Then il s ouvre puis se referme au clic sur un lien', () => {
    const fixture = TestBed.createComponent(Navbar);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const button = host.querySelector(
      'button[aria-label="Menu de navigation"]',
    );
    expect(button).not.toBeNull();

    expect(button?.getAttribute('aria-expanded')).toBe('false');

    button?.dispatchEvent(new Event('click'));
    fixture.detectChanges();

    expect(button?.getAttribute('aria-expanded')).toBe('true');

    const firstNavLink = host.querySelector('a.kr-nav-link');
    expect(firstNavLink).not.toBeNull();
    firstNavLink?.dispatchEvent(new Event('click'));
    fixture.detectChanges();

    expect(button?.getAttribute('aria-expanded')).toBe('false');
  });
});
