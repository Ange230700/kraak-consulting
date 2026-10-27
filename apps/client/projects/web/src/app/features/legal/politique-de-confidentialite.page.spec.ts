import { ApplicationInitStatus } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { KraakI18nService, provideKraakI18n } from '../../../../../shared/i18n';
import PolitiqueDeConfidentialitePage from './politique-de-confidentialite.page';

describe('PolitiqueDeConfidentialitePage', () => {
  let fixture: ComponentFixture<PolitiqueDeConfidentialitePage>;

  beforeEach(async () => {
    globalThis.window.localStorage.setItem('kraak:locale', 'fr-CI');

    await TestBed.configureTestingModule({
      imports: [PolitiqueDeConfidentialitePage],
      providers: [provideRouter([]), provideKraakI18n()],
    }).compileComponents();

    await TestBed.inject(ApplicationInitStatus).donePromise;
    await TestBed.inject(KraakI18nService).setLocale('fr-CI');

    fixture = TestBed.createComponent(PolitiqueDeConfidentialitePage);
    fixture.detectChanges();
  });

  describe('Given the politique de confidentialité page is rendered', () => {
    it('When displayed, Then it shows the main heading', () => {
      const h1: HTMLElement = fixture.nativeElement.querySelector('h1');
      expect(h1?.textContent).toContain('Politique de confidentialité');
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

    it('Given the English locale When rendered Then privacy policy copy is localized', async () => {
      await TestBed.inject(KraakI18nService).setLocale('en-GB');
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent ?? '';

      expect(text).toContain('Privacy policy');
      expect(text).toContain('Data controller');
      expect(text).toContain('Data we collect');
      expect(text).toContain('Purposes and legal bases');
      expect(text).toContain('Consent when contacting us');
      expect(text).toContain('Data sharing');
      expect(text).toContain('Retention period');
      expect(text).toContain('Your rights');
      expect(text).toContain('Cookies and audience measurement');
      expect(text).toContain('Hosting and technical transfers');
      expect(text).toContain('Limits on sensitive requests');

      expect(text).toContain('3 years');
      expect(text).toContain('Google Analytics 4');
      expect(text).toContain('PUBLIC_GA4_ID');
      expect(text).toContain('does not sell your personal data');

      expect(text).not.toContain('Politique de confidentialité');
      expect(text).not.toContain('Données collectées');
      expect(text).not.toContain('Durée de conservation');
      expect(text).not.toContain('Vos droits');
    });
  });
});
