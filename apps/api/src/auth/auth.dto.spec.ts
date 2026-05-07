import {
  extractAccessToken,
  validatePasswordResetPayload,
  validateRefreshSessionPayload,
  validateSignInPayload,
  validateSignUpPayload,
} from './auth.dto';

describe('validateSignInPayload', () => {
  // Given un payload de login valide
  // When la validation est appliquée
  // Then les identifiants sont normalisés
  it('Given un payload valide, When la validation signIn est appliquée, Then les identifiants sont normalisés', () => {
    expect(
      validateSignInPayload({
        email: '  alice@example.com  ',
        password: 'motdepasse-securise',
      }),
    ).toEqual({
      valid: true,
      data: {
        email: 'alice@example.com',
        password: 'motdepasse-securise',
      },
    });
  });
});

it('Given un payload non-objet, When la validation signIn est appliquée, Then une erreur est renvoyée', () => {
  expect(validateSignInPayload(null)).toMatchObject({ valid: false });
  expect(validateSignInPayload('string')).toMatchObject({ valid: false });
  expect(validateSignInPayload(42)).toMatchObject({ valid: false });
});

it('Given un email invalide, When la validation signIn est appliquée, Then une erreur email est renvoyée', () => {
  const result = validateSignInPayload({
    email: 'pas-un-email',
    password: 'motdepasse-ok',
  });
  expect(result.valid).toBe(false);
  expect((result as { valid: false; errors: string[] }).errors).toContain(
    "L'adresse e-mail est invalide.",
  );
});

it('Given un mot de passe trop court, When la validation signIn est appliquée, Then une erreur mot de passe est renvoyée', () => {
  const result = validateSignInPayload({
    email: 'alice@example.com',
    password: 'court',
  });
  expect(result.valid).toBe(false);
  expect((result as { valid: false; errors: string[] }).errors).toContain(
    'Le mot de passe doit contenir au moins 8 caractères.',
  );
});

it('Given un mot de passe trop long (>128), When la validation signIn est appliquée, Then une erreur mot de passe est renvoyée', () => {
  const result = validateSignInPayload({
    email: 'alice@example.com',
    password: 'a'.repeat(129),
  });
  expect(result.valid).toBe(false);
  expect((result as { valid: false; errors: string[] }).errors).toContain(
    'Le mot de passe ne peut pas dépasser 128 caractères.',
  );
});

describe('validateSignUpPayload', () => {
  // Given un signup invalide
  // When la validation est appliquée
  // Then les erreurs utilisateur sont explicites
  it('Given un signup invalide, When la validation est appliquée, Then des erreurs explicites sont renvoyées', () => {
    expect(
      validateSignUpPayload({
        email: 'alice',
        password: 'court',
        firstName: ' ',
        lastName: ' ',
        redirectTo: 'pas-un-lien',
      }),
    ).toEqual({
      valid: false,
      errors: [
        "L'adresse e-mail est invalide.",
        'Le mot de passe doit contenir au moins 8 caractères.',
        'Le prénom est requis.',
        'Le nom est requis.',
        'Le lien de redirection est invalide.',
      ],
    });
  });
});

describe('validateRefreshSessionPayload', () => {
  it('Given un payload refresh valide, When la validation est appliquée, Then le refresh token est normalisé', () => {
    expect(
      validateRefreshSessionPayload({
        refreshToken: '  refresh-token  ',
      }),
    ).toEqual({
      valid: true,
      data: {
        refreshToken: 'refresh-token',
      },
    });
  });
});

describe('validatePasswordResetPayload', () => {
  it('Given une demande de reset valide, When la validation est appliquée, Then le payload est normalisé', () => {
    expect(
      validatePasswordResetPayload({
        email: '  alice@example.com  ',
        redirectTo: 'kraak://auth/reset',
      }),
    ).toEqual({
      valid: true,
      data: {
        email: 'alice@example.com',
        redirectTo: 'kraak://auth/reset',
      },
    });
  });
});

