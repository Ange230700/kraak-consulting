import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { TeamGrid } from './team-grid';

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
});
