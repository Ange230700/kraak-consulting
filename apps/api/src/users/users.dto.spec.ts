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

  it('Given optional text fields with surrounding spaces, When validating, Then trims and normalizes values', () => {
    const result = validateCreateUserPayload({
      email: '  alice@example.com  ',
      firstName: '  Alice  ',
      lastName: '  Martin  ',
      role: 'admin',
      phone: '  0601020304  ',
      preferredContactChannel: '  email  ',
      isActive: false,
    });

    expect(result).toMatchObject({
      valid: true,
      data: {
        email: 'alice@example.com',
        firstName: 'Alice',
        lastName: 'Martin',
        role: 'admin',
        phone: '0601020304',
        preferredContactChannel: 'email',
        isActive: false,
      },
    });
  });

  it('Given optional text fields as empty strings, When validating, Then stores null values', () => {
    const result = validateCreateUserPayload({
      email: 'alice@example.com',
      firstName: 'Alice',
      lastName: 'Martin',
      role: 'participant',
      phone: '   ',
      preferredContactChannel: '   ',
    });

    expect(result).toMatchObject({
      valid: true,
      data: expect.objectContaining({
        phone: null,
        preferredContactChannel: null,
      }),
    });
  });

  it('Given missing first name, When validating, Then returns required error', () => {
    const result = validateCreateUserPayload({
      email: 'alice@example.com',
      lastName: 'Martin',
      role: 'participant',
    });

    expect(result).toMatchObject({
      valid: false,
      error: expect.stringContaining('prénom'),
    });
  });

  it('Given missing last name, When validating, Then returns required error', () => {
    const result = validateCreateUserPayload({
      email: 'alice@example.com',
      firstName: 'Alice',
      role: 'participant',
    });

    expect(result).toMatchObject({
      valid: false,
      error: expect.stringContaining('nom de famille'),
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

  it('Given email with spaces, When validating, Then trims email in update payload', () => {
    const result = validateUpdateUserPayload({
      email: '  claire@example.com  ',
    });

    expect(result).toMatchObject({
      valid: true,
      data: {
        email: 'claire@example.com',
      },
    });
  });

  it('Given an invalid email in update payload, When validating, Then returns invalid', () => {
    const result = validateUpdateUserPayload({ email: 'not-an-email' });
    expect(result).toMatchObject({
      valid: false,
      error: expect.stringContaining('email'),
    });
  });

  it('Given blank first name in update payload, When validating, Then returns invalid', () => {
    const result = validateUpdateUserPayload({ firstName: '   ' });
    expect(result).toMatchObject({
      valid: false,
      error: expect.stringContaining('prénom'),
    });
  });

  it('Given blank last name in update payload, When validating, Then returns invalid', () => {
    const result = validateUpdateUserPayload({ lastName: '   ' });
    expect(result).toMatchObject({
      valid: false,
      error: expect.stringContaining('nom de famille'),
    });
  });

  it('Given optional text fields in update payload, When validating, Then trims and normalizes values', () => {
    const result = validateUpdateUserPayload({
      role: 'trainer',
      phone: '  0708091011  ',
      preferredContactChannel: '  phone  ',
      isActive: 0,
    });

    expect(result).toMatchObject({
      valid: true,
      data: {
        role: 'trainer',
        phone: '0708091011',
        preferredContactChannel: 'phone',
        isActive: false,
      },
    });
  });

  it('Given optional text fields as non-string values in update payload, When validating, Then stores null values', () => {
    const result = validateUpdateUserPayload({
      phone: 12345,
      preferredContactChannel: true,
    });

    expect(result).toMatchObject({
      valid: true,
      data: {
        phone: null,
        preferredContactChannel: null,
      },
    });
  });
});
