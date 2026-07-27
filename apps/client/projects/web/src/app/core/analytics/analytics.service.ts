import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { InjectionToken, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

import { resolveLocaleFromPublicPath } from '../../routing/localized-public-routes';

/**
 * Identifiant de mesure GA4 (`G-XXXXXXX`) injecté à la racine de l'application.
 * Quand la valeur est vide, l'analytics est complètement désactivée.
 */
export const GA4_MEASUREMENT_ID = new InjectionToken<string>(
  'KRAAK_GA4_MEASUREMENT_ID',
);

interface GtagWindow {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
}

const LOADER_ATTRIBUTE = 'data-kraak-analytics';
const LOADER_ATTRIBUTE_VALUE = 'loader';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly measurementId = inject(GA4_MEASUREMENT_ID, {
    optional: true,
  });
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);

  private initialized = false;

  /**
   * Active GA4 si un identifiant est configuré et si l'on s'exécute côté
   * navigateur. À appeler une fois au démarrage de l'application.
   */
  initialize(): void {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    if (!this.isEnabled() || !isPlatformBrowser(this.platformId)) {
      return;
    }

    this.injectLoader();
    this.bootstrapGtag();
    this.trackRouterPageViews();
  }

  isEnabled(): boolean {
    return Boolean(this.measurementId?.trim());
  }

  trackEvent(name: string, params: Record<string, unknown> = {}): void {
    if (!this.isEnabled() || !isPlatformBrowser(this.platformId)) {
      return;
    }

    const target = this.getGtagWindow();
    target.gtag?.('event', name, params);
  }

  private injectLoader(): void {
    const existing = this.document.head.querySelector(
      `script[${LOADER_ATTRIBUTE}="${LOADER_ATTRIBUTE_VALUE}"]`,
    );
    if (existing) {
      return;
    }

    const script = this.document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
      this.measurementId ?? '',
    )}`;
    script.setAttribute(LOADER_ATTRIBUTE, LOADER_ATTRIBUTE_VALUE);
    this.document.head.appendChild(script);
  }

  private bootstrapGtag(): void {
    const target = this.getGtagWindow();
    target.dataLayer = target.dataLayer ?? [];
    target.gtag ??= createGtagShim(target.dataLayer);
    target.gtag('js', new Date());
    target.gtag('config', this.measurementId, {
      anonymize_ip: true,
      send_page_view: false,
    });
  }

  private trackRouterPageViews(): void {
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
      )
      .subscribe((event) => {
        const target = this.getGtagWindow();
        const locale = resolveLocaleFromPublicPath(event.urlAfterRedirects);
        const pageViewParams: Record<string, unknown> = {
          page_path: event.urlAfterRedirects,
        };

        if (locale) {
          pageViewParams['locale'] = locale;
        }

        target.gtag?.('event', 'page_view', {
          ...pageViewParams,
        });
      });
  }

  private getGtagWindow(): GtagWindow {
    const ownerWindow = this.document.defaultView as
      | (Window & GtagWindow)
      | null;
    return (ownerWindow ?? globalThis) as GtagWindow;
  }
}

function createGtagShim(dataLayer: unknown[]): (...args: unknown[]) => void {
  return function gtag(...args: unknown[]): void {
    dataLayer.push(args);
  };
}
