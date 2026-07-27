import {
  effect,
  inject,
  Injectable,
  makeEnvironmentProviders,
  provideAppInitializer,
  type EnvironmentProviders,
} from '@angular/core';
import type { Translation as PrimeNgTranslation } from 'primeng/api';
import { PrimeNG } from 'primeng/config';

import { KraakI18nService } from './kraak-i18n.service';

@Injectable()
export class KraakPrimeNgI18nBridge {
  private readonly i18n = inject(KraakI18nService);
  private readonly primeNg = inject(PrimeNG);

  constructor() {
    this.applyCurrentTranslations();

    effect(() => {
      this.i18n.locale();
      this.applyCurrentTranslations();
    });
  }

  applyCurrentTranslations(): void {
    this.primeNg.setTranslation(
      this.i18n.primeNgTranslation() as PrimeNgTranslation,
    );
  }
}

export function provideKraakPrimeNgI18nBridge(): EnvironmentProviders {
  return makeEnvironmentProviders([
    KraakPrimeNgI18nBridge,
    provideAppInitializer(() => {
      inject(KraakPrimeNgI18nBridge);
    }),
  ]);
}
