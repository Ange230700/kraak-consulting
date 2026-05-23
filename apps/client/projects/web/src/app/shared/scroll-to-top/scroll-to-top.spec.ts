import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { ScrollToTop } from './scroll-to-top';

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
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should render a button', () => {
      const button = debugElement.nativeElement.querySelector('button');
      expect(button).toBeTruthy();
    });

    it('should have aria-label for accessibility', () => {
      const button = debugElement.nativeElement.querySelector('button');
      expect(button?.getAttribute('aria-label')).toBeTruthy();
    });
  });

  describe('Visibility', () => {
    it('should initially hide the button when page is at the top', () => {
      const button = debugElement.nativeElement.querySelector('button');
      expect(button?.classList.contains('opacity-0')).toBe(true);
      expect(button?.classList.contains('pointer-events-none')).toBe(true);
    });
  });

  describe('Scroll to top functionality', () => {
    it('should scroll to top when button is clicked', () => {
      const scrollToSpy = vi.spyOn(window, 'scrollTo');

      component.scrollToTop();

      expect(scrollToSpy).toHaveBeenCalledWith({
        top: 0,
        left: 0,
        behavior: 'smooth',
      });

      scrollToSpy.mockRestore();
    });

    it('should update visibility on window scroll', () => {
      const updateVisibilitySpy = vi.spyOn(component, 'updateVisibility');

      // Simulate scroll event
      window.dispatchEvent(new Event('scroll'));

      expect(updateVisibilitySpy).toHaveBeenCalled();

      updateVisibilitySpy.mockRestore();
    });

    it('should set isVisible to true when scrollY > threshold', () => {
      // Mock window.scrollY
      Object.defineProperty(window, 'scrollY', {
        writable: true,
        configurable: true,
        value: 500,
      });

      component.updateVisibility();

      expect(component.isVisible).toBe(true);
    });

    it('should set isVisible to false when scrollY < threshold', () => {
      Object.defineProperty(window, 'scrollY', {
        writable: true,
        configurable: true,
        value: 100,
      });

      component.updateVisibility();

      expect(component.isVisible).toBe(false);
    });
  });

  describe('Lifecycle', () => {
    it('should attach scroll listener on init', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      component.ngOnInit();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
      );

      addEventListenerSpy.mockRestore();
    });

    it('should remove scroll listener on destroy', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      component.ngOnDestroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
      );

      removeEventListenerSpy.mockRestore();
    });
  });
});
