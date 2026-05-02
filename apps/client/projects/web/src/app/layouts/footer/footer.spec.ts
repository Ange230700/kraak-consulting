import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Footer } from './footer';

describe('Footer', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Footer],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Footer);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the brand logo and enhanced footer links', () => {
    const fixture = TestBed.createComponent(Footer);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const brandImage = element.querySelector(
      'img[alt="Symbole KRAAK Consulting"]',
    ) as HTMLImageElement | null;
    const footerLinks = element.querySelectorAll('nav a');
    const socialButtons = ['Facebook', 'Instagram', 'WhatsApp', 'TikTok'].map(
      (name) => element.querySelector(`a[aria-label="${name}"]`),
    );

    expect(brandImage?.getAttribute('src')).toContain(
      'kraak_consulting_symbol_96w.png',
    );
    expect(footerLinks.length).toBeGreaterThan(0);
    expect(socialButtons.every((button) => button)).toBe(true);
  });
});
