/**
 * Vitest setup file to mock browser APIs required by GSAP and other libraries
 */

// Mock matchMedia for ScrollTrigger
Object.defineProperty(window, 'matchMedia', {
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
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock requestAnimationFrame for GSAP
global.requestAnimationFrame = (callback: FrameRequestCallback) =>
  setTimeout(callback, 0) as any;

// Mock cancelAnimationFrame
global.cancelAnimationFrame = (id: number) => clearTimeout(id);
