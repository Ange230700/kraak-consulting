import { FormGroup } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { createPublicationControls } from './publication-form.utils';

describe('createPublicationControls', () => {
  it('Given un nouvel éditeur, When les contrôles sont créés, Then les champs requis et le slug sont validés', () => {
    const form = new FormGroup(createPublicationControls());
    const other = new FormGroup(createPublicationControls());
    expect(form.getRawValue()).toEqual({
      slug: '',
      title: '',
      summary: '',
      description: '',
      status: 'draft',
    });
    for (const name of ['slug', 'title', 'summary', 'description'] as const) {
      expect(form.controls[name].hasError('required')).toBe(true);
    }
    form.setValue({
      slug: 'projet-2026',
      title: 'Titre',
      summary: 'Résumé',
      description: 'Description',
      status: 'published',
    });
    expect(form.valid).toBe(true);
    form.controls.slug.setValue('Slug invalide');
    expect(form.controls.slug.hasError('pattern')).toBe(true);
    form.controls.status.setValue('');
    expect(form.controls.status.hasError('required')).toBe(true);
    form.reset();
    expect(form.controls.status.value).toBe('draft');
    expect(form.controls.title.value).toBe('');
    expect(other.controls.slug.value).toBe('');
  });
});
