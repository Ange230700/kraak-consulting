import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { TeamGrid } from './team-grid.component';

describe('TeamGrid', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamGrid],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('Given preview mode, when the component is rendered, then fallback members are displayed', () => {
    const fixture = TestBed.createComponent(TeamGrid);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain("Prévisualisation de l'équipe KRAAK");
    expect(element.querySelectorAll('article').length).toBeGreaterThan(0);
    expect(element.textContent).toContain('Savannah Nguyen');
  });

  it('Given placeholder is disabled and no members are provided, when rendered, then the section is hidden', () => {
    const fixture = TestBed.createComponent(TeamGrid);
    fixture.componentRef.setInput('placeholder', false);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('section')).toBeNull();
  });

  it('Given explicit team members, when the component is rendered, then provided members are displayed instead of fallback content', () => {
    const fixture = TestBed.createComponent(TeamGrid);
    fixture.componentRef.setInput('members', [
      {
        id: 99,
        name: 'Aminata Traore',
        role: 'Responsable programme',
        image: '/assets/team/aminata.avif',
      },
    ]);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Aminata Traore');
    expect(element.textContent).not.toContain('Savannah Nguyen');
    expect(fixture.componentInstance.visibleMembers()).toEqual([
      {
        id: 99,
        name: 'Aminata Traore',
        role: 'Responsable programme',
        image: '/assets/team/aminata.avif',
      },
    ]);
    expect(fixture.componentInstance.isPreviewMode()).toBe(false);
  });
});
