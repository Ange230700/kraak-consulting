import { FormControl } from '@angular/forms';
import { describe, expect, it } from 'vitest';

import { normalizeRequiredText, normalizeTextControl } from './auth-form.utils';

describe('auth-form.utils (mobile)', () => {
  it('Given un texte avec espaces, When normalizeRequiredText est appelé, Then le texte est trimé', () => {
    expect(normalizeRequiredText('  bonjour  ')).toBe('bonjour');
  });

  it('Given un FormControl texte, When normalizeTextControl est appelé, Then la valeur stockée est trimée', () => {
    const control = new FormControl('  utilisateur@example.com  ', {
      nonNullable: true,
    });

    normalizeTextControl(control);

    expect(control.getRawValue()).toBe('utilisateur@example.com');
  });
});
