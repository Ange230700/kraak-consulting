import type { UpdateCourseDto } from '@kraak/contracts';

const publicationFields = [
  'slug',
  'title',
  'summary',
  'description',
  'status',
] as const;

export function mapPublicationUpdate(
  payload: UpdateCourseDto,
): Record<string, unknown> {
  const updatePayload: Record<string, unknown> = {};

  for (const field of publicationFields) {
    if (payload[field] !== undefined) {
      updatePayload[field] = payload[field];
    }
  }

  return updatePayload;
}
