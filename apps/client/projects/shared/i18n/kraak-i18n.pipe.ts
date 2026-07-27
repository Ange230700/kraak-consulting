import { Pipe, PipeTransform, inject } from '@angular/core';

import { KraakI18nService, type TranslationKey } from './kraak-i18n.service';

@Pipe({
  name: 'kraakTranslate',
  standalone: true,
  pure: false,
})
export class KraakTranslatePipe implements PipeTransform {
  private readonly i18n = inject(KraakI18nService);

  transform(
    key: TranslationKey,
    params?: Readonly<Record<string, unknown>>,
  ): string {
    return this.i18n.translate(key, params);
  }
}
