import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';

import { AnalyticsService, GA4_MEASUREMENT_ID } from './analytics.service';

interface GtagWindow {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
}

function getWindow(): GtagWindow {
  return globalThis as unknown as GtagWindow;
}

function resetGtagGlobals(): void {
  const w = getWindow();
  delete w.dataLayer;
  delete w.gtag;
  document.head
    .querySelectorAll('script[data-kraak-analytics]')
    .forEach((node) => node.remove());
}

function setupAnalyticsTestBed(measurementId: string): {
  router: { events: Subject<NavigationEnd> };
} {
  const events = new Subject<NavigationEnd>();
  const routerStub = { events: events.asObservable() } as unknown as Router;

  TestBed.configureTestingModule({
    providers: [
      AnalyticsService,
      { provide: GA4_MEASUREMENT_ID, useValue: measurementId },
      { provide: Router, useValue: routerStub },
      { provide: DOCUMENT, useValue: document },
    ],
  });

  return { router: { events } };
}

describe('AnalyticsService', () => {
  beforeEach(() => {
    resetGtagGlobals();
  });

  afterEach(() => {
    resetGtagGlobals();
    vi.restoreAllMocks();
  });

  // Given un identifiant GA4 vide (analytics non configur\u00E9 pour cet environnement)
  // When le service est initialis\u00E9
  // Then aucun script Google Analytics n'est inject\u00E9 et aucun appel gtag n'est \u00E9mis
  it("ne doit rien injecter quand l'identifiant GA4 est absent", () => {
    setupAnalyticsTestBed('');

    const service = TestBed.inject(AnalyticsService);
    service.initialize();

    expect(
      document.head.querySelector('script[data-kraak-analytics="loader"]'),
    ).toBeNull();
    expect(getWindow().gtag).toBeUndefined();
    expect(service.isEnabled()).toBe(false);
  });

  // Given un identifiant GA4 valide
  // When le service est initialis\u00E9
  // Then le loader gtag.js est inject\u00E9 et la configuration de base est pos\u00E9e
  it("doit injecter le loader gtag.js et configurer GA4 quand l'identifiant est fourni", () => {
    setupAnalyticsTestBed('G-ABC123');

    const service = TestBed.inject(AnalyticsService);
    service.initialize();

    const loader = document.head.querySelector<HTMLScriptElement>(
      'script[data-kraak-analytics="loader"]',
    );
    expect(loader).not.toBeNull();
    expect(loader?.src).toContain('googletagmanager.com/gtag/js?id=G-ABC123');
    expect(loader?.async).toBe(true);

    const win = getWindow();
    expect(Array.isArray(win.dataLayer)).toBe(true);
    expect(typeof win.gtag).toBe('function');
    expect(service.isEnabled()).toBe(true);
  });

  // Given le service initialis\u00E9 deux fois
  // When la deuxi\u00E8me initialisation est demand\u00E9e
  // Then aucun loader suppl\u00E9mentaire n'est inject\u00E9
  it('ne doit pas r\u00E9injecter le loader si initialize() est appel\u00E9 deux fois', () => {
    setupAnalyticsTestBed('G-ABC123');
    const service = TestBed.inject(AnalyticsService);

    service.initialize();
    service.initialize();

    expect(
      document.head.querySelectorAll('script[data-kraak-analytics="loader"]'),
    ).toHaveLength(1);
  });

  // Given le service activ\u00E9
  // When le router \u00E9met une navigation termin\u00E9e
  // Then un \u00E9v\u00E8nement page_view est envoy\u00E9 \u00E0 GA4 avec le chemin courant
  it('doit envoyer un \u00E9v\u00E8nement page_view sur chaque NavigationEnd', () => {
    const { router } = setupAnalyticsTestBed('G-ABC123');
    const service = TestBed.inject(AnalyticsService);
    service.initialize();

    const calls: unknown[][] = [];
    getWindow().gtag = (...args: unknown[]) => {
      calls.push(args);
    };

    router.events.next(new NavigationEnd(1, '/services', '/services'));

    const pageViewCall = calls.find(
      (args) => args[0] === 'event' && args[1] === 'page_view',
    );
    expect(pageViewCall).toBeDefined();
    const params = pageViewCall?.[2] as Record<string, unknown> | undefined;
    expect(params?.['page_path']).toBe('/services');
  });

  // Given un identifiant GA4 absent
  // When le router \u00E9met une navigation termin\u00E9e
  // Then aucun \u00E9v\u00E8nement n'est envoy\u00E9
  it("ne doit envoyer aucun page_view quand l'analytics est d\u00E9sactiv\u00E9", () => {
    const { router } = setupAnalyticsTestBed('');
    const service = TestBed.inject(AnalyticsService);
    service.initialize();

    let called = false;
    getWindow().gtag = () => {
      called = true;
    };

    router.events.next(new NavigationEnd(1, '/services', '/services'));

    expect(called).toBe(false);
  });

  // Given le service activ\u00E9
  // When trackEvent est appel\u00E9 avec un nom et des param\u00E8tres
  // Then gtag est invoqu\u00E9 avec ces valeurs
  it('doit d\u00E9l\u00E9guer trackEvent \u00E0 gtag avec les param\u00E8tres fournis', () => {
    setupAnalyticsTestBed('G-ABC123');
    const service = TestBed.inject(AnalyticsService);
    service.initialize();

    const calls: unknown[][] = [];
    getWindow().gtag = (...args: unknown[]) => {
      calls.push(args);
    };

    service.trackEvent('contact_form_submitted', { result: 'ok' });

    expect(calls).toContainEqual([
      'event',
      'contact_form_submitted',
      { result: 'ok' },
    ]);
  });
});