describe('extractAccessToken', () => {
  // Given un header Bearer valide
  // When le token est extrait
  // Then seule la valeur du token est conservée
  it('Given un header Bearer valide, When le token est extrait, Then seule la valeur utile est conservée', () => {
    expect(extractAccessToken('Bearer access-token')).toEqual({
      valid: true,
      data: 'access-token',
    });
  });

  // Given un header invalide
  // When le token est extrait
  // Then une erreur d'authentification explicite est renvoyée
  it('Given un header invalide, When le token est extrait, Then une erreur explicite est renvoyée', () => {
    expect(extractAccessToken('Token access-token')).toEqual({
      valid: false,
      error: "Le header d'autorisation Bearer est requis.",
    });
  });
});

// --- validateSignUpPayload additional tests ---

it('Given un payload signup non-objet, When la validation est appliquée, Then une erreur est renvoyée', () => {
  expect(validateSignUpPayload(null)).toMatchObject({ valid: false });
  expect(validateSignUpPayload('string')).toMatchObject({ valid: false });
});

it('Given un payload signup valide complet, When la validation est appliquée, Then le payload normalisé est renvoyé', () => {
  const result = validateSignUpPayload({
    email: '  alice@example.com  ',
    password: 'motdepasse-securise',
    firstName: '  Alice  ',
    lastName: '  Dupont  ',
    phone: '+33600000000',
    preferredContactChannel: 'email',
    redirectTo: 'kraak://auth/callback',
  });
  expect(result.valid).toBe(true);
  const data = (result as { valid: true; data: Record<string, unknown> }).data;
  expect(data['email']).toBe('alice@example.com');
  expect(data['firstName']).toBe('Alice');
  expect(data['lastName']).toBe('Dupont');
  expect(data['phone']).toBe('+33600000000');
  expect(data['redirectTo']).toBe('kraak://auth/callback');
});

it('Given un mot de passe trop long dans signup (>128), When la validation est appliquée, Then une erreur est renvoyée', () => {
  const result = validateSignUpPayload({
    email: 'alice@example.com',
    password: 'a'.repeat(129),
    firstName: 'Alice',
    lastName: 'Dupont',
  });
  expect(result.valid).toBe(false);
  expect((result as { valid: false; errors: string[] }).errors).toContain(
    'Le mot de passe ne peut pas dépasser 128 caractères.',
  );
});

it('Given un prénom trop long (>80) dans signup, When la validation est appliquée, Then une erreur est renvoyée', () => {
  const result = validateSignUpPayload({
    email: 'alice@example.com',
    password: 'motdepasse-securise',
    firstName: 'A'.repeat(81),
    lastName: 'Dupont',
  });
  expect(result.valid).toBe(false);
  expect(
    (result as { valid: false; errors: string[] }).errors.some((e) =>
      e.includes('prénom'),
    ),
  ).toBe(true);
});

it('Given un téléphone trop long (>40) dans signup, When la validation est appliquée, Then le téléphone est tronqué', () => {
  const longPhone = '0'.repeat(50);
  const result = validateSignUpPayload({
    email: 'alice@example.com',
    password: 'motdepasse-securise',
    firstName: 'Alice',
    lastName: 'Dupont',
    phone: longPhone,
  });
  expect(result.valid).toBe(true);
  const phone = (result as { valid: true; data: { phone?: string } }).data
    .phone;
  expect(phone?.length).toBeLessThanOrEqual(40);
});

it('Given une URL de redirection invalide dans signup, When la validation est appliquée, Then une erreur est renvoyée', () => {
  const result = validateSignUpPayload({
    email: 'alice@example.com',
    password: 'motdepasse-securise',
    firstName: 'Alice',
    lastName: 'Dupont',
    redirectTo: 'pas-un-lien',
  });
  expect(result.valid).toBe(false);
  expect((result as { valid: false; errors: string[] }).errors).toContain(
    'Le lien de redirection est invalide.',
  );
});

// --- validateRefreshSessionPayload additional tests ---

it('Given un payload refresh non-objet, When la validation est appliquée, Then une erreur est renvoyée', () => {
  expect(validateRefreshSessionPayload(null)).toMatchObject({ valid: false });
  expect(validateRefreshSessionPayload(42)).toMatchObject({ valid: false });
});

it('Given un refreshToken manquant, When la validation est appliquée, Then une erreur est renvoyée', () => {
  const result = validateRefreshSessionPayload({ refreshToken: '' });
  expect(result.valid).toBe(false);
  expect((result as { valid: false; errors: string[] }).errors).toContain(
    'Le refresh token est requis.',
  );
});

