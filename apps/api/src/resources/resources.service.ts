import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  ResourceAudienceValue,
  ResourceDto,
  ResourceThemeValue,
} from '@kraak/contracts';
import { SupabaseService } from '../supabase/supabase.service';
import { mapResource, type ResourceRow } from '../shared/resource-mapper.utils';

const RESOURCE_SELECT_FIELDS =
  'id, program_id, cohort_id, title, description, resource_type, resource_theme, resource_audience, url, file_path, status, published_at, created_at, updated_at';

const RESOURCE_TRACKING_SELECT_FIELDS =
  'id, consultation_count, last_consulted_at';

const RESOURCE_SELECT_FIELDS_WITH_COUNT = `${RESOURCE_SELECT_FIELDS}, count:id.count()`;

type ResourceTrackingRow = {
  id: string;
  consultation_count: number;
  last_consulted_at: string | null;
};

@Injectable()
export class ResourcesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * List published resources with optional filtering and pagination.
   * @param options - Filter options (theme, audience) and pagination (page, limit)
   */
  async listResources(options?: {
    resourceTheme?: ResourceThemeValue;
    resourceAudience?: ResourceAudienceValue;
    programId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: ResourceDto[]; total: number }> {
    const adminClient = this.supabaseService.getClient();
    const limit = Math.min(options?.limit ?? 20, 100);
    const page = Math.max(options?.page ?? 1, 1);
    const offset = (page - 1) * limit;

    let query = adminClient
      .from('resource')
      .select(RESOURCE_SELECT_FIELDS_WITH_COUNT, { count: 'exact' })
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (options?.programId) {
      query = query.eq('program_id', options.programId);
    }

    if (options?.resourceTheme) {
      query = query.eq('resource_theme', options.resourceTheme);
    }

    if (options?.resourceAudience) {
      query = query.eq('resource_audience', options.resourceAudience);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to list resources: ${error.message}`);
    }

    const resources = ((data as ResourceRow[] | null) ?? []).map((row) =>
      this.mapResource(row),
    );

    return {
      data: resources,
      total: count ?? 0,
    };
  }

  /**
   * Get a single resource by ID.
   * @param id - Resource ID
   */
  async getResourceById(id: string): Promise<ResourceDto> {
    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('resource')
      .select(RESOURCE_SELECT_FIELDS)
      .eq('id', id)
      .eq('status', 'published')
      .single();

    if (error || !data) {
      throw new NotFoundException(
        `Resource with ID ${id} not found or is not published.`,
      );
    }

    return this.mapResource(data as ResourceRow);
  }

  /**
   * Record a consultation event for a published resource.
   * @param id - Resource ID
   */
  async trackResourceConsultation(id: string): Promise<void> {
    const adminClient = this.supabaseService.getClient();

    const { data: existingData, error: existingError } = await adminClient
      .from('resource')
      .select(RESOURCE_TRACKING_SELECT_FIELDS)
      .eq('id', id)
      .eq('status', 'published')
      .single();

    if (existingError || !existingData) {
      throw new NotFoundException(
        `Resource with ID ${id} not found or is not published.`,
      );
    }

    const currentResource = existingData as ResourceTrackingRow;
    const { error: updateError } = await adminClient
      .from('resource')
      .update({
        consultation_count: currentResource.consultation_count + 1,
        last_consulted_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', 'published');

    if (updateError) {
      throw new Error(
        `Failed to track resource consultation: ${updateError.message}`,
      );
    }
  }

  /**
   * Get resources by program and/or cohort with filtering.
   * @param programId - Program ID (required)
   * @param cohortId - Optional cohort ID to filter resources within a cohort
   * @param options - Additional filter options
   */
  async getResourcesByProgram(
    programId: string,
    cohortId: string | null = null,
    options?: {
      resourceTheme?: ResourceThemeValue;
      resourceAudience?: ResourceAudienceValue;
    },
  ): Promise<ResourceDto[]> {
    const adminClient = this.supabaseService.getClient();

    // Fetch program-level resources (cohort_id is null)
    let programQuery = adminClient
      .from('resource')
      .select(RESOURCE_SELECT_FIELDS)
      .eq('status', 'published')
      .eq('program_id', programId)
      .is('cohort_id', null);

    if (options?.resourceTheme) {
      programQuery = programQuery.eq('resource_theme', options.resourceTheme);
    }

    if (options?.resourceAudience) {
      programQuery = programQuery.eq(
        'resource_audience',
        options.resourceAudience,
      );
    }

    const { data: programResources, error: programError } = await programQuery;

    if (programError) {
      throw new Error(
        `Failed to fetch program resources: ${programError.message}`,
      );
    }

    let cohortResources: ResourceRow[] = [];

    if (cohortId) {
      let cohortQuery = adminClient
        .from('resource')
        .select(RESOURCE_SELECT_FIELDS)
        .eq('status', 'published')
        .eq('program_id', programId)
        .eq('cohort_id', cohortId);

      if (options?.resourceTheme) {
        cohortQuery = cohortQuery.eq('resource_theme', options.resourceTheme);
      }

      if (options?.resourceAudience) {
        cohortQuery = cohortQuery.eq(
          'resource_audience',
          options.resourceAudience,
        );
      }

      const { data, error } = await cohortQuery;

      if (error) {
        throw new Error(`Failed to fetch cohort resources: ${error.message}`);
      }

      cohortResources = (data as ResourceRow[] | null) ?? [];
    }

    // Merge and deduplicate
    const merged = [
      ...((programResources as ResourceRow[] | null) ?? []),
      ...cohortResources,
    ];

    const deduplicated = Array.from(
      new Map(merged.map((row) => [row.id, row])).values(),
    ).sort((left, right) => {
      const leftTime = left.published_at
        ? new Date(left.published_at).getTime()
        : 0;
      const rightTime = right.published_at
        ? new Date(right.published_at).getTime()
        : 0;
      return rightTime - leftTime;
    });

    return deduplicated.slice(0, 50).map((row) => this.mapResource(row));
  }

  private mapResource(row: ResourceRow): ResourceDto {
    return mapResource(row);
  }
}
