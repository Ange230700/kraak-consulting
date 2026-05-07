import type { FormControl } from '@angular/forms';

export function normalizeRequiredText(value: string): string {
  return value.trim();
}

export function normalizeTextControl(control: FormControl<string>): void {
  control.setValue(normalizeRequiredText(control.getRawValue()));
}

export function resolveWebRedirectUrl(
  pathname: string,
  siteUrl: string,
): string {
  const browserOrigin =
    typeof globalThis !== 'undefined' &&
    'location' in globalThis &&
    globalThis.location?.origin
      ? globalThis.location.origin
      : null;
  const baseSiteUrl = browserOrigin ?? siteUrl;

  return new URL(pathname, ensureTrailingSlash(baseSiteUrl)).toString();
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`;
}
