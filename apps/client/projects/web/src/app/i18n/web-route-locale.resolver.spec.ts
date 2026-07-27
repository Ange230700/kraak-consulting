import { TestBed } from '@angular/core/testing';
import type {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { vi } from 'vitest';

import { KraakI18nService } from '../../../../shared/i18n';
import { webRouteLocaleResolver } from './web-route-locale.resolver';

function routeWithLocale(locale: unknown): ActivatedRouteSnapshot {
  return { data: { locale } } as unknown as ActivatedRouteSnapshot;
}

const emptyState = {} as RouterStateSnapshot;

describe('Given the web route locale resolver', () => {
  it('Given a French public route, when the resolver runs, then fr-CI is activated before rendering', async () => {
    const setLocale = vi.fn<(_: string) => Promise<void>>(() =>
      Promise.resolve(),
    );

    TestBed.configureTestingModule({
      providers: [{ provide: KraakI18nService, useValue: { setLocale } }],
    });

    const locale = await TestBed.runInInjectionContext(() =>
      webRouteLocaleResolver(routeWithLocale('fr-CI'), emptyState),
    );

    expect(locale).toBe('fr-CI');
    expect(setLocale).toHaveBeenCalledWith('fr-CI');
  });

  it('Given an English public route, when the resolver runs, then en-GB is activated before rendering', async () => {
    const setLocale = vi.fn<(_: string) => Promise<void>>(() =>
      Promise.resolve(),
    );

    TestBed.configureTestingModule({
      providers: [{ provide: KraakI18nService, useValue: { setLocale } }],
    });

    const locale = await TestBed.runInInjectionContext(() =>
      webRouteLocaleResolver(routeWithLocale('en-GB'), emptyState),
    );

    expect(locale).toBe('en-GB');
    expect(setLocale).toHaveBeenCalledWith('en-GB');
  });

  it('Given an unsupported route locale, when the resolver runs, then the source locale is used', async () => {
    const setLocale = vi.fn<(_: string) => Promise<void>>(() =>
      Promise.resolve(),
    );

    TestBed.configureTestingModule({
      providers: [{ provide: KraakI18nService, useValue: { setLocale } }],
    });

    const locale = await TestBed.runInInjectionContext(() =>
      webRouteLocaleResolver(routeWithLocale('de-DE'), emptyState),
    );

    expect(locale).toBe('fr-CI');
    expect(setLocale).toHaveBeenCalledWith('fr-CI');
  });
});
