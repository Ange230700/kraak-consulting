/**
 * Vitest setup file to mock browser APIs required by GSAP and other libraries
 */

import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

try {
  TestBed.initTestEnvironment(
    BrowserDynamicTestingModule,
    platformBrowserDynamicTesting(),
  );
} catch (error) {
  if (
    !(error instanceof Error) ||
    !error.message.includes(
      'Cannot set base providers because it has already been called',
    )
  ) {
    throw error;
  }

  console.warn(
    '[vitest.setup] Angular TestBed was already initialized; reusing the existing test environment.',
  );
}

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
globalThis.IntersectionObserver = class IntersectionObserver {
  disconnect() {
    /* No-op: In tests, we don't need to perform cleanup since the mock isn't tracking real visibility changes */
  }
  observe() {
    /* No-op: In tests, we don't need to track element visibility; components handle mock responses directly */
  }
  takeRecords() {
    return [];
  }
  unobserve() {
    /* No-op: In tests, there are no real observers to remove; components handle mock responses directly */
  }
} as any;

// Mock requestAnimationFrame for GSAP
globalThis.requestAnimationFrame = (callback: FrameRequestCallback) =>
  setTimeout(callback, 0) as any;

// Mock cancelAnimationFrame
globalThis.cancelAnimationFrame = (id: number) => clearTimeout(id);
