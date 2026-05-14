import { TestBed } from '@angular/core/testing';

import { AboutPreviewSections } from './about-preview-sections.component';

describe('AboutPreviewSections', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutPreviewSections],
    }).compileComponents();
  });

  it('Given the non-production about preview wrapper When it renders Then it exposes the team preview block', () => {
    const fixture = TestBed.createComponent(AboutPreviewSections);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain("Prévisualisation de l'équipe KRAAK");
    expect(content).toContain('Savannah Nguyen');
  });
});
