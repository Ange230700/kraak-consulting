import type { CreateAppUserDto, UpdateAppUserDto } from '@kraak/contracts';

export type { CreateAppUserDto, UpdateAppUserDto };

export function validateCreateUserPayload(
  body: unknown,
): { valid: true; data: CreateAppUserDto } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Corps de requête manquant ou invalide' };
  }

  const payload = body as Record<string, unknown>;

  if (typeof payload['email'] !== 'string' || !payload['email'].trim()) {
    return { valid: false, error: "L'adresse email est obligatoire" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(payload['email'])) {
    return { valid: false, error: "L'adresse email n'est pas valide" };
  }

  if (
    typeof payload['firstName'] !== 'string' ||
    !payload['firstName'].trim()
  ) {
    return { valid: false, error: 'Le prénom est obligatoire' };
  }

  if (typeof payload['lastName'] !== 'string' || !payload['lastName'].trim()) {
    return { valid: false, error: 'Le nom de famille est obligatoire' };
  }

  const allowedRoles = ['participant', 'admin', 'trainer'] as const;
  const role = payload['role'];
  if (!allowedRoles.includes(role as (typeof allowedRoles)[number])) {
    return {
      valid: false,
      error: `Le rôle doit être l'un des suivants : ${allowedRoles.join(', ')}`,
    };
  }

  return {
    valid: true,
    data: {
      email: (payload['email'] as string).trim(),
      firstName: (payload['firstName'] as string).trim(),
      lastName: (payload['lastName'] as string).trim(),
      role: role as CreateAppUserDto['role'],
      phone:
        typeof payload['phone'] === 'string'
          ? payload['phone'].trim() || null
          : null,
      preferredContactChannel:
        typeof payload['preferredContactChannel'] === 'string'
          ? payload['preferredContactChannel'].trim() || null
          : null,
      isActive: payload['isActive'] !== false,
    },
  };
}

export function validateUpdateUserPayload(
  body: unknown,
): { valid: true; data: UpdateAppUserDto } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Corps de requête manquant ou invalide' };
  }

  const payload = body as Record<string, unknown>;
  const data: UpdateAppUserDto = {};

  if (payload['email'] !== undefined) {
    if (typeof payload['email'] !== 'string' || !payload['email'].trim()) {
      return { valid: false, error: "L'adresse email est invalide" };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload['email'])) {
      return { valid: false, error: "L'adresse email n'est pas valide" };
    }
    data.email = payload['email'].trim();
  }

  if (payload['firstName'] !== undefined) {
    if (
      typeof payload['firstName'] !== 'string' ||
      !payload['firstName'].trim()
    ) {
      return { valid: false, error: 'Le prénom est invalide' };
    }
    data.firstName = payload['firstName'].trim();
  }

  if (payload['lastName'] !== undefined) {
    if (
      typeof payload['lastName'] !== 'string' ||
      !payload['lastName'].trim()
    ) {
      return { valid: false, error: 'Le nom de famille est invalide' };
    }
    data.lastName = payload['lastName'].trim();
  }

  if (payload['role'] !== undefined) {
    const allowedRoles = ['participant', 'admin', 'trainer'] as const;
    if (
      !allowedRoles.includes(payload['role'] as (typeof allowedRoles)[number])
    ) {
      return {
        valid: false,
        error: `Le rôle doit être l'un des suivants : ${allowedRoles.join(', ')}`,
      };
    }
    data.role = payload['role'] as UpdateAppUserDto['role'];
  }

  if (payload['phone'] !== undefined) {
    data.phone =
      typeof payload['phone'] === 'string'
        ? payload['phone'].trim() || null
        : null;
  }

  if (payload['preferredContactChannel'] !== undefined) {
    data.preferredContactChannel =
      typeof payload['preferredContactChannel'] === 'string'
        ? payload['preferredContactChannel'].trim() || null
        : null;
  }

  if (payload['isActive'] !== undefined) {
    data.isActive = Boolean(payload['isActive']);
  }

  return { valid: true, data };
}
