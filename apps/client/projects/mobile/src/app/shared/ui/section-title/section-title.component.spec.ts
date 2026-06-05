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
    fixture.componentRef.setInput('overline', 'Découvrir');
    fixture.componentRef.setInput('title', 'Bienvenue sur KRAAK');
    fixture.componentRef.setInput('subtitle', 'Un accompagnement structuré.');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Découvrir');
    expect(text).toContain('Bienvenue sur KRAAK');
    expect(text).toContain('Un accompagnement structuré.');

    const overline = fixture.nativeElement.querySelector('p.kraak-overline');
    const title = fixture.nativeElement.querySelector('h2.kraak-section-title');
    const subtitle = fixture.nativeElement.querySelector(
      'p.kraak-section-subtitle',
    );

    expect(overline).toBeTruthy();
    expect(title).toBeTruthy();
    expect(subtitle).toBeTruthy();
  });

  it('Given only the required title, when the component renders, then optional overline and subtitle are hidden', () => {
    const fixture = TestBed.createComponent(SectionTitleComponent);
    fixture.componentRef.setInput('title', 'Titre seul');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    const overline = fixture.nativeElement.querySelector('p.kraak-overline');
    const subtitle = fixture.nativeElement.querySelector(
      'p.kraak-section-subtitle',
    );

    expect(text).toContain('Titre seul');
    expect(overline).toBeFalsy();
    expect(subtitle).toBeFalsy();
  });
});
