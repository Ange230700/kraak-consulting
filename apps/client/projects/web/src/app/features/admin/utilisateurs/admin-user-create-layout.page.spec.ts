import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MessageService } from 'primeng/api';
import AdminUserCreateLayoutPage from './admin-user-create-layout.page';
import { UserFormStateService } from './user-form-state.service';

describe('AdminUserCreateLayoutPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminUserCreateLayoutPage, RouterTestingModule],
      providers: [MessageService, UserFormStateService],
    }).compileComponents();
  });

  it('Given the page is created, When initialized, Then component instance exists', () => {
    const fixture = TestBed.createComponent(AdminUserCreateLayoutPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given the wizard steps, When steps are accessed, Then 5 steps are returned', () => {
    const fixture = TestBed.createComponent(AdminUserCreateLayoutPage);
    expect(fixture.componentInstance.steps).toHaveLength(5);
  });

  it('Given a step with path "basic-information", When getStepRouterLink is called, Then returns correct admin URL', () => {
    const fixture = TestBed.createComponent(AdminUserCreateLayoutPage);
    const link = fixture.componentInstance.getStepRouterLink({
      label: 'Test',
      icon: 'pi-user',
      path: 'basic-information',
    });
    expect(link).toBe('/admin/utilisateurs/create/basic-information');
  });

  it('Given incomplete form state, When submit is attempted, Then sets error message', async () => {
    const fixture = TestBed.createComponent(AdminUserCreateLayoutPage);
    const comp = fixture.componentInstance;

    await comp.handleSubmit();

    expect(comp['errorMessage']()).toBeTruthy();
  });

  it('Given invitation disabled, When submit is attempted, Then blocks submission with explicit message', async () => {
    const formState = TestBed.inject(UserFormStateService);
    formState.patch({
      firstName: 'Alice',
      lastName: 'Martin',
      email: 'alice@example.com',
      role: 'participant',
      sendInvitation: false,
    });
    const fixture = TestBed.createComponent(AdminUserCreateLayoutPage);
    const comp = fixture.componentInstance;

    await comp.handleSubmit();

    expect(comp['errorMessage']()).toContain('obligatoire');
  });
});
