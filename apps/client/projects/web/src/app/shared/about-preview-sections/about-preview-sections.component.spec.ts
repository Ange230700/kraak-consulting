import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { KraakI18nService, provideKraakI18n } from '../../../../../shared/i18n';
import { AboutPreviewSections } from './about-preview-sections.component';

describe('AboutPreviewSections', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutPreviewSections],
      providers: [provideKraakI18n()],
    }).compileComponents();

    await TestBed.inject(ApplicationInitStatus).donePromise;
    await TestBed.inject(KraakI18nService).setLocale('fr-CI');
  });

  it('Given the non-production about preview wrapper When it renders Then it exposes the team preview block', () => {
    const fixture = TestBed.createComponent(AboutPreviewSections);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain("Prévisualisation de l'équipe KRAAK");
    expect(content).toContain('Savannah Nguyen');
  });
});
