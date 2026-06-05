import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import MentionsLegalesPage from './mentions-legales.page';

describe('MentionsLegalesPage', () => {
  let fixture: ComponentFixture<MentionsLegalesPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MentionsLegalesPage],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MentionsLegalesPage);
    fixture.detectChanges();
  });

  describe('Given the mentions légales page is rendered', () => {
    it('When displayed, Then it shows the main heading', () => {
      const h1: HTMLElement = fixture.nativeElement.querySelector('h1');
      expect(h1?.textContent).toContain('Mentions légales');
    });

    it('When displayed, Then it includes the editor section', () => {
      const headings: NodeListOf<HTMLElement> =
        fixture.nativeElement.querySelectorAll('h2');
      const texts = Array.from(headings).map((h) =>
        (h.textContent ?? '').toLowerCase(),
      );
      expect(texts.some((t) => t.includes('éditeur'))).toBe(true);
    });

    it('When displayed, Then it includes the hosting section', () => {
      const headings: NodeListOf<HTMLElement> =
        fixture.nativeElement.querySelectorAll('h2');
      const texts = Array.from(headings).map((h) =>
        (h.textContent ?? '').toLowerCase(),
      );
      expect(texts.some((t) => t.includes('hébergement'))).toBe(true);
    });

    it('When displayed, Then it states the current legal status and public contact channels', () => {
      const text = fixture.nativeElement.textContent ?? '';
      const links: HTMLAnchorElement[] = Array.from(
        fixture.nativeElement.querySelectorAll('a'),
      );

      expect(text).toContain("structure en cours d'immatriculation");
      expect(text).toContain('kraakconsulting@gmail.com');
      expect(text).toContain('+225 05 02 74 18 18');
      expect(
        links.some((link) => link.href === 'mailto:kraakconsulting@gmail.com'),
      ).toBe(true);
      expect(links.some((link) => link.href === 'tel:+2250502741818')).toBe(
        true,
      );
      expect(
        links.some((link) => link.href === 'https://wa.me/2250502741818'),
      ).toBe(true);
    });
  });
});
