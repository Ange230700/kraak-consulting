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
  it('Given une route sans locale textuelle, When la résolution précède le rendu, Then la langue française est sélectionnée', async () => {
    const setLocale = vi.fn().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [{ provide: KraakI18nService, useValue: { setLocale } }],
    });
    const locale = await TestBed.runInInjectionContext(() =>
      webRouteLocaleResolver(routeWithLocale(undefined), emptyState),
    );
    expect(locale).toBe('fr-CI');
    expect(setLocale).toHaveBeenCalledWith('fr-CI');
  });
  it.each([
    ['fr-CI', 'fr-CI'],
    ['en-GB', 'en-GB'],
    ['de-DE', 'fr-CI'],
  ])(
    'Given la locale de route %s, When le résolveur est exécuté, Then %s est activée avant le rendu',
    async (candidate, expected) => {
      const setLocale = vi.fn<(_: string) => Promise<void>>(() =>
        Promise.resolve(),
      );

      TestBed.configureTestingModule({
        providers: [{ provide: KraakI18nService, useValue: { setLocale } }],
      });

      const locale = await TestBed.runInInjectionContext(() =>
        webRouteLocaleResolver(routeWithLocale(candidate), emptyState),
      );

      expect(locale).toBe(expected);
      expect(setLocale).toHaveBeenCalledWith(expected);
    },
  );
});
