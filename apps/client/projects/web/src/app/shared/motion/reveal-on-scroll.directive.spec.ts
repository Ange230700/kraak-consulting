import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { RevealOnScrollDirective } from './reveal-on-scroll.directive';

let observedElement: Element | null = null;
let observerCallback: IntersectionObserverCallback | null = null;

class MockIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    observerCallback = callback;
  }

  observe(target: Element): void {
    observedElement = target;
  }

  unobserve(): void {
    observedElement = null;
  }

  disconnect(): void {
    observerCallback = null;
  }
}

@Component({
  standalone: true,
  imports: [RevealOnScrollDirective],
  template: `
    <section
      id="target"
      kraakRevealOnScroll
      [revealDelayMs]="40"
      [revealOnce]="revealOnce"
    ></section>
  `,
})
class HostComponent {
  revealOnce = true;
}

describe('RevealOnScrollDirective', () => {
  it('Given un element avec la directive, When il est initialise, Then la classe de base est appliquee avec le delai', async () => {
    const originalObserver = globalThis.IntersectionObserver;
    (
      globalThis as { IntersectionObserver: typeof IntersectionObserver }
    ).IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;

    try {
      await TestBed.configureTestingModule({
        imports: [HostComponent],
      }).compileComponents();

      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();

      const target = fixture.nativeElement.querySelector(
        '#target',
      ) as HTMLElement;

      expect(target.classList.contains('motion-reveal-base')).toBe(true);
      expect(target.style.transitionDelay).toBe('40ms');
      expect(observedElement).toBe(target);
    } finally {
      if (originalObserver) {
        (
          globalThis as { IntersectionObserver: typeof IntersectionObserver }
        ).IntersectionObserver = originalObserver;
      }
    }
  });

  it('Given une intersection visible, When le callback observer est execute, Then la classe visible est appliquee', async () => {
    const originalObserver = globalThis.IntersectionObserver;
    (
      globalThis as { IntersectionObserver: typeof IntersectionObserver }
    ).IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;

    try {
      await TestBed.configureTestingModule({
        imports: [HostComponent],
      }).compileComponents();

      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();

      const target = fixture.nativeElement.querySelector(
        '#target',
      ) as HTMLElement;
      const callback = observerCallback;

      expect(callback).toBeTruthy();

      callback?.(
        [
          {
            isIntersecting: true,
            target,
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      );

      expect(target.classList.contains('motion-reveal-visible')).toBe(true);
    } finally {
      if (originalObserver) {
        (
          globalThis as { IntersectionObserver: typeof IntersectionObserver }
        ).IntersectionObserver = originalObserver;
      }

      observedElement = null;
      observerCallback = null;
    }
  });
});
