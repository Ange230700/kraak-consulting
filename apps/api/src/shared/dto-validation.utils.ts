export function readTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
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
