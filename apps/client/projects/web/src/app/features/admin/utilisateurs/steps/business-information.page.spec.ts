import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import BusinessInformationPage from './business-information.page';
import { UserFormStateService } from '../user-form-state.service';

describe('BusinessInformationPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessInformationPage, RouterTestingModule],
      providers: [UserFormStateService],
    }).compileComponents();
  });

  it('Given the page is created, When initialized, Then component instance exists', () => {
    const fixture = TestBed.createComponent(BusinessInformationPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given existing state with a role, When ngOnInit is called, Then role field is populated', () => {
    const formState = TestBed.inject(UserFormStateService);
    formState.patch({ role: 'trainer' });

    const fixture = TestBed.createComponent(BusinessInformationPage);
    fixture.componentInstance.ngOnInit();

    expect(fixture.componentInstance['role']).toBe('trainer');
  });

  it('Given roles constant, When roles list is accessed, Then 3 roles are provided', () => {
    const fixture = TestBed.createComponent(BusinessInformationPage);
    expect(fixture.componentInstance['roles']).toHaveLength(3);
  });

  it('Given a selected role, When sync is called, Then form state is updated', () => {
    const formState = TestBed.inject(UserFormStateService);
    const fixture = TestBed.createComponent(BusinessInformationPage);
    const comp = fixture.componentInstance;

    comp['role'] = 'admin';
    comp['sync']();

    expect(formState.state().role).toBe('admin');
  });
});
