import { TestBed } from '@angular/core/testing';
import { describe, beforeEach, expect, it } from 'vitest';
import { SectionTitleComponent } from './section-title.component';

describe('SectionTitleComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionTitleComponent],
    }).compileComponents();
  });

  it('Given une section title When on renseigne les inputs Then il affiche le contenu', () => {
    const fixture = TestBed.createComponent(SectionTitleComponent);
    fixture.componentRef.setInput('overline', 'D\u00E9couvrir');
    fixture.componentRef.setInput('title', 'Bienvenue sur KRAAK');
    fixture.componentRef.setInput(
      'subtitle',
      'Un accompagnement structur\u00E9.',
    );
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;

    expect(text).toContain('D\u00E9couvrir');
    expect(text).toContain('Bienvenue sur KRAAK');
    expect(text).toContain('Un accompagnement structur\u00E9.');

    const overline = fixture.nativeElement.querySelector('p.kraak-overline');
    const title = fixture.nativeElement.querySelector('h2.kraak-section-title');
    const subtitle = fixture.nativeElement.querySelector(
      'p.kraak-section-subtitle',
    );

    expect(overline).toBeTruthy();
    expect(title).toBeTruthy();
    expect(subtitle).toBeTruthy();
  });
});
