import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import BasicInformationPage from './basic-information.page';
import { UserFormStateService } from '../user-form-state.service';

describe('BasicInformationPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BasicInformationPage, RouterTestingModule],
      providers: [UserFormStateService],
    }).compileComponents();
  });

  it('Given the page is created, When initialized, Then component instance exists', () => {
    const fixture = TestBed.createComponent(BasicInformationPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given existing state, When ngOnInit is called, Then fields are populated from state', () => {
    const formState = TestBed.inject(UserFormStateService);
    formState.patch({
      firstName: 'Alice',
      lastName: 'Martin',
      email: 'alice@example.com',
    });

    const fixture = TestBed.createComponent(BasicInformationPage);
    fixture.componentInstance.ngOnInit();

    expect(fixture.componentInstance['firstName']).toBe('Alice');
    expect(fixture.componentInstance['lastName']).toBe('Martin');
    expect(fixture.componentInstance['email']).toBe('alice@example.com');
  });

  it('Given form values are set, When sync is called, Then state service is updated', () => {
    const formState = TestBed.inject(UserFormStateService);
    const fixture = TestBed.createComponent(BasicInformationPage);
    const comp = fixture.componentInstance;

    comp['firstName'] = 'Bob';
    comp['lastName'] = 'Dupont';
    comp['email'] = 'bob@test.com';
    comp['sync']();

    expect(formState.state().firstName).toBe('Bob');
    expect(formState.state().lastName).toBe('Dupont');
    expect(formState.state().email).toBe('bob@test.com');
  });
});
