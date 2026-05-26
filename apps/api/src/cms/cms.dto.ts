import type {
  CreatePartnerDto,
  CreateStatisticDto,
  CreateTeamMemberDto,
  CreateTestimonialDto,
  UpdatePartnerDto,
  UpdateStatisticDto,
  UpdateTeamMemberDto,
  UpdateTestimonialDto,
} from '@kraak/contracts';
import {
  isObjectPayload,
  readTrimmedString,
} from '../shared/dto-validation.utils';
import type { ValidationResult } from '../shared/validation-result.type';

const publicationStatuses = new Set(['draft', 'published', 'archived']);

function readNullableString(value: unknown): string | null {
  if (value === null) {
    return null;
  }

  const normalized = readTrimmedString(value);
  return normalized.length > 0 ? normalized : null;
}

function readNullableUrl(value: unknown): {
  value: string | null;
  isInvalid: boolean;
} {
  if (value === null) {
    return { value: null, isInvalid: false };
  }

  const normalized = readTrimmedString(value);
  if (!normalized) {
    return { value: null, isInvalid: false };
  }

  try {
    new URL(normalized);
    return { value: normalized, isInvalid: false };
  } catch {
    return { value: null, isInvalid: true };
  }
}

function readNonNegativeInteger(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
    return value;
  }

  const normalized = readTrimmedString(value);
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function readStatus(value: unknown): string | null {
  const status = readTrimmedString(value);
  return publicationStatuses.has(status) ? status : null;
}

