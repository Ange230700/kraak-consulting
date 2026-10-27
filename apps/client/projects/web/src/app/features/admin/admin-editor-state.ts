import { computed, signal } from '@angular/core';

export class AdminEditorState {
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly isEditing = computed(() => this.editingId() !== null);
}
