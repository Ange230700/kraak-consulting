import type {
  CreateArticleDto,
  CreateCategoryDto,
  CreateTagDto,
  UpdateArticleDto,
  UpdateCategoryDto,
  UpdateTagDto,
} from '@kraak/contracts';
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

function readNullableUrl(value: unknown): {
  value: string | null;
  isInvalid: boolean;
} {
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

function readNullableDate(value: unknown): {
  value: string | null;
  isInvalid: boolean;
} {
  const normalized = readTrimmedString(value);
  if (!normalized) {
    return { value: null, isInvalid: false };
  }

  const date = new Date(normalized);
  return Number.isNaN(date.getTime())
    ? { value: null, isInvalid: true }
    : { value: date.toISOString(), isInvalid: false };
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
  errors: string[],
  updates: UpdateArticleDto,
): void {
  if (!('coverImageUrl' in body)) {
    return;
  }

  if (body['coverImageUrl'] === null) {
    updates.coverImageUrl = null;
    return;
  }

  const { value, isInvalid } = readNullableUrl(body['coverImageUrl']);
  if (isInvalid) {
    errors.push('Le champ coverImageUrl est invalide.');
    return;
  }

  updates.coverImageUrl = value;
}

function assignNullableDateUpdate(
  body: Record<string, unknown>,
  errors: string[],
  updates: UpdateArticleDto,
): void {
  if (!('publishedAt' in body)) {
    return;
  }

  if (body['publishedAt'] === null) {
    updates.publishedAt = null;
    return;
  }

  const { value, isInvalid } = readNullableDate(body['publishedAt']);
  if (isInvalid) {
    errors.push('Le champ publishedAt est invalide.');
    return;
  }

  updates.publishedAt = value;
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
  const { value: coverImageUrl, isInvalid: isCoverImageUrlInvalid } =
    readNullableUrl(body['coverImageUrl']);
  const seoTitle = readNullableString(body['seoTitle']);
  const seoDescription = readNullableString(body['seoDescription']);
  const { value: normalizedPublishedAt, isInvalid: isPublishedAtInvalid } =
    body['publishedAt'] === null
      ? { value: null, isInvalid: false }
      : readNullableDate(body['publishedAt']);
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

  if (isCoverImageUrlInvalid) {
    errors.push('Le champ coverImageUrl est invalide.');
  }

  if (isPublishedAtInvalid) {
    errors.push('Le champ publishedAt est invalide.');
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
      publishedAt: normalizedPublishedAt,
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
  assignNullableUrlUpdate(body, errors, updates);
  assignNullableStringUpdate(body, 'seoTitle', updates);
  assignNullableStringUpdate(body, 'seoDescription', updates);
  assignNullableDateUpdate(body, errors, updates);
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

type TaxonomyCreatePayload = CreateCategoryDto | CreateTagDto;
type TaxonomyUpdatePayload = UpdateCategoryDto | UpdateTagDto;

function validateTaxonomyCreatePayload(
  body: unknown,
): ValidationResult<TaxonomyCreatePayload> {
  if (!isObjectPayload(body)) {
    return {
      valid: false,
      errors: ['Corps de requete invalide.'],
    };
  }

  const slug = readTrimmedString(body['slug']);
  const label = readTrimmedString(body['label']);
  const description =
    'description' in body ? readNullableString(body['description']) : null;
  const errors: string[] = [];

  if (slug.length === 0) {
    errors.push('Le champ slug est requis.');
  }

  if (label.length === 0) {
    errors.push('Le champ label est requis.');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: { slug, label, description } as TaxonomyCreatePayload,
  };
}

function validateTaxonomyUpdatePayload(
  body: unknown,
): ValidationResult<TaxonomyUpdatePayload> {
  if (!isObjectPayload(body)) {
    return {
      valid: false,
      errors: ['Corps de requete invalide.'],
    };
  }

  const updates: Record<string, string | null> = {};
  const errors: string[] = [];

  if ('slug' in body) {
    const slug = readTrimmedString(body['slug']);
    if (slug.length === 0) {
      errors.push('Le champ slug est requis.');
    } else {
      updates['slug'] = slug;
    }
  }

  if ('label' in body) {
    const label = readTrimmedString(body['label']);
    if (label.length === 0) {
      errors.push('Le champ label est requis.');
    } else {
      updates['label'] = label;
    }
  }

  if ('description' in body) {
    updates['description'] = readNullableString(body['description']);
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  if (Object.keys(updates).length === 0) {
    return {
      valid: false,
      errors: ['Au moins un champ doit etre fourni pour la mise a jour.'],
    };
  }

  return {
    valid: true,
    data: updates as TaxonomyUpdatePayload,
  };
}

export function validateCreateCategoryPayload(
  body: unknown,
): ValidationResult<CreateCategoryDto> {
  return validateTaxonomyCreatePayload(
    body,
  ) as ValidationResult<CreateCategoryDto>;
}

export function validateUpdateCategoryPayload(
  body: unknown,
): ValidationResult<UpdateCategoryDto> {
  return validateTaxonomyUpdatePayload(
    body,
  ) as ValidationResult<UpdateCategoryDto>;
}

export function validateCreateTagPayload(
  body: unknown,
): ValidationResult<CreateTagDto> {
  return validateTaxonomyCreatePayload(body) as ValidationResult<CreateTagDto>;
}

export function validateUpdateTagPayload(
  body: unknown,
): ValidationResult<UpdateTagDto> {
  return validateTaxonomyUpdatePayload(body) as ValidationResult<UpdateTagDto>;
}
