import { TestBed } from '@angular/core/testing';
import { UserFormStateService } from './user-form-state.service';

describe('UserFormStateService', () => {
  let service: UserFormStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserFormStateService);
    service.reset();
  });

  describe('state initialization', () => {
    it('Given a new instance, When accessing state, Then returns default empty values', () => {
      const state = service.state();

      expect(state.firstName).toBe('');
      expect(state.email).toBe('');
      expect(state.isActive).toBe(true);
      expect(state.sendInvitation).toBe(true);
    });
  });

  describe('patch', () => {
    it('Given partial data, When patch is called, Then updates only specified fields', () => {
      service.patch({ firstName: 'Alice', email: 'alice@example.com' });

      const state = service.state();
      expect(state.firstName).toBe('Alice');
      expect(state.email).toBe('alice@example.com');
      expect(state.lastName).toBe('');
    });
  });

  describe('reset', () => {
    it('Given a modified state, When reset is called, Then returns to initial values', () => {
      service.patch({ firstName: 'Alice', role: 'admin' });
      service.reset();

      const state = service.state();
      expect(state.firstName).toBe('');
      expect(state.role).toBe('');
    });
  });

  describe('isStep1Valid', () => {
    it('Given all basic fields filled with valid email, When checking, Then isStep1Valid is true', () => {
      service.patch({
        firstName: 'Alice',
        lastName: 'Martin',
        email: 'alice@example.com',
      });

      expect(service.isStep1Valid()).toBe(true);
    });

    it('Given a missing firstName, When checking, Then isStep1Valid is false', () => {
      service.patch({ lastName: 'Martin', email: 'alice@example.com' });

      expect(service.isStep1Valid()).toBe(false);
    });

    it('Given an invalid email, When checking, Then isStep1Valid is false', () => {
      service.patch({
        firstName: 'Alice',
        lastName: 'Martin',
        email: 'not-an-email',
      });

      expect(service.isStep1Valid()).toBe(false);
    });
  });

  describe('isStep2Valid', () => {
    it('Given a role is selected, When checking, Then isStep2Valid is true', () => {
      service.patch({ role: 'participant' });

      expect(service.isStep2Valid()).toBe(true);
    });

    it('Given no role selected, When checking, Then isStep2Valid is false', () => {
      expect(service.isStep2Valid()).toBe(false);
    });
  });
});
