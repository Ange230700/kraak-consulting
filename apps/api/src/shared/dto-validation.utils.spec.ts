import {
  isObjectPayload,
  isValidEmail,
  readTrimmedString,
  validateEmail,
} from './dto-validation.utils';

describe('readTrimmedString', () => {
  it('Given une valeur de type string, When readTrimmedString est appelé, Then retourne la valeur sans espaces', () => {
    expect(readTrimmedString('  hello  ')).toBe('hello');
  });

  it('Given une valeur non-string, When readTrimmedString est appelé, Then retourne une chaîne vide', () => {
    expect(readTrimmedString(42)).toBe('');
    expect(readTrimmedString(null)).toBe('');
    expect(readTrimmedString(undefined)).toBe('');
  });
});

describe('isObjectPayload', () => {
  it('Given un objet valide, When isObjectPayload est appelé, Then retourne true', () => {
    expect(isObjectPayload({ key: 'value' })).toBe(true);
  });

  it('Given null, When isObjectPayload est appelé, Then retourne false', () => {
    expect(isObjectPayload(null)).toBe(false);
  });

  it('Given un tableau, When isObjectPayload est appelé, Then retourne false', () => {
    expect(isObjectPayload([])).toBe(false);
  });

  it('Given une chaîne, When isObjectPayload est appelé, Then retourne false', () => {
    expect(isObjectPayload('string')).toBe(false);
  });
});

describe('isValidEmail', () => {
  it('Given un e-mail valide, When isValidEmail est appelé, Then retourne true', () => {
    expect(isValidEmail('user@domain.com')).toBe(true);
  });

  it('Given une chaîne vide, When isValidEmail est appelé, Then retourne false', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('Given un e-mail avec espace, When isValidEmail est appelé, Then retourne false', () => {
    expect(isValidEmail('us er@domain.com')).toBe(false);
  });

  it('Given un e-mail sans domaine (user@), When isValidEmail est appelé, Then retourne false', () => {
    expect(isValidEmail('user@')).toBe(false);
  });

  it('Given un e-mail dont le domaine commence par un point, When isValidEmail est appelé, Then retourne false', () => {
    expect(isValidEmail('user@.domain.com')).toBe(false);
  });

  it('Given un e-mail dont le domaine se termine par un point, When isValidEmail est appelé, Then retourne false', () => {
    expect(isValidEmail('user@domain.')).toBe(false);
  });

  it('Given un e-mail dont le domaine ne contient pas de point, When isValidEmail est appelé, Then retourne false', () => {
    expect(isValidEmail('user@nodotdomain')).toBe(false);
  });

  it('Given un e-mail dont le domaine contient deux points consécutifs, When isValidEmail est appelé, Then retourne false', () => {
    expect(isValidEmail('user@domain..com')).toBe(false);
  });

  it('Given un e-mail avec plusieurs @, When isValidEmail est appelé, Then retourne false', () => {
    expect(isValidEmail('user@@domain.com')).toBe(false);
  });

  it('Given un e-mail sans @, When isValidEmail est appelé, Then retourne false', () => {
    expect(isValidEmail('userdomain.com')).toBe(false);
  });
});

describe('validateEmail', () => {
  it('Given un e-mail valide, When validateEmail est appelé, Then aucune erreur ajoutée', () => {
    const errors: string[] = [];
    validateEmail('user@domain.com', errors);
    expect(errors).toHaveLength(0);
  });

  it('Given un e-mail invalide, When validateEmail est appelé, Then une erreur est ajoutée', () => {
    const errors: string[] = [];
    validateEmail('invalid', errors);
    expect(errors).toContain("L'adresse e-mail est invalide.");
  });

  it('Given une chaîne vide, When validateEmail est appelé, Then une erreur est ajoutée', () => {
    const errors: string[] = [];
    validateEmail('', errors);
    expect(errors).toContain("L'adresse e-mail est invalide.");
  });
});
