/**
 * Vitest setup file to mock browser APIs required by GSAP and other libraries
 */

import { afterAll, vi } from 'vitest';

// Mock matchMedia for ScrollTrigger
Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
globalThis.IntersectionObserver = class IntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin = '0px';
  readonly thresholds: readonly number[] = [];

  disconnect() {
    /* No-op: In tests, we don't need to perform cleanup since the mock isn't tracking real visibility changes */
  }
  observe() {
    /* No-op: In tests, we don't need to track element visibility; components handle mock responses directly */
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  unobserve() {
    /* No-op: In tests, there are no real observers to remove; components handle mock responses directly */
  }
};

// Les boucles GSAP doivent être arrêtées avant la destruction du DOM de test.
const animationFrameTimers = new Map<number, ReturnType<typeof setTimeout>>();

globalThis.requestAnimationFrame = (callback: FrameRequestCallback) => {
  const timer = setTimeout(() => {
    animationFrameTimers.delete(Number(timer));
    callback(performance.now());
  }, 0);
  const id = Number(timer);
  animationFrameTimers.set(id, timer);
  return id;
};

globalThis.cancelAnimationFrame = (id: number) => {
  const timer = animationFrameTimers.get(id);
  if (timer !== undefined) {
    clearTimeout(timer);
    animationFrameTimers.delete(id);
  }
};

afterAll(() => {
  for (const timer of animationFrameTimers.values()) {
    clearTimeout(timer);
  }
  animationFrameTimers.clear();
});
