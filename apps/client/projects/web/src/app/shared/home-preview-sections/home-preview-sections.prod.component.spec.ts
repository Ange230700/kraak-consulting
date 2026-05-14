import { TestBed } from '@angular/core/testing';

import { HomePreviewSections } from './home-preview-sections.prod.component';

describe('HomePreviewSections prod variant', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePreviewSections],
    }).compileComponents();
  });

  it('Given the production preview wrapper When it renders Then it stays empty', () => {
    const fixture = TestBed.createComponent(HomePreviewSections);
    fixture.detectChanges();

    expect((fixture.nativeElement.textContent as string).trim()).toBe('');
  });
});
