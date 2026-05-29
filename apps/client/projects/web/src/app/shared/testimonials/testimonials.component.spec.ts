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

  it('Given un seul témoignage, When visibleCards est calculé, Then une seule carte est renvoyée', () => {
    const fixture = TestBed.createComponent(Testimonials);
    fixture.componentRef.setInput('items', [
      {
        id: 1,
        comment: 'Unique',
        name: 'Solo',
        job: 'Coach',
        avatar: buildTestAvatarUrl('solo.png'),
      },
    ]);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component.visibleCards()).toHaveLength(1);
    expect(component.isPreviewMode()).toBe(false);
  });

  it('Given deux témoignages, When getCardStyles est invoqué, Then un style neutre est retourné', () => {
    const fixture = TestBed.createComponent(Testimonials);
    fixture.componentRef.setInput('items', [
      {
        id: 1,
        comment: 'A',
        name: 'A',
        job: 'A',
        avatar: buildTestAvatarUrl('a.png'),
      },
      {
        id: 2,
        comment: 'B',
        name: 'B',
        job: 'B',
        avatar: buildTestAvatarUrl('b.png'),
      },
    ]);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component.visibleCards()).toHaveLength(2);
    expect(component.getCardStyles(0)).toEqual({
      transform: 'rotate(0deg) scale(1)',
      opacity: '1',
    });
  });

  it('Given une animation next active, When getCardStyles est appelé, Then le style animé next est appliqué', () => {
    const fixture = TestBed.createComponent(Testimonials);
    fixture.componentRef.setInput('items', [
      {
        id: 1,
        comment: 'A',
        name: 'A',
        job: 'A',
        avatar: buildTestAvatarUrl('a.png'),
      },
      {
        id: 2,
        comment: 'B',
        name: 'B',
        job: 'B',
        avatar: buildTestAvatarUrl('b.png'),
      },
      {
        id: 3,
        comment: 'C',
        name: 'C',
        job: 'C',
        avatar: buildTestAvatarUrl('c.png'),
      },
    ]);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.isAnimating.set(true);
    component.animationDirection.set('next');

    expect(component.getCardStyles(0)['transform']).toContain(
      'translateX(120px)',
    );
    expect(component.getCardStyles(1)).toEqual({
      transform: 'rotate(0deg) scale(1)',
      opacity: '1',
    });
    expect(component.getCardClasses(2)).toBe('z-10');
    expect(component.getCardClasses(99)).toBe('');
  });

  it('Given une animation prev active, When getCardStyles et visibleCards sont appelés, Then la branche prev est utilisée', () => {
    const fixture = TestBed.createComponent(Testimonials);
    fixture.componentRef.setInput('items', [
      {
        id: 1,
        comment: 'A',
        name: 'A',
        job: 'A',
        avatar: buildTestAvatarUrl('a.png'),
      },
      {
        id: 2,
        comment: 'B',
        name: 'B',
        job: 'B',
        avatar: buildTestAvatarUrl('b.png'),
      },
      {
        id: 3,
        comment: 'C',
        name: 'C',
        job: 'C',
        avatar: buildTestAvatarUrl('c.png'),
      },
    ]);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.currentIndex.set(1);
    component.isAnimating.set(true);
    component.animationDirection.set('prev');

    const prevVisible = component.visibleCards();
    expect(prevVisible.map((item) => item.id)).toEqual([1, 2, 3]);
    expect(component.getCardStyles(1)['transform']).toContain(
      'translateX(-120px)',
    );
  });

  it('Given le composant anime déjà, When nextCard ou prevCard est déclenché, Then l état reste inchangé', () => {
    vi.useFakeTimers();

    const fixture = TestBed.createComponent(Testimonials);
    fixture.componentRef.setInput('items', [
      {
        id: 1,
        comment: 'A',
        name: 'A',
        job: 'A',
        avatar: buildTestAvatarUrl('a.png'),
      },
      {
        id: 2,
        comment: 'B',
        name: 'B',
        job: 'B',
        avatar: buildTestAvatarUrl('b.png'),
      },
      {
        id: 3,
        comment: 'C',
        name: 'C',
        job: 'C',
        avatar: buildTestAvatarUrl('c.png'),
      },
    ]);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.currentIndex.set(1);
    component.isAnimating.set(true);

    component.nextCard();
    component.prevCard();

    vi.advanceTimersByTime(300);
    expect(component.currentIndex()).toBe(1);
    expect(component.isAnimating()).toBe(true);

    vi.useRealTimers();
  });

  it('Given au moins trois témoignages, When prevCard est déclenché, Then l index recule avec gestion circulaire', () => {
    vi.useFakeTimers();

    const fixture = TestBed.createComponent(Testimonials);
    fixture.componentRef.setInput('items', [
      {
        id: 1,
        comment: 'A',
        name: 'A',
        job: 'A',
        avatar: buildTestAvatarUrl('a.png'),
      },
      {
        id: 2,
        comment: 'B',
        name: 'B',
        job: 'B',
        avatar: buildTestAvatarUrl('b.png'),
      },
      {
        id: 3,
        comment: 'C',
        name: 'C',
        job: 'C',
        avatar: buildTestAvatarUrl('c.png'),
      },
    ]);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component.currentIndex()).toBe(0);

    component.prevCard();
    expect(component.animationDirection()).toBe('prev');
    vi.advanceTimersByTime(250);

    expect(component.currentIndex()).toBe(2);
    expect(component.animationDirection()).toBe(null);
    expect(component.isAnimating()).toBe(false);

    vi.useRealTimers();
  });
});
