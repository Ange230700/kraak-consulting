import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import PolitiqueDeConfidentialitePage from './politique-de-confidentialite.page';

describe('PolitiqueDeConfidentialitePage', () => {
  let fixture: ComponentFixture<PolitiqueDeConfidentialitePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PolitiqueDeConfidentialitePage],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PolitiqueDeConfidentialitePage);
    fixture.detectChanges();
  });

  describe('Given the politique de confidentialité page is rendered', () => {
    it('When displayed, Then it shows the main heading', () => {
      const h1: HTMLElement = fixture.nativeElement.querySelector('h1');
      expect(h1?.textContent).toContain('Politique de confidentialit');
    });

    it('When displayed, Then it includes the RGPD rights section', () => {
      const headings: NodeListOf<HTMLElement> =
        fixture.nativeElement.querySelectorAll('h2');
      const texts = Array.from(headings).map((h) => h.textContent ?? '');
      expect(texts.some((t) => t.includes('droits'))).toBe(true);
    });

    it('When displayed, Then it includes the data collected section', () => {
      const headings: NodeListOf<HTMLElement> =
        fixture.nativeElement.querySelectorAll('h2');
      const texts = Array.from(headings).map((h) => h.textContent ?? '');
      expect(texts.some((t) => t.includes('collect'))).toBe(true);
    });

    it('When displayed, Then it gives the canonical contact coordinates for rights requests', () => {
      const text = fixture.nativeElement.textContent ?? '';
      const links: HTMLAnchorElement[] = Array.from(
        fixture.nativeElement.querySelectorAll('a'),
      );

      expect(text).toContain('kraakconsulting@gmail.com');
      expect(text).toContain('+225 05 02 74 18 18');
      expect(
        links.some((link) => link.href === 'mailto:kraakconsulting@gmail.com'),
      ).toBe(true);
      expect(links.some((link) => link.href === 'tel:+2250502741818')).toBe(
        true,
      );
    });

    it('When displayed, Then it explains retention, analytics, and consent boundaries', () => {
      const text = fixture.nativeElement.textContent ?? '';

      expect(text).toContain('3 ans');
      expect(text).toContain('Google Analytics 4');
      expect(text).toContain('PUBLIC_GA4_ID');
      expect(text).toContain('aucun cookie publicitaire');
      expect(text).toContain('consentez à ce que KRAAK Consulting utilise');
    });
  });
});
