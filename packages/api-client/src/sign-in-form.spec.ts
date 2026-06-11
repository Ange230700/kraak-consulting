// packages\api-client\src\sign-in-form.spec.ts

import '@angular/compiler';
import { FormControl } from '@angular/forms';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createSharedSubmitSignInOptions,
  createSignInForm,
  normalizeRequiredText,
  normalizeTextControl,
  submitSignInForm,
} from './sign-in-form';

describe('sign-in-form helpers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('Given raw text, When normalizeRequiredText is called, Then surrounding spaces are trimmed', () => {
    expect(normalizeRequiredText('  user@example.com  ')).toBe(
      'user@example.com',
    );
  });

  it('Given a FormControl, When normalizeTextControl is called, Then control value is trimmed', () => {
    const control = new FormControl('  value  ', { nonNullable: true });

    normalizeTextControl(control);

    expect(control.value).toBe('value');
  });

  it('Given createSignInForm, When instantiated, Then validators enforce email and minimum password length', () => {
    const form = createSignInForm();

    form.setValue({ email: 'invalid', password: '123' });
    expect(form.invalid).toBe(true);

    form.setValue({ email: 'user@example.com', password: 'password123' });
    expect(form.valid).toBe(true);
  });

  it('Given shared submit options, When createSharedSubmitSignInOptions is called, Then it returns the same object reference', () => {
    const options = {
      form: createSignInForm(),
      isSubmitting: () => false,
      setSubmitting: vi.fn(),
      setErrorMessage: vi.fn(),
      signIn: vi.fn(),
    };

    expect(createSharedSubmitSignInOptions(options)).toBe(options);
  });

  it('Given an invalid form, When submitSignInForm is called, Then nothing is submitted', async () => {
    const form = createSignInForm();
    form.setValue({ email: 'invalid', password: '123' });

    const signIn = vi.fn();
    const setSubmitting = vi.fn();
    const setErrorMessage = vi.fn();
    const navigateAfterSuccess = vi.fn();

    await submitSignInForm({
      form,
      isSubmitting: () => false,
      setSubmitting,
      setErrorMessage,
      signIn,
      navigateAfterSuccess,
      logContext: 'test.sign-in',
      route: '/connexion',
    });

    expect(signIn).not.toHaveBeenCalled();
    expect(setSubmitting).not.toHaveBeenCalled();
    expect(navigateAfterSuccess).not.toHaveBeenCalled();
  });

  it('Given a valid form and idle state, When submitSignInForm succeeds, Then sign-in and navigation are executed', async () => {
    const form = createSignInForm();
    form.setValue({ email: '  user@example.com  ', password: 'password123' });

    const signIn = vi.fn().mockResolvedValue(undefined);
    const setSubmitting = vi.fn();
    const setErrorMessage = vi.fn();
    const onSuccess = vi.fn();
    const navigateAfterSuccess = vi.fn().mockResolvedValue(undefined);

    await submitSignInForm({
      form,
      isSubmitting: () => false,
      setSubmitting,
      setErrorMessage,
      signIn,
      navigateAfterSuccess,
      onSuccess,
      logContext: 'test.sign-in',
      route: '/connexion',
    });

    expect(signIn).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(navigateAfterSuccess).toHaveBeenCalledTimes(1);
    expect(setSubmitting).toHaveBeenNthCalledWith(1, true);
    expect(setSubmitting).toHaveBeenLastCalledWith(false);
    expect(setErrorMessage).toHaveBeenCalledWith(null);
  });

  it('Given a valid form without onSuccess, When submitSignInForm succeeds, Then navigation still executes', async () => {
    const form = createSignInForm();
    form.setValue({ email: 'user@example.com', password: 'password123' });

    const signIn = vi.fn().mockResolvedValue(undefined);
    const navigateAfterSuccess = vi.fn().mockResolvedValue(undefined);

    await submitSignInForm({
      form,
      isSubmitting: () => false,
      setSubmitting: vi.fn(),
      setErrorMessage: vi.fn(),
      signIn,
      navigateAfterSuccess,
      logContext: 'test.sign-in',
      route: '/connexion',
    });

    expect(signIn).toHaveBeenCalledTimes(1);
    expect(navigateAfterSuccess).toHaveBeenCalledTimes(1);
  });

  it('Given isSubmitting true, When submitSignInForm is called, Then it exits early', async () => {
    const form = createSignInForm();
    form.setValue({ email: 'user@example.com', password: 'password123' });

    const signIn = vi.fn();

    await submitSignInForm({
      form,
      isSubmitting: () => true,
      setSubmitting: vi.fn(),
      setErrorMessage: vi.fn(),
      signIn,
      navigateAfterSuccess: vi.fn(),
      logContext: 'test.sign-in',
      route: '/connexion',
    });

    expect(signIn).not.toHaveBeenCalled();
  });

  it('Given sign-in throws a non-descriptive value, When submitSignInForm is called, Then a fallback error message is set', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'groupCollapsed').mockImplementation(() => undefined);
    vi.spyOn(console, 'groupEnd').mockImplementation(() => undefined);
    vi.spyOn(console, 'debug').mockImplementation(() => undefined);

    const form = createSignInForm();
    form.setValue({ email: 'user@example.com', password: 'password123' });

    const setErrorMessage = vi.fn();

    await submitSignInForm({
      form,
      isSubmitting: () => false,
      setSubmitting: vi.fn(),
      setErrorMessage,
      signIn: vi.fn().mockRejectedValue({}),
      navigateAfterSuccess: vi.fn(),
      logContext: 'test.sign-in',
      route: '/connexion',
      fallbackMessage: 'Connexion indisponible',
    });

    expect(setErrorMessage).toHaveBeenLastCalledWith('Connexion indisponible');
  });

  it('Given sign-in throws without custom fallback, When submitSignInForm is called, Then the default fallback error message is set', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'groupCollapsed').mockImplementation(() => undefined);
    vi.spyOn(console, 'groupEnd').mockImplementation(() => undefined);
    vi.spyOn(console, 'debug').mockImplementation(() => undefined);

    const form = createSignInForm();
    form.setValue({ email: 'user@example.com', password: 'password123' });

    const setErrorMessage = vi.fn();

    await submitSignInForm({
      form,
      isSubmitting: () => false,
      setSubmitting: vi.fn(),
      setErrorMessage,
      signIn: vi.fn().mockRejectedValue({}),
      navigateAfterSuccess: vi.fn(),
      logContext: 'test.sign-in',
      route: '/connexion',
    });

    expect(setErrorMessage).toHaveBeenLastCalledWith(
      'Impossible de vous connecter pour le moment.',
    );
  });
});
