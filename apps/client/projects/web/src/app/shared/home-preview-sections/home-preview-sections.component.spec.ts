import { TestBed } from '@angular/core/testing';

import { HomePreviewSections } from './home-preview-sections.component';

describe('HomePreviewSections', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePreviewSections],
    }).compileComponents();
  });

  it('Given the non-production preview wrapper When it renders Then it exposes all home preview blocks', () => {
    const fixture = TestBed.createComponent(HomePreviewSections);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Partenaires et clients de confiance');
    expect(content).toContain('Chiffres d’impact en prévisualisation');
    expect(content).toContain('Prévisualisation du format témoignages');
  });
});
