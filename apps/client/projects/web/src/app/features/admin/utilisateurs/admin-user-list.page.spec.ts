import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MessageService } from 'primeng/api';
import { vi } from 'vitest';
import AdminUserListPage from './admin-user-list.page';

interface UsersClientMock {
  list: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
}

const baseUser = {
  id: '1',
  firstName: 'Alice',
  lastName: 'Martin',
  email: 'alice@example.com',
  role: 'participant',
  phone: null,
  preferredContactChannel: null,
  isActive: true,
  createdAt: '',
  updatedAt: '',
};

describe('AdminUserListPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminUserListPage, RouterTestingModule],
      providers: [MessageService],
    }).compileComponents();
  });

  it('Given the page is created, When initialized, Then component instance exists', () => {
    const fixture = TestBed.createComponent(AdminUserListPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given initial state, When loading state is checked, Then loading is true', () => {
    const fixture = TestBed.createComponent(AdminUserListPage);
    expect(fixture.componentInstance['loading']()).toBe(true);
  });

  it('Given users in state, When search query matches, Then filteredUsers returns only matching users', () => {
    const fixture = TestBed.createComponent(AdminUserListPage);
    const comp = fixture.componentInstance;

    comp['users'].set([
      {
        id: '1',
        firstName: 'Alice',
        lastName: 'Martin',
        email: 'alice@example.com',
        role: 'participant',
        phone: null,
        preferredContactChannel: null,
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: '2',
        firstName: 'Bob',
        lastName: 'Dupont',
        email: 'bob@example.com',
        role: 'admin',
        phone: null,
        preferredContactChannel: null,
        isActive: false,
        createdAt: '',
        updatedAt: '',
      },
    ]);

    comp['searchQuery'].set('alice');

    expect(comp['filteredUsers']()).toHaveLength(1);
    expect(comp['filteredUsers']()[0].firstName).toBe('Alice');
  });

  it('Given getRoleLabel is called, When role is "admin", Then returns "Administrateur"', () => {
    const fixture = TestBed.createComponent(AdminUserListPage);
    expect(fixture.componentInstance.getRoleLabel('admin')).toBe(
      'Administrateur',
    );
  });

  it('Given getRoleLabel is called, When role is unknown, Then fallback role value is returned', () => {
    const fixture = TestBed.createComponent(AdminUserListPage);
    expect(fixture.componentInstance.getRoleLabel('custom')).toBe('custom');
  });

  it('Given a selected user, When openEdit then closeEdit are called, Then edit state is opened then reset', () => {
    const fixture = TestBed.createComponent(AdminUserListPage);
    const comp = fixture.componentInstance;

    comp.openEdit(baseUser);
    expect(comp['editingUser']()?.id).toBe('1');
    expect(comp['editForm']().firstName).toBe('Alice');

    comp.closeEdit();
    expect(comp['editingUser']()).toBeNull();
    expect(comp['editForm']()).toEqual({});
  });

  it('Given an edit form, When updateEditField is called, Then the targeted field is updated', () => {
    const fixture = TestBed.createComponent(AdminUserListPage);
    const comp = fixture.componentInstance;

    comp.updateEditField('role', 'admin');
    expect(comp['editForm']().role).toBe('admin');
  });

  it('Given list API success, When loadUsers is called, Then users are stored and loading is false', async () => {
    const fixture = TestBed.createComponent(AdminUserListPage);
    const comp = fixture.componentInstance;
    const usersClient: UsersClientMock = {
      list: vi.fn().mockResolvedValue([baseUser]),
      update: vi.fn(),
      remove: vi.fn(),
    };
    comp['usersClient'] = usersClient as never;

    await comp.loadUsers();

    expect(comp['users']()).toHaveLength(1);
    expect(comp['loading']()).toBe(false);
    expect(comp['errorMessage']()).toBeNull();
  });

  it('Given list API failure, When loadUsers is called, Then a user-friendly error is exposed', async () => {
    const fixture = TestBed.createComponent(AdminUserListPage);
    const comp = fixture.componentInstance;
    const usersClient: UsersClientMock = {
      list: vi.fn().mockRejectedValue(new Error('boom')),
      update: vi.fn(),
      remove: vi.fn(),
    };
    comp['usersClient'] = usersClient as never;

    await comp.loadUsers();

    expect(comp['loading']()).toBe(false);
    expect(comp['errorMessage']()).toContain('Impossible de charger la liste');
  });

  it('Given an edited user, When saveEdit succeeds, Then list and success feedback are updated', async () => {
    const fixture = TestBed.createComponent(AdminUserListPage);
    const comp = fixture.componentInstance;
    const messageService = TestBed.inject(MessageService);
    const addSpy = vi.spyOn(messageService, 'add');

    comp['users'].set([baseUser]);
    comp['editingUser'].set(baseUser);
    comp['editForm'].set({ firstName: 'Alicia', role: 'admin' });
    const usersClient: UsersClientMock = {
      list: vi.fn(),
      update: vi
        .fn()
        .mockResolvedValue({ ...baseUser, firstName: 'Alicia', role: 'admin' }),
      remove: vi.fn(),
    };
    comp['usersClient'] = usersClient as never;

    await comp.saveEdit();

    expect(comp['users']()[0].firstName).toBe('Alicia');
    expect(comp['successMessage']()).toContain('mis à jour');
    expect(addSpy).toHaveBeenCalled();
    expect(comp['submitting']()).toBe(false);
  });

  it('Given an edited user, When saveEdit fails, Then error feedback is exposed and submitting is reset', async () => {
    const fixture = TestBed.createComponent(AdminUserListPage);
    const comp = fixture.componentInstance;

    comp['editingUser'].set(baseUser);
    comp['editForm'].set({ firstName: 'Alicia' });
    const usersClient: UsersClientMock = {
      list: vi.fn(),
      update: vi.fn().mockRejectedValue(new Error('update failed')),
      remove: vi.fn(),
    };
    comp['usersClient'] = usersClient as never;

    await comp.saveEdit();

    expect(comp['errorMessage']()).toContain('Impossible de mettre à jour');
    expect(comp['submitting']()).toBe(false);
  });

  it('Given a delete request, When confirmDelete succeeds, Then user is removed and success feedback is shown', async () => {
    const fixture = TestBed.createComponent(AdminUserListPage);
    const comp = fixture.componentInstance;
    const messageService = TestBed.inject(MessageService);
    const addSpy = vi.spyOn(messageService, 'add');

    comp['users'].set([
      baseUser,
      { ...baseUser, id: '2', email: 'bob@example.com' },
    ]);
    comp['userToDelete'].set(baseUser);
    const usersClient: UsersClientMock = {
      list: vi.fn(),
      update: vi.fn(),
      remove: vi.fn().mockResolvedValue(undefined),
    };
    comp['usersClient'] = usersClient as never;

    await comp.confirmDelete();

    expect(comp['users']().map((u) => u.id)).toEqual(['2']);
    expect(comp['userToDelete']()).toBeNull();
    expect(comp['successMessage']()).toContain('supprimé');
    expect(addSpy).toHaveBeenCalled();
  });

  it('Given a delete request, When confirmDelete fails, Then an explicit delete error is exposed', async () => {
    const fixture = TestBed.createComponent(AdminUserListPage);
    const comp = fixture.componentInstance;

    comp['userToDelete'].set(baseUser);
    const usersClient: UsersClientMock = {
      list: vi.fn(),
      update: vi.fn(),
      remove: vi.fn().mockRejectedValue(new Error('delete failed')),
    };
    comp['usersClient'] = usersClient as never;

    await comp.confirmDelete();

    expect(comp['errorMessage']()).toContain('Impossible de supprimer');
    expect(comp['userToDelete']()).toBeNull();
    expect(comp['submitting']()).toBe(false);
  });

  it('Given no edited user, When saveEdit is called, Then update is not invoked and state remains unchanged', async () => {
    const fixture = TestBed.createComponent(AdminUserListPage);
    const comp = fixture.componentInstance;

    const usersClient: UsersClientMock = {
      list: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    };
    comp['usersClient'] = usersClient as never;

    await comp.saveEdit();

    expect(usersClient.update).not.toHaveBeenCalled();
    expect(comp['submitting']()).toBe(false);
  });

  it('Given no selected user to delete, When confirmDelete is called, Then remove is not invoked', async () => {
    const fixture = TestBed.createComponent(AdminUserListPage);
    const comp = fixture.componentInstance;

    const usersClient: UsersClientMock = {
      list: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    };
    comp['usersClient'] = usersClient as never;

    await comp.confirmDelete();

    expect(usersClient.remove).not.toHaveBeenCalled();
    expect(comp['submitting']()).toBe(false);
  });

  it('Given a pending delete selection, When cancelDelete is called, Then delete modal target is cleared', () => {
    const fixture = TestBed.createComponent(AdminUserListPage);
    const comp = fixture.componentInstance;

    comp.requestDelete(baseUser);
    expect(comp['userToDelete']()?.id).toBe('1');

    comp.cancelDelete();

    expect(comp['userToDelete']()).toBeNull();
  });

  it('Given loading state, When template is rendered, Then loading spinner is visible', () => {
    const fixture = TestBed.createComponent(AdminUserListPage);
    const comp = fixture.componentInstance;
    comp.loadUsers = vi.fn().mockResolvedValue(undefined);
    comp['loading'].set(true);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(
      host.querySelector('[aria-label="Chargement en cours"]'),
    ).toBeTruthy();
  });

  it('Given empty list without search query, When template is rendered, Then empty state default message is shown', () => {
    const fixture = TestBed.createComponent(AdminUserListPage);
    const comp = fixture.componentInstance;
    comp.loadUsers = vi.fn().mockResolvedValue(undefined);
    comp['loading'].set(false);
    comp['users'].set([]);
    comp['searchQuery'].set('');
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Aucun utilisateur enregistré pour le moment.');
  });

  it('Given empty filtered result with search query, When template is rendered, Then empty state search message is shown', () => {
    const fixture = TestBed.createComponent(AdminUserListPage);
    const comp = fixture.componentInstance;
    comp.loadUsers = vi.fn().mockResolvedValue(undefined);
    comp['loading'].set(false);
    comp['users'].set([baseUser]);
    comp['searchQuery'].set('introuvable');
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain(
      'Aucun utilisateur ne correspond à votre recherche.',
    );
  });

  it('Given active and inactive users, When template is rendered, Then both status badges are visible', () => {
    const fixture = TestBed.createComponent(AdminUserListPage);
    const comp = fixture.componentInstance;
    comp.loadUsers = vi.fn().mockResolvedValue(undefined);
    comp['loading'].set(false);
    comp['users'].set([
      baseUser,
      {
        ...baseUser,
        id: '2',
        firstName: 'Bob',
        lastName: 'Diallo',
        email: 'bob@example.com',
        isActive: false,
      },
    ]);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Actif');
    expect(text).toContain('Inactif');
  });

  it('Given an opened edit modal and delete modal, When template is rendered, Then both dialogs are present', () => {
    const fixture = TestBed.createComponent(AdminUserListPage);
    const comp = fixture.componentInstance;
    comp.loadUsers = vi.fn().mockResolvedValue(undefined);
    comp['loading'].set(false);
    comp['users'].set([baseUser]);
    comp.openEdit(baseUser);
    comp.requestDelete(baseUser);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const dialogs = host.querySelectorAll('dialog[open]');
    expect(dialogs.length).toBeGreaterThanOrEqual(2);
    expect(host.textContent ?? '').toContain("Modifier l'utilisateur");
    expect(host.textContent ?? '').toContain("Supprimer l'utilisateur");
  });

  it('Given success and error messages, When template is rendered, Then both feedback banners are visible', () => {
    const fixture = TestBed.createComponent(AdminUserListPage);
    const comp = fixture.componentInstance;
    comp.loadUsers = vi.fn().mockResolvedValue(undefined);
    comp['loading'].set(false);
    comp['users'].set([baseUser]);
    comp['successMessage'].set('Sauvegarde réussie');
    comp['errorMessage'].set('Erreur fonctionnelle');

    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Sauvegarde réussie');
    expect(text).toContain('Erreur fonctionnelle');
  });

  it('Given submitting state in modals, When template is rendered, Then action buttons are disabled', () => {
    const fixture = TestBed.createComponent(AdminUserListPage);
    const comp = fixture.componentInstance;
    comp.loadUsers = vi.fn().mockResolvedValue(undefined);
    comp['loading'].set(false);
    comp['users'].set([baseUser]);
    comp.openEdit(baseUser);
    comp.requestDelete(baseUser);
    comp['submitting'].set(true);

    fixture.detectChanges();

    const buttons = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('dialog button'),
    ) as HTMLButtonElement[];
    const disabledButtons = buttons.filter((button) => button.disabled);
    expect(disabledButtons.length).toBeGreaterThanOrEqual(3);
  });

  it('Given an edit modal with empty form fields, When template is rendered, Then form inputs fall back to empty string defaults', () => {
    const fixture = TestBed.createComponent(AdminUserListPage);
    const comp = fixture.componentInstance;
    comp.loadUsers = vi.fn().mockResolvedValue(undefined);
    comp['loading'].set(false);
    comp['users'].set([baseUser]);
    comp['editingUser'].set(baseUser);
    comp['editForm'].set({});
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const firstNameInput = host.querySelector(
      '#edit-firstName',
    ) as HTMLInputElement;
    const lastNameInput = host.querySelector(
      '#edit-lastName',
    ) as HTMLInputElement;
    const emailInput = host.querySelector('#edit-email') as HTMLInputElement;
    const roleSelect = host.querySelector('#edit-role') as HTMLSelectElement;
    const isActiveCheckbox = host.querySelector(
      '#edit-isActive',
    ) as HTMLInputElement;
    expect(firstNameInput?.value).toBe('');
    expect(lastNameInput?.value).toBe('');
    expect(emailInput?.value).toBe('');
    expect(roleSelect?.value).toBe('participant');
    expect(isActiveCheckbox?.checked).toBe(true);
  });

  it('Given edit modal is open with an error, When template is rendered, Then error message appears inside the modal', () => {
    const fixture = TestBed.createComponent(AdminUserListPage);
    const comp = fixture.componentInstance;
    comp.loadUsers = vi.fn().mockResolvedValue(undefined);
    comp['loading'].set(false);
    comp['users'].set([baseUser]);
    comp.openEdit(baseUser);
    comp['errorMessage'].set('Erreur lors de la modification');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const dialog = host.querySelector('dialog[open]');
    expect(dialog?.textContent ?? '').toContain(
      'Erreur lors de la modification',
    );
  });
});
