export function readTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function readNullableString(value: unknown): string | null {
  if (value === null) {
    return null;
  }

  const normalized = readTrimmedString(value);
  return normalized.length > 0 ? normalized : null;
}

export function readNullableDateTime(value: unknown): string | null {
  if (value === null) {
    return null;
  }

  const normalized = readTrimmedString(value);

  if (!normalized) {
    return null;
  }

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function isObjectPayload(
  body: unknown,
): body is Record<string, unknown> {
  return Boolean(body) && typeof body === 'object' && !Array.isArray(body);
}

export function isValidEmail(email: string): boolean {
  if (!email) {
    return false;
  }

  for (const character of email) {
    if (character.trim().length === 0) {
      return false;
    }
  }

  const atIndex = email.indexOf('@');

  if (atIndex <= 0 || atIndex !== email.lastIndexOf('@')) {
    return false;
  }

  const localPart = email.slice(0, atIndex);
  const domainPart = email.slice(atIndex + 1);

  if (!localPart || !domainPart) {
    return false;
  }

  if (domainPart.startsWith('.') || domainPart.endsWith('.')) {
    return false;
  }

  const dotIndex = domainPart.indexOf('.');

  if (dotIndex <= 0 || dotIndex === domainPart.length - 1) {
    return false;
  }

  if (domainPart.includes('..')) {
    return false;
  }

  return true;
}

export function validateEmail(email: string, errors: string[]): void {
  if (!email || !isValidEmail(email)) {
    errors.push("L'adresse e-mail est invalide.");
  }
}

export function assignRequiredTrimmedString<
  T extends object,
  K extends keyof T,
>(
  body: Record<string, unknown>,
  field: K,
  errors: string[],
  updates: Partial<T>,
): void {
  if (!(field in body)) {
    errors.push(`Le champ ${String(field)} est requis.`);
    return;
  }

  const value = readTrimmedString(body[field as string]);

  if (!value) {
    errors.push(`Le champ ${String(field)} est requis.`);
    return;
  }

  (updates as Record<string, unknown>)[field as string] = value;
}

export function assignOptionalTrimmedString<
  T extends object,
  K extends keyof T,
>(body: Record<string, unknown>, field: K, errors: string[], updates: T): void {
  if (!(field in body)) {
    return;
  }

  const value = readTrimmedString(body[field as string]);

  if (!value) {
    errors.push(`Le champ ${String(field)} est requis.`);
    return;
  }

  (updates as Record<string, unknown>)[field as string] = value;
}
