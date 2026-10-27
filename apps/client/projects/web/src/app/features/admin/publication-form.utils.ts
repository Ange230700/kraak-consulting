import { FormControl, Validators } from '@angular/forms';

export interface PublicationFormModel {
  slug: FormControl<string>;
  title: FormControl<string>;
  summary: FormControl<string>;
  description: FormControl<string>;
  status: FormControl<string>;
}

export function createPublicationControls(): PublicationFormModel {
  return {
    slug: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)],
    }),
    title: requiredTextControl(''),
    summary: requiredTextControl(''),
    description: requiredTextControl(''),
    status: requiredTextControl('draft'),
  };
}

function requiredTextControl(value: string): FormControl<string> {
  return new FormControl(value, {
    nonNullable: true,
    validators: [Validators.required],
  });
}
