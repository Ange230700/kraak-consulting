import { TestBed } from '@angular/core/testing';

import { Testimonials } from './testimonials';

describe('Testimonials', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Testimonials],
    }).compileComponents();
  });

  it('Given aucun item et placeholder actif, When le composant est rendu, Then le message d attente est affiché', () => {
    const fixture = TestBed.createComponent(Testimonials);
    fixture.componentRef.setInput('items', []);
    fixture.componentRef.setInput('placeholder', true);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Témoignages');
  });

  it('Given aucun item et placeholder désactivé, When le composant est rendu, Then rien n est affiché', () => {
    const fixture = TestBed.createComponent(Testimonials);
    fixture.componentRef.setInput('items', []);
    fixture.componentRef.setInput('placeholder', false);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent?.trim();
    expect(text).toBe('');
  });

  it('Given des témoignages avec rôle, When le composant est rendu, Then auteur et rôle sont affichés', () => {
    const fixture = TestBed.createComponent(Testimonials);
    fixture.componentRef.setInput('items', [
      { quote: 'Super formation', author: 'Alice', role: 'Chef de projet' },
    ]);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Alice');
    expect(text).toContain('Chef de projet');
    expect(text).toContain('Super formation');
  });

  it('Given des témoignages sans rôle, When le composant est rendu, Then seul l auteur est affiché', () => {
    const fixture = TestBed.createComponent(Testimonials);
    fixture.componentRef.setInput('items', [
      { quote: 'Excellent accompagnement', author: 'Bob' },
    ]);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Bob');
    expect(text).toContain('Excellent accompagnement');
    const spans = (fixture.nativeElement as HTMLElement).querySelectorAll(
      'span.text-sm',
    );
    expect(spans.length).toBe(0);
  });
});
