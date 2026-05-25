import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MessageService } from 'primeng/api';
import AdminUserListPage from './admin-user-list.page';

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
});
