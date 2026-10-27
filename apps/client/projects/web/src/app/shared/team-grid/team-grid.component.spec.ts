import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { TeamGrid } from './team-grid.component';

import { KraakI18nService, provideKraakI18n } from '../../../../../shared/i18n';

describe('TeamGrid', () => {
  beforeEach(async () => {
    globalThis.window.localStorage.setItem('kraak:locale', 'fr-CI');

    await TestBed.configureTestingModule({
      imports: [TeamGrid],
      providers: [provideRouter([]), provideKraakI18n()],
    }).compileComponents();

    await TestBed.inject(ApplicationInitStatus).donePromise;
    await TestBed.inject(KraakI18nService).setLocale('fr-CI');
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
        name: 'Aminata Traoré',
        role: 'Responsable programme',
        image: '/assets/team/aminata.avif',
      },
    ]);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Aminata Traoré');
    expect(element.textContent).not.toContain('Savannah Nguyen');
    expect(fixture.componentInstance.visibleMembers()).toEqual([
      {
        id: 99,
        name: 'Aminata Traoré',
        role: 'Responsable programme',
        image: '/assets/team/aminata.avif',
      },
    ]);
    expect(fixture.componentInstance.isPreviewMode()).toBe(false);
  });
  it('Given English locale, when preview mode is rendered, then fallback TeamGrid chrome and roles are localized', async () => {
    await TestBed.inject(KraakI18nService).setLocale('en-GB');

    const fixture = TestBed.createComponent(TeamGrid);
    fixture.detectChanges();

    const content = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(content).toContain('KRAAK team preview');
    expect(content).toContain('The KRAAK team');
    expect(content).toContain('Software developer');
    expect(content).toContain('Team lead');
    expect(content).not.toContain('Développeuse logiciel');
  });
});
