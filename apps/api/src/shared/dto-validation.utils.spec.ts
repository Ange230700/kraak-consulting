import {
  assignOptionalTrimmedString,
  assignRequiredTrimmedString,
  isObjectPayload,
  isValidEmail,
  readNullableDateTime,
  readNullableString,
  readTrimmedString,
  validateAssignedPayload,
  validateEmail,
} from './dto-validation.utils';
import { apiMessage } from '../i18n/api-message';

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

describe('readNullableDateTime', () => {
  it('Given une valeur null, When readNullableDateTime est appelé, Then retourne null', () => {
    expect(readNullableDateTime(null)).toBeNull();
  });

  it('Given une chaîne vide après trim, When readNullableDateTime est appelé, Then retourne null', () => {
    expect(readNullableDateTime('   ')).toBeNull();
  });

  it('Given une date valide, When elle est normalisée, Then son format ISO est retourné', () => {
    expect(readNullableDateTime(' 2026-10-26T12:00:00Z ')).toBe(
      '2026-10-26T12:00:00.000Z',
    );
  });

  it('Given une date invalide, When elle est normalisée, Then aucune date n’est retournée', () => {
    expect(readNullableDateTime('date-invalide')).toBeNull();
  });
});

describe('readNullableString', () => {
  it.each([
    [null, null],
    ['   ', null],
    [' Texte ', 'Texte'],
  ])(
    'Given la valeur %p, When elle est normalisée, Then le résultat est %p',
    (value, expected) => {
      expect(readNullableString(value)).toBe(expected);
    },
  );
});

describe.each([
  ['required', assignRequiredTrimmedString],
  ['optional', assignOptionalTrimmedString],
] as const)('Given un champ texte %s', (mode, assign) => {
  it('When une valeur non vide est fournie, Then elle est affectée sans espaces', () => {
    const errors: string[] = [];
    const data: { title?: string } = {};
    assign({ title: ' Titre ' }, 'title', errors, data);
    expect(data).toEqual({ title: 'Titre' });
    expect(errors).toEqual([]);
  });

  it('When une valeur vide est fournie, Then une erreur de champ requis est conservée', () => {
    const errors: string[] = [];
    const data: { title?: string } = {};
    assign({ title: ' ' }, 'title', errors, data);
    expect(data).toEqual({});
    expect(errors).toEqual([
      apiMessage('validation.requiredField', { field: 'title' }),
    ]);
  });

  it('When le champ est absent, Then seule une obligation de création produit une erreur', () => {
    const errors: string[] = [];
    const data: { title?: string } = {};
    assign({}, 'title', errors, data);
    expect(data).toEqual({});
    expect(errors).toEqual(
      mode === 'required'
        ? [apiMessage('validation.requiredField', { field: 'title' })]
        : [],
    );
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

  describe('validateAssignedPayload', () => {
    it.each([null, [], 'texte', 42])(
      'Given un corps non objet (%p), When ses champs sont validés, Then le corps est rejeté sans affectation',
      (body) => {
        const assign = jest.fn();
        expect(validateAssignedPayload(body, assign, 'create')).toEqual({
          valid: false,
          errors: [apiMessage('validation.invalidBody')],
        });
        expect(assign).not.toHaveBeenCalled();
      },
    );

    it('Given des champs normalisés, When le corps est validé, Then seules les données affectées sont retournées', () => {
      expect(
        validateAssignedPayload(
          { title: ' Titre ', ignored: true },
          (body, _errors, data) => {
            data['title'] = (body['title'] as string).trim();
          },
          'create',
        ),
      ).toEqual({ valid: true, data: { title: 'Titre' } });
    });

    it.each(['create', 'update'] as const)(
      'Given une erreur de champ en mode %s, When aucune donnée n’est affectée, Then l’erreur initiale est préservée',
      (mode) => {
        const error = apiMessage('validation.invalidField', { field: 'title' });
        expect(
          validateAssignedPayload(
            {},
            (_body, errors) => errors.push(error),
            mode,
          ),
        ).toEqual({ valid: false, errors: [error] });
      },
    );

    it('Given une mise à jour sans champ reconnu, When le corps est validé, Then un champ modifiable est exigé', () => {
      expect(
        validateAssignedPayload({ ignored: true }, jest.fn(), 'update'),
      ).toEqual({
        valid: false,
        errors: [apiMessage('validation.updateRequiresField')],
      });
    });

    it('Given une création sans champ affecté, When le validateur ne signale aucune erreur, Then les données vides sont acceptées', () => {
      expect(validateAssignedPayload({}, jest.fn(), 'create')).toEqual({
        valid: true,
        data: {},
      });
    });

    it('Given une mise à jour reconnue, When un champ est affecté, Then les données sont acceptées', () => {
      expect(
        validateAssignedPayload(
          { title: 'Titre' },
          (body, _errors, data) => {
            data['title'] = body['title'];
          },
          'update',
        ),
      ).toEqual({ valid: true, data: { title: 'Titre' } });
    });
  });

  it('Given un e-mail invalide, When validateEmail est appelé, Then une erreur est ajoutée', () => {
    const errors: string[] = [];
    validateEmail('invalid', errors);
    expect(errors).toContainEqual({
      key: 'validation.invalidEmail',
    });
  });

  it('Given une chaîne vide, When validateEmail est appelé, Then une erreur est ajoutée', () => {
    const errors: string[] = [];
    validateEmail('', errors);
    expect(errors).toContainEqual({
      key: 'validation.invalidEmail',
    });
  });
});
