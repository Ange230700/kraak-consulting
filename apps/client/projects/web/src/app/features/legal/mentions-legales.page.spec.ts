import { ApplicationInitStatus } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { KraakI18nService, provideKraakI18n } from '../../../../../shared/i18n';
import MentionsLegalesPage from './mentions-legales.page';

describe('MentionsLegalesPage', () => {
  let fixture: ComponentFixture<MentionsLegalesPage>;

  beforeEach(async () => {
    globalThis.window.localStorage.setItem('kraak:locale', 'fr-CI');

    await TestBed.configureTestingModule({
      imports: [MentionsLegalesPage],
      providers: [provideRouter([]), provideKraakI18n()],
    }).compileComponents();

    await TestBed.inject(ApplicationInitStatus).donePromise;
    await TestBed.inject(KraakI18nService).setLocale('fr-CI');

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

    it('Given the English locale When rendered Then legal notice copy is localized', async () => {
      await TestBed.inject(KraakI18nService).setLocale('en-GB');
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent ?? '';

      expect(text).toContain('Legal notice');
      expect(text).toContain('Website publisher');
      expect(text).toContain('Publication responsibility');
      expect(text).toContain('Hosting');
      expect(text).toContain('Intellectual property');
      expect(text).toContain('Information and liability');
      expect(text).toContain('Personal data and cookies');
      expect(text).toContain('organisation currently undergoing registration');
      expect(text).toContain('privacy policy');

      expect(text).not.toContain('Mentions légales');
      expect(text).not.toContain('Éditeur du site');
      expect(text).not.toContain('Propriété intellectuelle');
    });
  });
});
