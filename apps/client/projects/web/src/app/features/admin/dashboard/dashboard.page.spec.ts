import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { GsapAnimationsService } from '../../../core/animations/gsap-animations.service';
import {
  KraakI18nService,
  provideKraakI18n,
} from '../../../../../../shared/i18n';
import DashboardPage, { buildContentSnapshots } from './dashboard.page';

const gsapAnimationsServiceMock: Pick<
  GsapAnimationsService,
  | 'animatePageIn'
  | 'initializeFigureAnimations'
  | 'initializeInteractiveCardAnimations'
  | 'initializeButtonTransitions'
  | 'initializeSectionAnimations'
  | 'killAllAnimations'
> = {
  animatePageIn: () => undefined,
  initializeFigureAnimations: () => undefined,
  initializeInteractiveCardAnimations: () => undefined,
  initializeButtonTransitions: () => undefined,
  initializeSectionAnimations: () => undefined,
  killAllAnimations: () => undefined,
};

describe('DashboardPage', () => {
  beforeEach(async () => {
    globalThis.window.localStorage.setItem('kraak:locale', 'fr-CI');
    await TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [
        provideKraakI18n(),
        provideRouter([]),
        {
          provide: GsapAnimationsService,
          useValue: gsapAnimationsServiceMock,
        },
      ],
    }).compileComponents();

    await TestBed.inject(ApplicationInitStatus).donePromise;
    await TestBed.inject(KraakI18nService).setLocale('fr-CI');
  });
  it('Given aucun article publié, When les indicateurs éditoriaux sont calculés, Then les compteurs sont nuls et la date reste explicitement indisponible', () => {
    expect(buildContentSnapshots([]).map((snapshot) => snapshot.value)).toEqual(
      ['0', '0', 'N/A'],
    );
  });

  it('Given the admin dashboard component When it is created Then the instance exists', () => {
    const fixture = TestBed.createComponent(DashboardPage);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given the admin dashboard When it renders Then it shows programs, content and actions', () => {
    const fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain(
      'Tableau de bord admin pour les programmes et les contenus.',
    );
    expect(content).toContain('Programmes');
    expect(content).toContain('Contenus');
    expect(content).toContain('Actions rapides');
    expect(content).toContain('Formation');
    expect(content).toContain('Voir le blog public');
    expect(content).toContain('Gérer le curriculum');
  });

  it('Given English locale, When the dashboard renders, Then it renders admin-owned Dashboard chrome in English', async () => {
    const i18n = TestBed.inject(KraakI18nService);
    await TestBed.inject(ApplicationInitStatus).donePromise;
    await i18n.setLocale('en-GB');

    const fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Admin dashboard for programmes and content.');
    expect(text).toContain('Open public blog');
    expect(text).toContain('Review programmes');

    expect(text).toContain('Published articles');
    expect(text).toContain('Featured articles');
    expect(text).toContain('Last updated');

    expect(text).toContain('Training');
    expect(text).toContain('High priority');
    expect(text).toContain('Project management');
    expect(text).toContain('Needs consolidation');
    expect(text).toContain('Immigration consulting');
    expect(text).toContain('Stable oversight');

    expect(text).toContain('Content');
    expect(text).toContain('Quick actions');
    expect(text).toContain('Manage curriculum');
    expect(text).toContain('View public blog');
    expect(text).toContain('Follow up on contacts');
  });
  it('Given English locale, When public dashboard links and recent content render, Then they preserve English public routing and editorial data', async () => {
    await TestBed.inject(ApplicationInitStatus).donePromise;
    await TestBed.inject(KraakI18nService).setLocale('en-GB');

    const fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    const text = page.textContent ?? '';
    const hrefs = Array.from(page.querySelectorAll('a')).map((anchor) =>
      anchor.getAttribute('href'),
    );

    expect(text).toContain('Clarify your project before applying');
    expect(text).not.toContain('Clarifier son projet avant de candidater');

    expect(hrefs).toContain('/en/blog');
    expect(hrefs).toContain('/en/contact');

    expect(hrefs).not.toContain('/blog');
    expect(hrefs).not.toContain('/contact');
    expect(hrefs).not.toContain('/programmes');
  });
});
