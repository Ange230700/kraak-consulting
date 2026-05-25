import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MessageService } from 'primeng/api';
import AccountStatusPage from './account-status.page';
import { UserFormStateService } from '../user-form-state.service';

describe('AccountStatusPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountStatusPage, RouterTestingModule],
      providers: [MessageService, UserFormStateService],
    }).compileComponents();
  });

  it('Given the page is created, When initialized, Then component instance exists', () => {
    const fixture = TestBed.createComponent(AccountStatusPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('Given default state, When ngOnInit is called, Then isActive is true and sendInvitation is true', () => {
    const fixture = TestBed.createComponent(AccountStatusPage);
    fixture.componentInstance.ngOnInit();

    expect(fixture.componentInstance['isActive']).toBe(true);
    expect(fixture.componentInstance['sendInvitation']).toBe(true);
  });

  it('Given state with isActive false, When ngOnInit is called, Then isActive is false', () => {
    const formState = TestBed.inject(UserFormStateService);
    formState.patch({ isActive: false });

    const fixture = TestBed.createComponent(AccountStatusPage);
    fixture.componentInstance.ngOnInit();

    expect(fixture.componentInstance['isActive']).toBe(false);
  });

  it('Given incomplete form state, When handleSubmit is called, Then sets errorMessage', async () => {
    const fixture = TestBed.createComponent(AccountStatusPage);
    const comp = fixture.componentInstance;

    await comp.handleSubmit();

    expect(comp['errorMessage']).toBeTruthy();
  });
});
