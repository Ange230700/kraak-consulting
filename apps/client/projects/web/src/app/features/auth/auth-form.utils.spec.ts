import { FormControl } from '@angular/forms';
import { describe, expect, it } from 'vitest';

import {
  normalizeRequiredText,
  normalizeTextControl,
  resolveWebRedirectUrl,
} from './auth-form.utils';

describe('auth-form.utils', () => {
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

  it('Given location indisponible, When resolveWebRedirectUrl est appelé, Then le siteUrl de fallback est utilisé', () => {
    const originalLocationDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      'location',
    );

    Object.defineProperty(globalThis, 'location', {
      value: undefined,
      configurable: true,
    });

    try {
      const result = resolveWebRedirectUrl('/auth/reset', 'https://kraak.test');
      expect(result).toBe('https://kraak.test/auth/reset');
    } finally {
      if (originalLocationDescriptor) {
        Object.defineProperty(
          globalThis,
          'location',
          originalLocationDescriptor,
        );
      }
    }
  });

  it('Given un siteUrl déjà suffixé par /, When resolveWebRedirectUrl est appelé, Then aucune double barre supplémentaire n est introduite', () => {
    const originalLocationDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      'location',
    );

    Object.defineProperty(globalThis, 'location', {
      value: undefined,
      configurable: true,
    });

    try {
      const result = resolveWebRedirectUrl('/connexion', 'https://kraak.test/');
      expect(result).toBe('https://kraak.test/connexion');
    } finally {
      if (originalLocationDescriptor) {
        Object.defineProperty(
          globalThis,
          'location',
          originalLocationDescriptor,
        );
      }
    }
  });
});