it('Given un refreshToken absent (clé manquante), When la validation est appliquée, Then une erreur est renvoyée', () => {
  const result = validateRefreshSessionPayload({});
  expect(result.valid).toBe(false);
});

// --- validatePasswordResetPayload additional tests ---

it('Given un payload reset non-objet, When la validation est appliquée, Then une erreur est renvoyée', () => {
  expect(validatePasswordResetPayload(null)).toMatchObject({ valid: false });
  expect(validatePasswordResetPayload(42)).toMatchObject({ valid: false });
});

it('Given un email invalide dans reset, When la validation est appliquée, Then une erreur est renvoyée', () => {
  const result = validatePasswordResetPayload({ email: 'pas-un-email' });
  expect(result.valid).toBe(false);
  expect((result as { valid: false; errors: string[] }).errors).toContain(
    "L'adresse e-mail est invalide.",
  );
});

it('Given une demande de reset sans redirectTo, When la validation est appliquée, Then le payload est valide', () => {
  const result = validatePasswordResetPayload({ email: 'alice@example.com' });
  expect(result.valid).toBe(true);
  const resetData = (
    result as {
      valid: true;
      data: { email: string; redirectTo: string | null };
    }
  ).data;
  expect(resetData.email).toBe('alice@example.com');
  expect(resetData.redirectTo).toBeNull();
});

it('Given une URL de redirection invalide dans reset, When la validation est appliquée, Then une erreur est renvoyée', () => {
  const result = validatePasswordResetPayload({
    email: 'alice@example.com',
    redirectTo: 'pas-un-lien',
  });
  expect(result.valid).toBe(false);
  expect((result as { valid: false; errors: string[] }).errors).toContain(
    'Le lien de redirection est invalide.',
  );
});

// --- extractAccessToken additional tests ---

it('Given undefined, When le token est extrait, Then une erreur explicite est renvoyée', () => {
  expect(extractAccessToken(undefined)).toEqual({
    valid: false,
    error: "Le header d'autorisation Bearer est requis.",
  });
});

it('Given une chaîne vide, When le token est extrait, Then une erreur explicite est renvoyée', () => {
  expect(extractAccessToken('')).toEqual({
    valid: false,
    error: "Le header d'autorisation Bearer est requis.",
  });
});

it('Given "Bearer token extra" (parties multiples), When le token est extrait, Then une erreur explicite est renvoyée', () => {
  expect(extractAccessToken('Bearer access-token extra-part')).toEqual({
    valid: false,
    error: "Le header d'autorisation Bearer est requis.",
  });
});

it('Given "Bearer" sans token, When le token est extrait, Then une erreur explicite est renvoyée', () => {
  expect(extractAccessToken('Bearer')).toEqual({
    valid: false,
    error: "Le header d'autorisation Bearer est requis.",
  });
});

it('Given "Bearer   " (token uniquement whitespace), When le token est extrait, Then une erreur explicite est renvoyée', () => {
  expect(extractAccessToken('Bearer   ')).toEqual({
    valid: false,
    error: "Le header d'autorisation Bearer est requis.",
  });
});

// --- Branches manquantes : password non-string ---

it('Given un password non-string (number) dans signIn, When la validation est appliquée, Then password vaut chaîne vide et une erreur longueur est renvoyée', () => {
  const result = validateSignInPayload({
    email: 'alice@example.com',
    password: 12345678,
  });
  expect(result.valid).toBe(false);
  expect((result as { valid: false; errors: string[] }).errors).toContain(
    'Le mot de passe doit contenir au moins 8 caractères.',
  );
});

it('Given un password non-string (number) dans signUp, When la validation est appliquée, Then password vaut chaîne vide et une erreur longueur est renvoyée', () => {
  const result = validateSignUpPayload({
    email: 'alice@example.com',
    password: 12345678,
    firstName: 'Alice',
    lastName: 'Dupont',
  });
  expect(result.valid).toBe(false);
  expect((result as { valid: false; errors: string[] }).errors).toContain(
    'Le mot de passe doit contenir au moins 8 caractères.',
  );
});