export function validateCreateStatisticPayload(
  body: unknown,
): ValidationResult<CreateStatisticDto> {
  if (!isObjectPayload(body)) {
    return { valid: false, errors: ['Corps de requête invalide.'] };
  }

  const label = readTrimmedString(body['label']);
  const value = readTrimmedString(body['value']);
  const suffix = readNullableString(body['suffix']);
  const sortOrder = readNonNegativeInteger(body['sortOrder']);
  const status = readStatus(body['status']);

  const errors: string[] = [];

  if (!label) {
    errors.push('Le champ label est requis.');
  }

  if (!value) {
    errors.push('Le champ value est requis.');
  }

  if (sortOrder === null) {
    errors.push('Le champ sortOrder doit être un entier positif ou nul.');
  }

  if (!status) {
    errors.push('Le champ status est invalide.');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const normalizedSortOrder = sortOrder as number;

  return {
    valid: true,
    data: {
      label,
      value,
      suffix,
      sortOrder: normalizedSortOrder,
      status: status as CreateStatisticDto['status'],
    },
  };
}

export function validateUpdateStatisticPayload(
  body: unknown,
): ValidationResult<UpdateStatisticDto> {
  if (!isObjectPayload(body)) {
    return { valid: false, errors: ['Corps de requête invalide.'] };
  }

  const data: UpdateStatisticDto = {};
  const errors: string[] = [];

  if ('label' in body) {
    const label = readTrimmedString(body['label']);
    if (!label) {
      errors.push('Le champ label est requis.');
    } else {
      data.label = label;
    }
  }

  if ('value' in body) {
    const value = readTrimmedString(body['value']);
    if (!value) {
      errors.push('Le champ value est requis.');
    } else {
      data.value = value;
    }
  }

  if ('suffix' in body) {
    data.suffix = readNullableString(body['suffix']);
  }

  if ('sortOrder' in body) {
    const sortOrder = readNonNegativeInteger(body['sortOrder']);
    if (sortOrder === null) {
      errors.push('Le champ sortOrder doit être un entier positif ou nul.');
    } else {
      data.sortOrder = sortOrder;
    }
  }

  if ('status' in body) {
    const status = readStatus(body['status']);
    if (!status) {
      errors.push('Le champ status est invalide.');
    } else {
      data.status = status as UpdateStatisticDto['status'];
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  if (Object.keys(data).length === 0) {
    return {
      valid: false,
      errors: ['Le payload de mise à jour doit contenir au moins un champ.'],
    };
  }

  return { valid: true, data };
}

export function validateCreatePartnerPayload(
  body: unknown,
): ValidationResult<CreatePartnerDto> {
  if (!isObjectPayload(body)) {
    return { valid: false, errors: ['Corps de requête invalide.'] };
  }

  const name = readTrimmedString(body['name']);
  const logoUrlResult = readNullableUrl(body['logoUrl']);
  const websiteUrlResult = readNullableUrl(body['websiteUrl']);
  const sortOrder = readNonNegativeInteger(body['sortOrder']);
  const status = readStatus(body['status']);
  const errors: string[] = [];

  if (!name) {
    errors.push('Le champ name est requis.');
  }

  if (logoUrlResult.value === null || logoUrlResult.isInvalid) {
    errors.push('Le champ logoUrl est requis et doit être une URL valide.');
  }

  if (websiteUrlResult.isInvalid) {
    errors.push('Le champ websiteUrl est invalide.');
  }

  if (sortOrder === null) {
    errors.push('Le champ sortOrder doit être un entier positif ou nul.');
  }

  if (!status) {
    errors.push('Le champ status est invalide.');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const normalizedSortOrder = sortOrder as number;
  const normalizedLogoUrl = logoUrlResult.value as string;

  return {
    valid: true,
    data: {
      name,
      logoUrl: normalizedLogoUrl,
      websiteUrl: websiteUrlResult.value,
      sortOrder: normalizedSortOrder,
      status: status as CreatePartnerDto['status'],
    },
  };
}

export function validateUpdatePartnerPayload(
  body: unknown,
): ValidationResult<UpdatePartnerDto> {
  if (!isObjectPayload(body)) {
    return { valid: false, errors: ['Corps de requête invalide.'] };
  }

  const data: UpdatePartnerDto = {};
  const errors: string[] = [];

  if ('name' in body) {
    const name = readTrimmedString(body['name']);
    if (!name) {
      errors.push('Le champ name est requis.');
    } else {
      data.name = name;
    }
  }

  if ('logoUrl' in body) {
    const logoUrl = readNullableUrl(body['logoUrl']);
    if (logoUrl.value === null || logoUrl.isInvalid) {
      errors.push('Le champ logoUrl est requis et doit être une URL valide.');
    } else {
      data.logoUrl = logoUrl.value;
    }
  }

  if ('websiteUrl' in body) {
    const websiteUrl = readNullableUrl(body['websiteUrl']);
    if (websiteUrl.isInvalid) {
      errors.push('Le champ websiteUrl est invalide.');
    } else {
      data.websiteUrl = websiteUrl.value;
    }
  }

  if ('sortOrder' in body) {
    const sortOrder = readNonNegativeInteger(body['sortOrder']);
    if (sortOrder === null) {
      errors.push('Le champ sortOrder doit être un entier positif ou nul.');
    } else {
      data.sortOrder = sortOrder;
    }
  }

  if ('status' in body) {
    const status = readStatus(body['status']);
    if (!status) {
      errors.push('Le champ status est invalide.');
    } else {
      data.status = status as UpdatePartnerDto['status'];
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  if (Object.keys(data).length === 0) {
    return {
      valid: false,
      errors: ['Le payload de mise à jour doit contenir au moins un champ.'],
    };
  }

  return { valid: true, data };
}

export function validateCreateTestimonialPayload(
  body: unknown,
): ValidationResult<CreateTestimonialDto> {
  if (!isObjectPayload(body)) {
    return { valid: false, errors: ['Corps de requête invalide.'] };
  }

  const quote = readTrimmedString(body['quote']);
  const authorName = readTrimmedString(body['authorName']);
  const authorRole = readNullableString(body['authorRole']);
  const company = readNullableString(body['company']);
  const avatarUrlResult = readNullableUrl(body['avatarUrl']);
  const sortOrder = readNonNegativeInteger(body['sortOrder']);
  const status = readStatus(body['status']);
  const errors: string[] = [];

  if (!quote) {
    errors.push('Le champ quote est requis.');
  }

  if (!authorName) {
    errors.push('Le champ authorName est requis.');
  }

  if (avatarUrlResult.isInvalid) {
    errors.push('Le champ avatarUrl est invalide.');
  }

  if (sortOrder === null) {
    errors.push('Le champ sortOrder doit être un entier positif ou nul.');
  }

  if (!status) {
    errors.push('Le champ status est invalide.');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const normalizedSortOrder = sortOrder as number;

  return {
    valid: true,
    data: {
      quote,
      authorName,
      authorRole,
      company,
      avatarUrl: avatarUrlResult.value,
      sortOrder: normalizedSortOrder,
      status: status as CreateTestimonialDto['status'],
    },
  };
}

export function validateUpdateTestimonialPayload(
  body: unknown,
): ValidationResult<UpdateTestimonialDto> {
  if (!isObjectPayload(body)) {
    return { valid: false, errors: ['Corps de requête invalide.'] };
  }

  const data: UpdateTestimonialDto = {};
  const errors: string[] = [];

  if ('quote' in body) {
    const quote = readTrimmedString(body['quote']);
    if (!quote) {
      errors.push('Le champ quote est requis.');
    } else {
      data.quote = quote;
    }
  }

  if ('authorName' in body) {
    const authorName = readTrimmedString(body['authorName']);
    if (!authorName) {
      errors.push('Le champ authorName est requis.');
    } else {
      data.authorName = authorName;
    }
  }

  if ('authorRole' in body) {
    data.authorRole = readNullableString(body['authorRole']);
  }

  if ('company' in body) {
    data.company = readNullableString(body['company']);
  }

  if ('avatarUrl' in body) {
    const avatarUrl = readNullableUrl(body['avatarUrl']);
    if (avatarUrl.isInvalid) {
      errors.push('Le champ avatarUrl est invalide.');
    } else {
      data.avatarUrl = avatarUrl.value;
    }
  }

  if ('sortOrder' in body) {
    const sortOrder = readNonNegativeInteger(body['sortOrder']);
    if (sortOrder === null) {
      errors.push('Le champ sortOrder doit être un entier positif ou nul.');
    } else {
      data.sortOrder = sortOrder;
    }
  }

  if ('status' in body) {
    const status = readStatus(body['status']);
    if (!status) {
      errors.push('Le champ status est invalide.');
    } else {
      data.status = status as UpdateTestimonialDto['status'];
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  if (Object.keys(data).length === 0) {
    return {
      valid: false,
      errors: ['Le payload de mise à jour doit contenir au moins un champ.'],
    };
  }

  return { valid: true, data };
}

export function validateCreateTeamMemberPayload(
  body: unknown,
): ValidationResult<CreateTeamMemberDto> {
  if (!isObjectPayload(body)) {
    return { valid: false, errors: ['Corps de requête invalide.'] };
  }

  const fullName = readTrimmedString(body['fullName']);
  const role = readTrimmedString(body['role']);
  const bio = readNullableString(body['bio']);
  const avatarUrlResult = readNullableUrl(body['avatarUrl']);
  const linkedinUrlResult = readNullableUrl(body['linkedinUrl']);
  const sortOrder = readNonNegativeInteger(body['sortOrder']);
  const status = readStatus(body['status']);
  const errors: string[] = [];

  if (!fullName) {
    errors.push('Le champ fullName est requis.');
  }

  if (!role) {
    errors.push('Le champ role est requis.');
  }

  if (avatarUrlResult.isInvalid) {
    errors.push('Le champ avatarUrl est invalide.');
  }

  if (linkedinUrlResult.isInvalid) {
    errors.push('Le champ linkedinUrl est invalide.');
  }

  if (sortOrder === null) {
    errors.push('Le champ sortOrder doit être un entier positif ou nul.');
  }

  if (!status) {
    errors.push('Le champ status est invalide.');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const normalizedSortOrder = sortOrder as number;

  return {
    valid: true,
    data: {
      fullName,
      role,
      bio,
      avatarUrl: avatarUrlResult.value,
      linkedinUrl: linkedinUrlResult.value,
      sortOrder: normalizedSortOrder,
      status: status as CreateTeamMemberDto['status'],
    },
  };
}

export function validateUpdateTeamMemberPayload(
  body: unknown,
): ValidationResult<UpdateTeamMemberDto> {
  if (!isObjectPayload(body)) {
    return { valid: false, errors: ['Corps de requête invalide.'] };
  }

  const data: UpdateTeamMemberDto = {};
  const errors: string[] = [];

  if ('fullName' in body) {
    const fullName = readTrimmedString(body['fullName']);
    if (!fullName) {
      errors.push('Le champ fullName est requis.');
    } else {
      data.fullName = fullName;
    }
  }

  if ('role' in body) {
    const role = readTrimmedString(body['role']);
    if (!role) {
      errors.push('Le champ role est requis.');
    } else {
      data.role = role;
    }
  }

  if ('bio' in body) {
    data.bio = readNullableString(body['bio']);
  }

  if ('avatarUrl' in body) {
    const avatarUrl = readNullableUrl(body['avatarUrl']);
    if (avatarUrl.isInvalid) {
      errors.push('Le champ avatarUrl est invalide.');
    } else {
      data.avatarUrl = avatarUrl.value;
    }
  }

  if ('linkedinUrl' in body) {
    const linkedinUrl = readNullableUrl(body['linkedinUrl']);
    if (linkedinUrl.isInvalid) {
      errors.push('Le champ linkedinUrl est invalide.');
    } else {
      data.linkedinUrl = linkedinUrl.value;
    }
  }

  if ('sortOrder' in body) {
    const sortOrder = readNonNegativeInteger(body['sortOrder']);
    if (sortOrder === null) {
      errors.push('Le champ sortOrder doit être un entier positif ou nul.');
    } else {
      data.sortOrder = sortOrder;
    }
  }

  if ('status' in body) {
    const status = readStatus(body['status']);
    if (!status) {
      errors.push('Le champ status est invalide.');
    } else {
      data.status = status as UpdateTeamMemberDto['status'];
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  if (Object.keys(data).length === 0) {
    return {
      valid: false,
      errors: ['Le payload de mise à jour doit contenir au moins un champ.'],
    };
  }

  return { valid: true, data };
}
