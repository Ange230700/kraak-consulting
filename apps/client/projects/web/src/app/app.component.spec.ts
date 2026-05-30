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
import { App } from './app.component';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), MessageService],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the app shell with navbar, main, and footer', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('kraak-navbar')).toBeTruthy();
    expect(compiled.querySelector('main')).toBeTruthy();
    expect(compiled.querySelector('kraak-footer')).toBeTruthy();
  });

  it('should expose a skip link and main landmark target for keyboard users', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const skipLink = compiled.querySelector(
      'a[href="#main-content"]',
    ) as HTMLAnchorElement | null;
    const main = compiled.querySelector('main#main-content');

    expect(skipLink?.textContent).toContain('contenu principal');
    expect(main).toBeTruthy();
    expect(main?.getAttribute('tabindex')).toBe('-1');
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
