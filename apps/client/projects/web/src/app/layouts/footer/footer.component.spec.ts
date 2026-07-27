import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Footer } from './footer.component';

interface FooterAnimationInternals {
  activateFooterAnimations: () => void;
  handleScroll: () => void;
}

describe('Footer', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Footer],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Given the footer is rendered, When it enters the viewport, Then both animation classes are activated and the scroll listener is cleaned', () => {
    const addListenerSpy = vi.spyOn(globalThis.window, 'addEventListener');
    const removeListenerSpy = vi.spyOn(
      globalThis.window,
      'removeEventListener',
    );
    const fixture = TestBed.createComponent(Footer);

    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const fadeRightElement = element.querySelector('.kr-footer-fade-right');
    const fadeLeftElement = element.querySelector('.kr-footer-fade-left');

    expect(addListenerSpy).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function),
      { passive: true },
    );
    expect(fadeRightElement?.classList).toContain(
      'kr-footer-fade-right-visible',
    );
    expect(fadeLeftElement?.classList).toContain('kr-footer-fade-left-visible');
    expect(removeListenerSpy).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function),
    );

    const component =
      fixture.componentInstance as unknown as FooterAnimationInternals;
    component.handleScroll();

    expect(removeListenerSpy).toHaveBeenCalledTimes(1);
  });

  it('Given the footer remains below the viewport, When the scroll handler runs, Then animations stay pending', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      bottom: 1_200,
      height: 300,
      left: 0,
      right: 0,
      top: 1_000,
      width: 1_000,
      x: 0,
      y: 1_000,
      toJSON: () => ({}),
    });
    const removeListenerSpy = vi.spyOn(
      globalThis.window,
      'removeEventListener',
    );
    const fixture = TestBed.createComponent(Footer);

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(
      element
        .querySelector('.kr-footer-fade-right')
        ?.classList.contains('kr-footer-fade-right-visible'),
    ).toBe(false);
    expect(
      element
        .querySelector('.kr-footer-fade-left')
        ?.classList.contains('kr-footer-fade-left-visible'),
    ).toBe(false);
    expect(removeListenerSpy).not.toHaveBeenCalled();
  });

  it('Given the view child is unavailable, When view initialization and animation activation run, Then no scroll listener is registered and no error is thrown', () => {
    const addListenerSpy = vi.spyOn(globalThis.window, 'addEventListener');
    const fixture = TestBed.createComponent(Footer);
    const component = fixture.componentInstance;
    const animationInternals =
      fixture.componentInstance as unknown as FooterAnimationInternals;

    expect(() => component.ngAfterViewInit()).not.toThrow();
    expect(() => animationInternals.handleScroll()).not.toThrow();
    expect(() => animationInternals.activateFooterAnimations()).not.toThrow();
    expect(addListenerSpy).not.toHaveBeenCalledWith(
      'scroll',
      expect.any(Function),
      expect.anything(),
    );
  });

  it('Given the browser window is unavailable, When the footer is destroyed, Then cleanup exits without accessing the listener API', () => {
    const windowGetterSpy = vi
      .spyOn(globalThis, 'window', 'get')
      .mockImplementation(
        () => undefined as unknown as Window & typeof globalThis,
      );
    const fixture = TestBed.createComponent(Footer);

    expect(() => fixture.componentInstance.ngOnDestroy()).not.toThrow();

    windowGetterSpy.mockRestore();
  });
});
