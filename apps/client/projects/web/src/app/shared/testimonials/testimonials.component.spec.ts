import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { Testimonials } from './testimonials.component';

const TEST_AVATAR_BASE_URL = 'https://example.com';

function buildTestAvatarUrl(fileName: string): string {
  return `${TEST_AVATAR_BASE_URL}/${fileName}`;
}

describe('Testimonials', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Testimonials],
    }).compileComponents();
  });

  it('Given aucun item et placeholder actif, When le composant est rendu, Then la prévisualisation de stack est affichée', () => {
    const fixture = TestBed.createComponent(Testimonials);
    fixture.componentRef.setInput('items', []);
    fixture.componentRef.setInput('placeholder', true);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Prévisualisation du format témoignages');
    expect(text).toContain('Aïcha K.');
  });

  it('Given aucun item et placeholder désactivé, When le composant est rendu, Then rien n est affiché', () => {
    const fixture = TestBed.createComponent(Testimonials);
    fixture.componentRef.setInput('items', []);
    fixture.componentRef.setInput('placeholder', false);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent?.trim();
    expect(text).toBe('');
  });

  it('Given des témoignages fournis, When le composant est rendu, Then nom et métier sont affichés', () => {
    const fixture = TestBed.createComponent(Testimonials);
    fixture.componentRef.setInput('items', [
      {
        id: 1,
        comment: 'Super formation',
        name: 'Alice',
        job: 'Chef de projet',
        avatar: buildTestAvatarUrl('alice.png'),
      },
      {
        id: 2,
        comment: 'Excellent accompagnement',
        name: 'Bob',
        job: 'Designer',
        avatar: buildTestAvatarUrl('bob.png'),
      },
      {
        id: 3,
        comment: 'Très bon suivi',
        name: 'Chloe',
        job: 'Coach',
        avatar: buildTestAvatarUrl('chloe.png'),
      },
    ]);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Alice');
    expect(text).toContain('Chef de projet');
    expect(text).toContain('Super formation');
  });

  it('Given au moins trois témoignages, When nextCard est déclenché, Then l index courant avance après animation', () => {
    vi.useFakeTimers();

    const fixture = TestBed.createComponent(Testimonials);
    fixture.componentRef.setInput('items', [
      {
        id: 1,
        comment: 'Excellent accompagnement',
        name: 'Bob',
        job: 'Consultant',
        avatar: buildTestAvatarUrl('bob.png'),
      },
      {
        id: 2,
        comment: 'Parcours clair',
        name: 'Nina',
        job: 'Data Analyst',
        avatar: buildTestAvatarUrl('nina.png'),
      },
      {
        id: 3,
        comment: 'Très bon support',
        name: 'Sam',
        job: 'Engineer',
        avatar: buildTestAvatarUrl('sam.png'),
      },
    ]);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component.currentIndex()).toBe(0);

    component.nextCard();
    expect(component.isAnimating()).toBe(true);

    vi.advanceTimersByTime(250);
    expect(component.currentIndex()).toBe(1);
    expect(component.isAnimating()).toBe(false);

    vi.useRealTimers();
  });
});
