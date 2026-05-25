export type ValidationSuccess<T> = {
  valid: true;
  data: T;
};

export type ValidationFailure = {
  valid: false;
  errors: string[];
};

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;
