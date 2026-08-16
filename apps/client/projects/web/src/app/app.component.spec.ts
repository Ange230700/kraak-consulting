import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  Event as RouterEvent,
  NavigationEnd,
  Router,
  provideRouter,
} from '@angular/router';
import { MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
import { vi } from 'vitest';
import { KraakI18nService, provideKraakI18n } from '../../../shared/i18n';
import { App } from './app.component';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideKraakI18n(), MessageService],
    }).compileComponents();

    await TestBed.inject(ApplicationInitStatus).donePromise;
  });

  it('Given the application shell When it is created Then the instance exists', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('Given the application shell When it renders Then it includes the navbar, main content, and footer', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('kraak-navbar')).toBeTruthy();
    expect(compiled.querySelector('main')).toBeTruthy();
    expect(compiled.querySelector('kraak-footer')).toBeTruthy();
  });

  it('Given a keyboard user When the application shell renders Then it exposes a skip link and main landmark target', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const skipLink = compiled.querySelector(
      'a.kr-skip-link',
    ) as HTMLAnchorElement | null;
    const main = compiled.querySelector('main#main-content');

    expect(skipLink).not.toBeNull();
    expect(skipLink?.classList).toContain('kr-skip-link');
    expect(main).toBeTruthy();
    expect(main?.getAttribute('tabindex')).toBe('-1');
  });

  it('Given the French public shell When it renders Then the skip link uses the French catalog copy', async () => {
    await TestBed.inject(KraakI18nService).setLocale('fr-CI');

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const skipLink = fixture.nativeElement.querySelector(
      'a.kr-skip-link',
    ) as HTMLAnchorElement | null;

    expect(skipLink?.textContent?.trim()).toBe('Aller au contenu principal');
  });

  it('Given the English public shell When it renders Then the skip link uses the English catalog copy', async () => {
    await TestBed.inject(KraakI18nService).setLocale('en-GB');

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const skipLink = fixture.nativeElement.querySelector(
      'a.kr-skip-link',
    ) as HTMLAnchorElement | null;

    expect(skipLink?.textContent?.trim()).toBe('Skip to main content');
  });

  it('Given an English URL with a query and fragment When the skip link is activated Then it focuses main content without leaving the current page', () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'url', 'get').mockReturnValue(
      '/en/?campaign=shell#previous',
    );

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const skipLink = fixture.nativeElement.querySelector(
      'a.kr-skip-link',
    ) as HTMLAnchorElement | null;
    const main = fixture.nativeElement.querySelector(
      'main#main-content',
    ) as HTMLElement | null;
    const focusSpy = vi.spyOn(main as HTMLElement, 'focus');
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });

    skipLink?.dispatchEvent(clickEvent);

    expect(skipLink?.getAttribute('href')).toBe('#main-content');
    expect(clickEvent.defaultPrevented).toBe(true);
    expect(focusSpy).toHaveBeenCalledOnce();
    expect(router.url).toBe('/en/?campaign=shell#previous');
  });

  it('Given un environnement SSR simulé, When ngOnInit est appelé, Then le composant retourne sans souscrire aux événements du routeur', () => {
    const fixture = TestBed.createComponent(App);
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    const originalWindowDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      'window',
    );

    Object.defineProperty(globalThis, 'window', {
      value: undefined,
      configurable: true,
    });

    try {
      const routerEventsSpy = vi.spyOn(router, 'events', 'get');
      component.ngOnInit();
      expect(routerEventsSpy).not.toHaveBeenCalled();
    } finally {
      if (originalWindowDescriptor) {
        Object.defineProperty(globalThis, 'window', originalWindowDescriptor);
      }
    }
  });

  it('Given un événement NavigationEnd, When ngOnInit écoute les événements, Then la page revient en haut en scroll fluide', () => {
    const fixture = TestBed.createComponent(App);
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    const routerEvents$ = new Subject<RouterEvent>();

    vi.spyOn(router, 'events', 'get').mockReturnValue(
      routerEvents$.asObservable(),
    );
    const scrollToSpy = vi.spyOn(globalThis.window, 'scrollTo');

    component.ngOnInit();
    routerEvents$.next(new NavigationEnd(1, '/debut', '/cible'));

    expect(scrollToSpy).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  });
});
