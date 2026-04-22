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

  // Given un identifiant GA4 vide (analytics non configuré pour cet environnement)
  // When le service est initialisé
  // Then aucun script Google Analytics n'est injecté et aucun appel gtag n'est émis
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
  // When le service est initialisé
  // Then le loader gtag.js est injecté et la configuration de base est posée
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

  // Given le service initialisé deux fois
  // When la deuxième initialisation est demandée
  // Then aucun loader supplémentaire n'est injecté
  it('ne doit pas réinjecter le loader si initialize() est appelé deux fois', () => {
    setupAnalyticsTestBed('G-ABC123');
    const service = TestBed.inject(AnalyticsService);

    service.initialize();
    service.initialize();

    expect(
      document.head.querySelectorAll('script[data-kraak-analytics="loader"]'),
    ).toHaveLength(1);
  });

  // Given le service activé
  // When le router émet une navigation terminée
  // Then un évènement page_view est envoyé à GA4 avec le chemin courant
  it('doit envoyer un évènement page_view sur chaque NavigationEnd', () => {
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
  // When le router émet une navigation terminée
  // Then aucun évènement n'est envoyé
  it("ne doit envoyer aucun page_view quand l'analytics est désactivé", () => {
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

  // Given le service activé
  // When trackEvent est appelé avec un nom et des paramètres
  // Then gtag est invoqué avec ces valeurs
  it('doit déléguer trackEvent à gtag avec les paramètres fournis', () => {
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
