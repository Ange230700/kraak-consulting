import {
  validateCreateUserPayload,
  validateUpdateUserPayload,
} from './users.dto';

describe('validateCreateUserPayload', () => {
  it('Given a valid payload, When validating, Then returns valid with typed data', () => {
    const result = validateCreateUserPayload({
      email: 'alice@example.com',
      firstName: 'Alice',
      lastName: 'Martin',
      role: 'participant',
    });

    expect(result.valid).toBe(true);
    expect(result).toMatchObject({
      valid: true,
      data: expect.objectContaining({
        email: 'alice@example.com',
        firstName: 'Alice',
        role: 'participant',
        isActive: true,
      }),
    });
  });

  it('Given a null body, When validating, Then returns invalid', () => {
    const result = validateCreateUserPayload(null);
    expect(result.valid).toBe(false);
  });

  it('Given a missing email, When validating, Then returns invalid', () => {
    const result = validateCreateUserPayload({
      firstName: 'Bob',
      lastName: 'Dupont',
      role: 'admin',
    });
    expect(result).toMatchObject({
      valid: false,
      error: expect.stringContaining('email'),
    });
  });

  it('Given an invalid email format, When validating, Then returns invalid', () => {
    const result = validateCreateUserPayload({
      email: 'not-an-email',
      firstName: 'Bob',
      lastName: 'Dupont',
      role: 'admin',
    });
    expect(result.valid).toBe(false);
  });

  it('Given an unknown role, When validating, Then returns invalid', () => {
    const result = validateCreateUserPayload({
      email: 'bob@example.com',
      firstName: 'Bob',
      lastName: 'Dupont',
      role: 'superuser',
    });
    expect(result).toMatchObject({
      valid: false,
      error: expect.stringContaining('rôle'),
    });
  });
});

describe('validateUpdateUserPayload', () => {
  it('Given an empty object, When validating, Then returns valid with empty data', () => {
    const result = validateUpdateUserPayload({});
    expect(result).toMatchObject({ valid: true, data: {} });
  });

  it('Given a valid partial update, When validating, Then returns valid data', () => {
    const result = validateUpdateUserPayload({
      firstName: 'Claire',
      isActive: false,
    });
    expect(result).toMatchObject({
      valid: true,
      data: expect.objectContaining({ firstName: 'Claire', isActive: false }),
    });
  });

  it('Given an invalid role, When validating, Then returns invalid', () => {
    const result = validateUpdateUserPayload({ role: 'owner' });
    expect(result.valid).toBe(false);
  });

  it('Given a non-object body, When validating, Then returns invalid', () => {
    const result = validateUpdateUserPayload('not-an-object');
    expect(result.valid).toBe(false);
  });
});
