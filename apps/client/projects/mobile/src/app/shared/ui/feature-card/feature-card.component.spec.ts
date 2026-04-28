import { TestBed } from '@angular/core/testing';
import { describe, beforeEach, expect, it } from 'vitest';
import { FeatureCardComponent } from './feature-card.component';

describe('FeatureCardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureCardComponent],
    }).compileComponents();
  });

  it('Given un tone accent When on rend la carte Then elle applique les classes accent', () => {
    const fixture = TestBed.createComponent(FeatureCardComponent);
    fixture.componentRef.setInput('title', 'Ressources');
    fixture.componentRef.setInput('description', 'Contenus utiles');
    fixture.componentRef.setInput('tone', 'accent');
    fixture.detectChanges();

    const article = fixture.nativeElement.querySelector('article');

    expect(article.className).toContain('kraak-surface-card');
    expect(article.className).toContain('border-brand-cyan/18');
  });

  it('Given un tag When on rend la carte Then le tag est visible', () => {
    const fixture = TestBed.createComponent(FeatureCardComponent);
    fixture.componentRef.setInput('title', 'Formation');
    fixture.componentRef.setInput('description', 'Cadre clair');
    fixture.componentRef.setInput('tag', 'Parcours');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Parcours');
  });
});
