import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { KRAAK_SOCIAL_LINKS } from '../../shared/brand/brand-constants';

import { Footer } from './footer.component';

const expectedFacebookUrl =
  KRAAK_SOCIAL_LINKS.find((socialLink) => socialLink.label === 'Facebook')
    ?.href ?? '';
const expectedTiktokUrl =
  KRAAK_SOCIAL_LINKS.find((socialLink) => socialLink.label === 'TikTok')
    ?.href ?? '';

describe('Footer', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Footer],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('Given the footer component When Angular creates it Then the instance is available', () => {
    const fixture = TestBed.createComponent(Footer);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given the footer links When the component renders Then it shows the brand and social navigation', () => {
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
    const facebookIcon = facebookLink?.querySelector('i');
    expect(brandImage?.getAttribute('src')).toContain('kraak-symbol.png');
    expect(footerLinks.length).toBeGreaterThan(0);
    expect(socialButtons.every(Boolean)).toBe(true);
    expect(facebookLink?.getAttribute('href')).toBe(expectedFacebookUrl);
    expect(tiktokLink?.getAttribute('href')).toBe(expectedTiktokUrl);
    expect(facebookLink?.className).toContain('h-12');
    expect(facebookLink?.className).toContain('w-12');
    expect(facebookIcon?.className).toContain('text-xl');
    expect(element.textContent).toContain('FAQ');
  });

  it('Given the footer navigation When the component renders Then each public link is unique', () => {
    const fixture = TestBed.createComponent(Footer);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const navigationKeys = component['navigationLinks'].map(
      (link) => `${link.path}${link.label}`,
    );
    const uniqueNavigationKeys = new Set(navigationKeys);
    const faqLinks = component['navigationLinks'].filter(
      (link) => link.path === '/faq' && link.label === 'FAQ',
    );

    expect(uniqueNavigationKeys.size).toBe(navigationKeys.length);
    expect(faqLinks).toHaveLength(1);
  });
});
