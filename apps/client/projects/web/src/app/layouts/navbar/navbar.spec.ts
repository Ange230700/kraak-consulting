import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Navbar } from './navbar';

describe('Navbar', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should render lightweight navigation actions for key paths', () => {
    const fixture = TestBed.createComponent(Navbar);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const brandImage = element.querySelector(
      'img[alt="Logo KRAAK Consulting"]',
    ) as HTMLImageElement | null;
    const primaryCta = element.querySelector(
      'a[aria-label="Espace participant"]',
    ) as HTMLAnchorElement | null;
    const menuToggle = element.querySelector(
      'button[aria-label="Menu de navigation"]',
    ) as HTMLButtonElement | null;

    expect(element.querySelectorAll('.p-button').length).toBe(0);
    expect(menuToggle).toBeTruthy();
    expect(element.textContent).toContain('Espace participant');
    expect(brandImage?.getAttribute('src')).toContain(
      'kraak_consulting_logo_192w.png',
    );
    expect(primaryCta).toBeTruthy();
    expect(element.textContent).not.toContain('Accueil');
    expect(element.textContent).toContain('\u00C0 propos');
  });

  it('should provide a named navigation landmark', () => {
    const fixture = TestBed.createComponent(Navbar);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const navigation = element.querySelector('nav');

    expect(navigation?.getAttribute('aria-label')).toBe(
      'Navigation principale',
    );
  });
});
