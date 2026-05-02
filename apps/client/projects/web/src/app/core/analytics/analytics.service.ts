import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { InjectionToken, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

/**
 * Identifiant de mesure GA4 (`G-XXXXXXX`) inject\u00E9 \u00E0 la racine de l'application.
 * Quand la valeur est vide, l'analytics est compl\u00E8tement d\u00E9sactiv\u00E9e.
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
   * Active GA4 si un identifiant est configur\u00E9 et si l'on s'ex\u00E9cute c\u00F4t\u00E9
   * navigateur. \u00C0 appeler une fois au d\u00E9marrage de l'application.
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
        target.gtag?.('event', 'page_view', {
          page_path: event.urlAfterRedirects,
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
