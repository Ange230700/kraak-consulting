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
      const texts = Array.from(headings).map((h) => h.textContent ?? '');
      expect(texts.some((t) => t.includes('diteur'))).toBe(true);
    });

    it('When displayed, Then it includes the hosting section', () => {
      const headings: NodeListOf<HTMLElement> =
        fixture.nativeElement.querySelectorAll('h2');
      const texts = Array.from(headings).map((h) => h.textContent ?? '');
      expect(texts.some((t) => t.includes('bergement'))).toBe(true);
    });
  });
});
