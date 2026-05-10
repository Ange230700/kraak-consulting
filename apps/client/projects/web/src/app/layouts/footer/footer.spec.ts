import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Footer } from './footer';

const expectedFacebookUrl = 'https://www.facebook.com/kraakconsulting/';
const expectedTiktokUrl = 'https://www.tiktok.com/@kraakconsulting';

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
    const facebookLink = element.querySelector(
      'a[aria-label="Facebook"]',
    ) as HTMLAnchorElement | null;
    const tiktokLink = element.querySelector(
      'a[aria-label="TikTok"]',
    ) as HTMLAnchorElement | null;
    const faqLink = Array.from(footerLinks).find(
      (link) => link.textContent?.trim() === 'FAQ',
    ) as HTMLAnchorElement | undefined;

    expect(brandImage?.getAttribute('src')).toContain('kraak-symbol.png');
    expect(footerLinks.length).toBeGreaterThan(0);
    expect(socialButtons.every(Boolean)).toBe(true);
    expect(facebookLink?.getAttribute('href')).toBe(expectedFacebookUrl);
    expect(tiktokLink?.getAttribute('href')).toBe(expectedTiktokUrl);
    expect(faqLink?.getAttribute('href')).toBe('/faq');
  });
});
