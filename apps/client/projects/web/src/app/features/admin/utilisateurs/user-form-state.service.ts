import { Injectable, signal, computed } from '@angular/core';
import type { UserRoleValue } from '@kraak/contracts';

export interface UserFormState {
  // Step 1 — Informations de base
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  // Step 2 — Informations professionnelles
  role: UserRoleValue | '';
  position: string;
  department: string;
  // Step 3 — Localisation
  country: string;
  city: string;
  postalCode: string;
  addressLine1: string;
  addressLine2: string;
  // Step 4 — Autorisations
  preferredContactChannel: string;
  notes: string;
  // Step 5 — Statut du compte
  isActive: boolean;
  sendInvitation: boolean;
}

const initialState: UserFormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: '',
  position: '',
  department: '',
  country: '',
  city: '',
  postalCode: '',
  addressLine1: '',
  addressLine2: '',
  preferredContactChannel: '',
  notes: '',
  isActive: true,
  sendInvitation: true,
};

@Injectable({
  providedIn: 'root',
})
export class UserFormStateService {
  private readonly _state = signal<UserFormState>({ ...initialState });

  readonly state = this._state.asReadonly();

  readonly isStep1Valid = computed(() => {
    const s = this._state();
    return (
      s.firstName.trim().length > 0 &&
      s.lastName.trim().length > 0 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email)
    );
  });

  readonly isStep2Valid = computed(() => {
    const s = this._state();
    return s.role !== '';
  });

  patch(partial: Partial<UserFormState>): void {
    this._state.update((current) => ({ ...current, ...partial }));
  }

  reset(): void {
    this._state.set({ ...initialState });
  }
}
