import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { ScrollToTop } from './scroll-to-top.component';

describe('ScrollToTop', () => {
  let component: ScrollToTop;
  let fixture: ComponentFixture<ScrollToTop>;
  let debugElement: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScrollToTop],
    }).compileComponents();

    fixture = TestBed.createComponent(ScrollToTop);
    component = fixture.componentInstance;
    debugElement = fixture.debugElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('Given the component is created When Angular instantiates it Then the instance should exist', () => {
      expect(component).toBeTruthy();
    });

    it('Given the component renders When the DOM is inspected Then it should display a button', () => {
      const button = debugElement.nativeElement.querySelector('button');
      expect(button).toBeTruthy();
    });

    it('Given the scroll button renders When accessibility attributes are inspected Then it should expose an aria label', () => {
      const button = debugElement.nativeElement.querySelector('button');
      expect(button?.getAttribute('aria-label')).toBeTruthy();
    });
  });

  describe('Visibility', () => {
    it('Given the page is at the top When the component renders Then it should initially hide the button', () => {
      const button = debugElement.nativeElement.querySelector('button');
      expect(button?.classList.contains('opacity-0')).toBe(true);
      expect(button?.classList.contains('pointer-events-none')).toBe(true);
    });
  });

  describe('Scroll to top functionality', () => {
    it('Given the scroll button is activated When scrollToTop runs Then it should scroll smoothly to the top', () => {
      const scrollToSpy = vi.spyOn(globalThis, 'scrollTo');

      component.scrollToTop();

      expect(scrollToSpy).toHaveBeenCalledWith({
        top: 0,
        left: 0,
        behavior: 'smooth',
      });

      scrollToSpy.mockRestore();
    });

    it('Given a non-browser environment, when scrollToTop is called, then it exits without scrolling', () => {
      const scrollToSpy = vi.spyOn(globalThis, 'scrollTo');
      Object.defineProperty(component, 'isBrowser', {
        value: false,
        configurable: true,
      });

      component.scrollToTop();

      expect(scrollToSpy).not.toHaveBeenCalled();
    });

    it('Given the page emits a scroll event When the listener runs Then it should update visibility', () => {
      const updateVisibilitySpy = vi.spyOn(component, 'updateVisibility');

      // Simulate scroll event
      globalThis.dispatchEvent(new Event('scroll'));

      expect(updateVisibilitySpy).toHaveBeenCalled();

      updateVisibilitySpy.mockRestore();
    });

    it('Given the scroll position is past the threshold When visibility updates Then the button should be visible', () => {
      // Mock globalThis.scrollY
      Object.defineProperty(globalThis, 'scrollY', {
        writable: true,
        configurable: true,
        value: 500,
      });

      component.updateVisibility();

      expect(component.isVisible).toBe(true);
    });

    it('Given the scroll position is before the threshold When visibility updates Then the button should be hidden', () => {
      Object.defineProperty(globalThis, 'scrollY', {
        writable: true,
        configurable: true,
        value: 100,
      });

      component.updateVisibility();

      expect(component.isVisible).toBe(false);
    });
  });

  describe('Lifecycle', () => {
    it('Given the component initializes in a browser When ngOnInit runs Then it should attach a scroll listener', () => {
      const addEventListenerSpy = vi.spyOn(globalThis, 'addEventListener');

      component.ngOnInit();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
      );

      addEventListenerSpy.mockRestore();
    });

    it('Given a non-browser environment, when ngOnInit runs, then no listener is attached', () => {
      const addEventListenerSpy = vi.spyOn(globalThis, 'addEventListener');
      Object.defineProperty(component, 'isBrowser', {
        value: false,
        configurable: true,
      });

      component.ngOnInit();

      expect(addEventListenerSpy).not.toHaveBeenCalled();
    });

    it('Given a scroll listener is registered When ngOnDestroy runs Then it should remove the listener', () => {
      const removeEventListenerSpy = vi.spyOn(
        globalThis,
        'removeEventListener',
      );

      component.ngOnDestroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
      );

      removeEventListenerSpy.mockRestore();
    });

    it('Given no scroll listener is registered When ngOnDestroy runs Then it should not remove a listener', () => {
      const removeEventListenerSpy = vi.spyOn(
        globalThis,
        'removeEventListener',
      );
      component['scrollListener'] = null;

      component.ngOnDestroy();

      expect(removeEventListenerSpy).not.toHaveBeenCalled();

      removeEventListenerSpy.mockRestore();
    });
  });
});
