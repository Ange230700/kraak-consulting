import type { FormControl } from '@angular/forms';

export function normalizeRequiredText(value: string): string {
  return value.trim();
}

export function normalizeTextControl(control: FormControl<string>): void {
  control.setValue(normalizeRequiredText(control.getRawValue()));
}
