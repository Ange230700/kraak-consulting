import { describe, expect, it } from 'vitest';
import { AdminEditorState } from './admin-editor-state';

describe('AdminEditorState', () => {
  it('Given deux éditeurs, When un formulaire change de mode, Then les signaux restent réactifs et isolés', () => {
    const editor = new AdminEditorState();
    const other = new AdminEditorState();

    expect(editor.loading()).toBe(true);
    expect(editor.errorMessage()).toBeNull();
    expect(editor.successMessage()).toBeNull();
    expect(editor.showForm()).toBe(false);
    expect(editor.submitting()).toBe(false);
    expect(editor.editingId()).toBeNull();
    expect(editor.isEditing()).toBe(false);

    editor.editingId.set('item-1');
    editor.showForm.set(true);
    editor.submitting.set(true);
    editor.errorMessage.set('Erreur');
    editor.successMessage.set('Enregistré');
    editor.loading.set(false);

    expect(editor.isEditing()).toBe(true);
    expect(other.isEditing()).toBe(false);
    expect(other.showForm()).toBe(false);
    expect(other.loading()).toBe(true);
    expect(other.errorMessage()).toBeNull();
    expect(other.successMessage()).toBeNull();
    expect(other.submitting()).toBe(false);
    editor.editingId.set(null);
    expect(editor.isEditing()).toBe(false);
  });
});
