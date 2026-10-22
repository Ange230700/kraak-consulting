/**
 * Vitest setup file to mock browser APIs required by GSAP and other libraries
 */

import { vi } from 'vitest';

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

  constructor(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    void callback;
    void options;
  }

  disconnect() {
    /* No-op: In tests, we don't need to perform cleanup since the mock isn't tracking real visibility changes */
  }
  observe(target: Element) {
    void target;
    /* No-op: In tests, we don't need to track element visibility; components handle mock responses directly */
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  unobserve(target: Element) {
    void target;
    /* No-op: In tests, there are no real observers to remove; components handle mock responses directly */
  }
};

// Mock requestAnimationFrame for GSAP
globalThis.requestAnimationFrame = (callback: FrameRequestCallback) =>
  Number(setTimeout(() => callback(performance.now()), 0));

// Mock cancelAnimationFrame
globalThis.cancelAnimationFrame = (id: number) => clearTimeout(id);
