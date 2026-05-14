import { TestBed } from '@angular/core/testing';

import { AboutPreviewSections } from './about-preview-sections.prod.component';

describe('AboutPreviewSections prod variant', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutPreviewSections],
    }).compileComponents();
  });

  it('Given the production about preview wrapper When it renders Then it stays empty', () => {
    const fixture = TestBed.createComponent(AboutPreviewSections);
    fixture.detectChanges();

    expect((fixture.nativeElement.textContent as string).trim()).toBe('');
  });
});
