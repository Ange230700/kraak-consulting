import type { ApiMessageValue } from '../i18n/api-message';

export type ValidationSuccess<T> = {
  valid: true;
  data: T;
};

export type ValidationFailure = {
  valid: false;
  errors: ApiMessageValue[];
};

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;
