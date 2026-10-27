import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import ResourcesPage from './resources.page';

import { KraakI18nService, provideKraakI18n } from '../../../../../shared/i18n';

describe('ResourcesPage', () => {
  beforeEach(async () => {
    globalThis.window.localStorage.setItem('kraak:locale', 'fr-CI');

    await TestBed.configureTestingModule({
      imports: [ResourcesPage],
      providers: [provideRouter([]), provideKraakI18n()],
    }).compileComponents();

    await TestBed.inject(ApplicationInitStatus).donePromise;
    await TestBed.inject(KraakI18nService).setLocale('fr-CI');
  });

  it('Given the resources page When the component is created Then the instance exists', () => {
    const fixture = TestBed.createComponent(ResourcesPage);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given the resources page When it renders Then it states that the route is an orientation page and not a news hub', () => {
    const fixture = TestBed.createComponent(ResourcesPage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain(
      "Ressources d'orientation pour clarifier votre prochaine étape",
    );
    expect(element.textContent).toContain(
      "Cette page n'est pas un hub d'actualités ou une bibliothèque de contenus",
    );
  });

  it('Given the resources page When it renders Then it keeps the four orientation pillars visible', () => {
    const fixture = TestBed.createComponent(ResourcesPage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Formation');
    expect(element.textContent).toContain('Projet');
    expect(element.textContent).toContain('Immigration');
    expect(element.textContent).toContain('Entreprise');
  });
  it('Given the English locale When the resources page renders Then orientation content and CTA are localized', async () => {
    await TestBed.inject(KraakI18nService).setLocale('en-GB');

    const fixture = TestBed.createComponent(ResourcesPage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const content = element.textContent ?? '';

    expect(content).toContain('Guidance resources to clarify your next step');
    expect(content).toContain('Training');
    expect(content).toContain('Project');
    expect(content).toContain('International mobility');
    expect(content).toContain('Business');
    expect(content).toContain('Need clear guidance?');
    expect(content).toContain('Ask for guidance');

    expect(content).not.toContain(
      "Ressources d'orientation pour clarifier votre prochaine étape",
    );
  });
});
