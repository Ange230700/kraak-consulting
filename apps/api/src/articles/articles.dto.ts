import type { CreateArticleDto, UpdateArticleDto } from '@kraak/contracts';
import {
  isObjectPayload,
  readTrimmedString,
} from '../shared/dto-validation.utils';

type ValidationSuccess<T> = {
  valid: true;
  data: T;
};

type ValidationFailure = {
  valid: false;
  errors: string[];
};

type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

const publicationStatuses = new Set(['draft', 'published', 'archived']);

function readNullableString(value: unknown): string | null {
  const normalized = readTrimmedString(value);
  return normalized || null;
}

function readNullableUrl(value: unknown): string | null {
  const normalized = readTrimmedString(value);
  if (!normalized) {
    return null;
  }

  try {
    new URL(normalized);
    return normalized;
  } catch {
    return null;
  }
}

function readNullableDate(value: unknown): string | null {
  const normalized = readTrimmedString(value);
  if (!normalized) {
    return null;
  }

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry) => readTrimmedString(entry)).filter(Boolean);
}

function assignRequiredStringUpdate(
  body: Record<string, unknown>,
  sourceKey: Extract<keyof UpdateArticleDto, string>,
  errors: string[],
  updates: UpdateArticleDto,
): void {
  if (!(sourceKey in body)) {
    return;
  }

  const value = readTrimmedString(body[sourceKey]);

  if (value.length === 0) {
    errors.push(`Le champ ${sourceKey} est requis.`);
    return;
  }

  updates[sourceKey] = value as never;
}

function assignStatusUpdate(
  body: Record<string, unknown>,
  errors: string[],
  updates: UpdateArticleDto,
): void {
  if (!('status' in body)) {
    return;
  }

  const status = readTrimmedString(body['status']);

  if (publicationStatuses.has(status) === false) {
    errors.push('Le champ status est invalide.');
    return;
  }

  updates.status = status as UpdateArticleDto['status'];
}

function assignArrayUpdate(
  body: Record<string, unknown>,
  field: 'categoryIds' | 'tagIds',
  errors: string[],
  updates: UpdateArticleDto,
): void {
  if (!(field in body)) {
    return;
  }

  const values = readStringArray(body[field]);

  if (values.length === 0) {
    errors.push(`Le champ ${field} doit contenir au moins une valeur.`);
    return;
  }

  updates[field] = values;
}

function assignNullableStringUpdate(
  body: Record<string, unknown>,
  field: 'seoTitle' | 'seoDescription',
  updates: UpdateArticleDto,
): void {
  if (!(field in body)) {
    return;
  }

  updates[field] = readNullableString(body[field]);
}

function assignNullableUrlUpdate(
  body: Record<string, unknown>,
  updates: UpdateArticleDto,
): void {
  if (!('coverImageUrl' in body)) {
    return;
  }

  updates.coverImageUrl =
    body['coverImageUrl'] === null
      ? null
      : readNullableUrl(body['coverImageUrl']);
}

function assignNullableDateUpdate(
  body: Record<string, unknown>,
  updates: UpdateArticleDto,
): void {
  if (!('publishedAt' in body)) {
    return;
  }

  updates.publishedAt =
    body['publishedAt'] === null ? null : readNullableDate(body['publishedAt']);
}

function validateRequiredText(
  value: string,
  fieldName: Extract<keyof CreateArticleDto, string>,
  errors: string[],
): void {
  if (!value) {
    errors.push(`Le champ ${fieldName} est requis.`);
  }
}

function validateStatus(value: string, errors: string[]): void {
  if (!publicationStatuses.has(value)) {
    errors.push('Le champ status est invalide.');
  }
}

export function validateCreateArticlePayload(
  body: unknown,
): ValidationResult<CreateArticleDto> {
  if (!isObjectPayload(body)) {
    return {
      valid: false,
      errors: ['Corps de requête invalide.'],
    };
  }

  const slug = readTrimmedString(body['slug']);
  const title = readTrimmedString(body['title']);
  const excerpt = readTrimmedString(body['excerpt']);
  const content = readTrimmedString(body['content']);
  const status = readTrimmedString(body['status']);
  const coverImageUrl = readNullableUrl(body['coverImageUrl']);
  const seoTitle = readNullableString(body['seoTitle']);
  const seoDescription = readNullableString(body['seoDescription']);
  const publishedAt =
    body['publishedAt'] === null ? null : readNullableDate(body['publishedAt']);
  const authorId = readTrimmedString(body['authorId']);
  const categoryIds = readStringArray(body['categoryIds']);
  const tagIds = readStringArray(body['tagIds']);

  const errors: string[] = [];

  validateRequiredText(slug, 'slug', errors);
  validateRequiredText(title, 'title', errors);
  validateRequiredText(excerpt, 'excerpt', errors);
  validateRequiredText(content, 'content', errors);
  validateRequiredText(authorId, 'authorId', errors);
  validateStatus(status, errors);

  if (categoryIds.length === 0) {
    errors.push('Le champ categoryIds doit contenir au moins une valeur.');
  }

  if (tagIds.length === 0) {
    errors.push('Le champ tagIds doit contenir au moins une valeur.');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      slug,
      title,
      excerpt,
      content,
      status: status as CreateArticleDto['status'],
      coverImageUrl,
      seoTitle,
      seoDescription,
      publishedAt,
      authorId,
      categoryIds,
      tagIds,
    },
  };
}

export function validateUpdateArticlePayload(
  body: unknown,
): ValidationResult<UpdateArticleDto> {
  if (!isObjectPayload(body)) {
    return {
      valid: false,
      errors: ['Corps de requête invalide.'],
    };
  }

  const updates: UpdateArticleDto = {};
  const errors: string[] = [];

  assignRequiredStringUpdate(body, 'slug', errors, updates);
  assignRequiredStringUpdate(body, 'title', errors, updates);
  assignRequiredStringUpdate(body, 'excerpt', errors, updates);
  assignRequiredStringUpdate(body, 'content', errors, updates);
  assignRequiredStringUpdate(body, 'authorId', errors, updates);
  assignStatusUpdate(body, errors, updates);
  assignNullableUrlUpdate(body, updates);
  assignNullableStringUpdate(body, 'seoTitle', updates);
  assignNullableStringUpdate(body, 'seoDescription', updates);
  assignNullableDateUpdate(body, updates);
  assignArrayUpdate(body, 'categoryIds', errors, updates);
  assignArrayUpdate(body, 'tagIds', errors, updates);

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  if (Object.keys(updates).length === 0) {
    return {
      valid: false,
      errors: ['Au moins un champ doit être fourni pour la mise à jour.'],
    };
  }

  return {
    valid: true,
    data: updates,
  };
}
