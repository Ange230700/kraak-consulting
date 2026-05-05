import type {
  PublicationStatusValue,
  ResourceAudienceValue,
  ResourceDto,
  ResourceThemeValue,
  ResourceTypeValue,
} from '@kraak/contracts';

export type ResourceRow = {
  id: string;
  program_id: string | null;
  cohort_id: string | null;
  title: string;
  description: string | null;
  resource_type: ResourceTypeValue;
  resource_theme: ResourceThemeValue;
  resource_audience: ResourceAudienceValue;
  url: string | null;
  file_path: string | null;
  status: PublicationStatusValue;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export function mapResource(row: ResourceRow): ResourceDto {
  return {
    id: row.id,
    programId: row.program_id,
    cohortId: row.cohort_id,
    title: row.title,
    description: row.description,
    resourceType: row.resource_type,
    resourceTheme: row.resource_theme,
    resourceAudience: row.resource_audience,
    url: row.url,
    filePath: row.file_path,
    status: row.status,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
