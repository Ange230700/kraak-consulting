import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type {
  CmsHomepageContentDto,
  CreatePartnerDto,
  CreateStatisticDto,
  CreateTeamMemberDto,
  CreateTestimonialDto,
  PartnerDto,
  StatisticDto,
  TeamMemberDto,
  TestimonialDto,
  UpdatePartnerDto,
  UpdateStatisticDto,
  UpdateTeamMemberDto,
  UpdateTestimonialDto,
} from '@kraak/contracts';
import { SupabaseService } from '../supabase/supabase.service';

type PublicationStatus = StatisticDto['status'];

type StatisticRow = {
  id: string;
  label: string;
  value: string;
  suffix: string | null;
  sort_order: number;
  status: PublicationStatus;
  created_at: string;
  updated_at: string;
};

type PartnerRow = {
  id: string;
  name: string;
  logo_url: string;
  website_url: string | null;
  sort_order: number;
  status: PublicationStatus;
  created_at: string;
  updated_at: string;
};

type TestimonialRow = {
  id: string;
  quote: string;
  author_name: string;
  author_role: string | null;
  company: string | null;
  avatar_url: string | null;
  sort_order: number;
  status: PublicationStatus;
  created_at: string;
  updated_at: string;
};

type TeamMemberRow = {
  id: string;
  full_name: string;
  role: string;
  bio: string | null;
  avatar_url: string | null;
  linkedin_url: string | null;
  sort_order: number;
  status: PublicationStatus;
  created_at: string;
  updated_at: string;
};

const statisticSelectFields =
  'id, label, value, suffix, sort_order, status, created_at, updated_at';
const partnerSelectFields =
  'id, name, logo_url, website_url, sort_order, status, created_at, updated_at';
const testimonialSelectFields =
  'id, quote, author_name, author_role, company, avatar_url, sort_order, status, created_at, updated_at';
const teamMemberSelectFields =
  'id, full_name, role, bio, avatar_url, linkedin_url, sort_order, status, created_at, updated_at';

@Injectable()
export class CmsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getHomepageContent(): Promise<CmsHomepageContentDto> {
    const [statistics, partners, testimonials, teamMembers] = await Promise.all(
      [
        this.listPublishedStatistics(),
        this.listPublishedPartners(),
        this.listPublishedTestimonials(),
        this.listPublishedTeamMembers(),
      ],
    );

    return {
      statistics,
      partners,
      testimonials,
      teamMembers,
    };
  }

  async listStatistics(): Promise<StatisticDto[]> {
    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('statistic')
      .select(statisticSelectFields)
      .neq('status', 'archived')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(200);

    if (error) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Impossible de charger les statistiques.',
      });
    }

    return ((data as StatisticRow[] | null) ?? []).map((row) =>
      this.mapStatisticRow(row),
    );
  }

  async createStatistic(payload: CreateStatisticDto): Promise<StatisticDto> {
    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('statistic')
      .insert({
        label: payload.label,
        value: payload.value,
        suffix: payload.suffix,
        sort_order: payload.sortOrder,
        status: payload.status,
      })
      .select(statisticSelectFields)
      .single();

    if (error || !data) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Impossible de créer la statistique.',
      });
    }

    return this.mapStatisticRow(data as StatisticRow);
  }

  async updateStatistic(
    id: string,
    payload: UpdateStatisticDto,
  ): Promise<StatisticDto> {
    const adminClient = this.supabaseService.getClient();
    const updatePayload: Record<string, unknown> = {};

    if (payload.label !== undefined) {
      updatePayload['label'] = payload.label;
    }

    if (payload.value !== undefined) {
      updatePayload['value'] = payload.value;
    }

    if (payload.suffix !== undefined) {
      updatePayload['suffix'] = payload.suffix;
    }

    if (payload.sortOrder !== undefined) {
      updatePayload['sort_order'] = payload.sortOrder;
    }

    if (payload.status !== undefined) {
      updatePayload['status'] = payload.status;
    }

    const { data, error } = await adminClient
      .from('statistic')
      .update(updatePayload)
      .eq('id', id)
      .neq('status', 'archived')
      .select(statisticSelectFields)
      .single();

    if (error || !data) {
      throw new NotFoundException({
        success: false,
        message: 'Statistique introuvable.',
      });
    }

    return this.mapStatisticRow(data as StatisticRow);
  }

  async deleteStatistic(id: string): Promise<void> {
    await this.archiveById('statistic', id, 'Statistique introuvable.');
  }

  async listPartners(): Promise<PartnerDto[]> {
    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('partner')
      .select(partnerSelectFields)
      .neq('status', 'archived')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(200);

    if (error) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Impossible de charger les partenaires.',
      });
    }

    return ((data as PartnerRow[] | null) ?? []).map((row) =>
      this.mapPartnerRow(row),
    );
  }

  async createPartner(payload: CreatePartnerDto): Promise<PartnerDto> {
    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('partner')
      .insert({
        name: payload.name,
        logo_url: payload.logoUrl,
        website_url: payload.websiteUrl,
        sort_order: payload.sortOrder,
        status: payload.status,
      })
      .select(partnerSelectFields)
      .single();

    if (error || !data) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Impossible de créer le partenaire.',
      });
    }

    return this.mapPartnerRow(data as PartnerRow);
  }

  async updatePartner(
    id: string,
    payload: UpdatePartnerDto,
  ): Promise<PartnerDto> {
    const adminClient = this.supabaseService.getClient();
    const updatePayload: Record<string, unknown> = {};

    if (payload.name !== undefined) {
      updatePayload['name'] = payload.name;
    }

    if (payload.logoUrl !== undefined) {
      updatePayload['logo_url'] = payload.logoUrl;
    }

    if (payload.websiteUrl !== undefined) {
      updatePayload['website_url'] = payload.websiteUrl;
    }

    if (payload.sortOrder !== undefined) {
      updatePayload['sort_order'] = payload.sortOrder;
    }

    if (payload.status !== undefined) {
      updatePayload['status'] = payload.status;
    }

    const { data, error } = await adminClient
      .from('partner')
      .update(updatePayload)
      .eq('id', id)
      .neq('status', 'archived')
      .select(partnerSelectFields)
      .single();

    if (error || !data) {
      throw new NotFoundException({
        success: false,
        message: 'Partenaire introuvable.',
      });
    }

    return this.mapPartnerRow(data as PartnerRow);
  }

  async deletePartner(id: string): Promise<void> {
    await this.archiveById('partner', id, 'Partenaire introuvable.');
  }

  async listTestimonials(): Promise<TestimonialDto[]> {
    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('testimonial')
      .select(testimonialSelectFields)
      .neq('status', 'archived')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(200);

    if (error) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Impossible de charger les témoignages.',
      });
    }

    return ((data as TestimonialRow[] | null) ?? []).map((row) =>
      this.mapTestimonialRow(row),
    );
  }

  async createTestimonial(
    payload: CreateTestimonialDto,
  ): Promise<TestimonialDto> {
    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('testimonial')
      .insert({
        quote: payload.quote,
        author_name: payload.authorName,
        author_role: payload.authorRole,
        company: payload.company,
        avatar_url: payload.avatarUrl,
        sort_order: payload.sortOrder,
        status: payload.status,
      })
      .select(testimonialSelectFields)
      .single();

    if (error || !data) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Impossible de créer le témoignage.',
      });
    }

    return this.mapTestimonialRow(data as TestimonialRow);
  }

  async updateTestimonial(
    id: string,
    payload: UpdateTestimonialDto,
  ): Promise<TestimonialDto> {
    const adminClient = this.supabaseService.getClient();
    const updatePayload: Record<string, unknown> = {};

    if (payload.quote !== undefined) {
      updatePayload['quote'] = payload.quote;
    }

    if (payload.authorName !== undefined) {
      updatePayload['author_name'] = payload.authorName;
    }

    if (payload.authorRole !== undefined) {
      updatePayload['author_role'] = payload.authorRole;
    }

    if (payload.company !== undefined) {
      updatePayload['company'] = payload.company;
    }

    if (payload.avatarUrl !== undefined) {
      updatePayload['avatar_url'] = payload.avatarUrl;
    }

    if (payload.sortOrder !== undefined) {
      updatePayload['sort_order'] = payload.sortOrder;
    }

    if (payload.status !== undefined) {
      updatePayload['status'] = payload.status;
    }

    const { data, error } = await adminClient
      .from('testimonial')
      .update(updatePayload)
      .eq('id', id)
      .neq('status', 'archived')
      .select(testimonialSelectFields)
      .single();

    if (error || !data) {
      throw new NotFoundException({
        success: false,
        message: 'Témoignage introuvable.',
      });
    }

    return this.mapTestimonialRow(data as TestimonialRow);
  }

  async deleteTestimonial(id: string): Promise<void> {
    await this.archiveById('testimonial', id, 'Témoignage introuvable.');
  }

  async listTeamMembers(): Promise<TeamMemberDto[]> {
    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('team_member')
      .select(teamMemberSelectFields)
      .neq('status', 'archived')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(200);

    if (error) {
      throw new InternalServerErrorException({
        success: false,
        message: "Impossible de charger les membres d'équipe.",
      });
    }

    return ((data as TeamMemberRow[] | null) ?? []).map((row) =>
      this.mapTeamMemberRow(row),
    );
  }

  async createTeamMember(payload: CreateTeamMemberDto): Promise<TeamMemberDto> {
    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('team_member')
      .insert({
        full_name: payload.fullName,
        role: payload.role,
        bio: payload.bio,
        avatar_url: payload.avatarUrl,
        linkedin_url: payload.linkedinUrl,
        sort_order: payload.sortOrder,
        status: payload.status,
      })
      .select(teamMemberSelectFields)
      .single();

    if (error || !data) {
      throw new InternalServerErrorException({
        success: false,
        message: "Impossible de créer le membre d'équipe.",
      });
    }

    return this.mapTeamMemberRow(data as TeamMemberRow);
  }

  async updateTeamMember(
    id: string,
    payload: UpdateTeamMemberDto,
  ): Promise<TeamMemberDto> {
    const adminClient = this.supabaseService.getClient();
    const updatePayload: Record<string, unknown> = {};

    if (payload.fullName !== undefined) {
      updatePayload['full_name'] = payload.fullName;
    }

    if (payload.role !== undefined) {
      updatePayload['role'] = payload.role;
    }

    if (payload.bio !== undefined) {
      updatePayload['bio'] = payload.bio;
    }

    if (payload.avatarUrl !== undefined) {
      updatePayload['avatar_url'] = payload.avatarUrl;
    }

    if (payload.linkedinUrl !== undefined) {
      updatePayload['linkedin_url'] = payload.linkedinUrl;
    }

    if (payload.sortOrder !== undefined) {
      updatePayload['sort_order'] = payload.sortOrder;
    }

    if (payload.status !== undefined) {
      updatePayload['status'] = payload.status;
    }

    const { data, error } = await adminClient
      .from('team_member')
      .update(updatePayload)
      .eq('id', id)
      .neq('status', 'archived')
      .select(teamMemberSelectFields)
      .single();

    if (error || !data) {
      throw new NotFoundException({
        success: false,
        message: "Membre d'équipe introuvable.",
      });
    }

    return this.mapTeamMemberRow(data as TeamMemberRow);
  }

  async deleteTeamMember(id: string): Promise<void> {
    await this.archiveById('team_member', id, "Membre d'équipe introuvable.");
  }

  private async listPublishedStatistics(): Promise<StatisticDto[]> {
    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('statistic')
      .select(statisticSelectFields)
      .eq('status', 'published')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(200);

    if (error) {
      console.error('CMS published statistics query failed', {
        context: 'cms.listPublishedStatistics',
        message: error.message,
      });
      return [];
    }

    return ((data as StatisticRow[] | null) ?? []).map((row) =>
      this.mapStatisticRow(row),
    );
  }

  private async listPublishedPartners(): Promise<PartnerDto[]> {
    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('partner')
      .select(partnerSelectFields)
      .eq('status', 'published')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(200);

    if (error) {
      console.error('CMS published partners query failed', {
        context: 'cms.listPublishedPartners',
        message: error.message,
      });
      return [];
    }

    return ((data as PartnerRow[] | null) ?? []).map((row) =>
      this.mapPartnerRow(row),
    );
  }

  private async listPublishedTestimonials(): Promise<TestimonialDto[]> {
    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('testimonial')
      .select(testimonialSelectFields)
      .eq('status', 'published')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(200);

    if (error) {
      console.error('CMS published testimonials query failed', {
        context: 'cms.listPublishedTestimonials',
        message: error.message,
      });
      return [];
    }

    return ((data as TestimonialRow[] | null) ?? []).map((row) =>
      this.mapTestimonialRow(row),
    );
  }

  private async listPublishedTeamMembers(): Promise<TeamMemberDto[]> {
    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('team_member')
      .select(teamMemberSelectFields)
      .eq('status', 'published')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(200);

    if (error) {
      console.error('CMS published team members query failed', {
        context: 'cms.listPublishedTeamMembers',
        message: error.message,
      });
      return [];
    }

    return ((data as TeamMemberRow[] | null) ?? []).map((row) =>
      this.mapTeamMemberRow(row),
    );
  }

  private async archiveById(
    tableName: 'statistic' | 'partner' | 'testimonial' | 'team_member',
    id: string,
    notFoundMessage: string,
  ): Promise<void> {
    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from(tableName)
      .update({ status: 'archived' })
      .eq('id', id)
      .neq('status', 'archived')
      .select('id')
      .single();

    if (error || !data) {
      throw new NotFoundException({
        success: false,
        message: notFoundMessage,
      });
    }
  }

  private mapStatisticRow(row: StatisticRow): StatisticDto {
    return {
      id: row.id,
      label: row.label,
      value: row.value,
      suffix: row.suffix,
      sortOrder: row.sort_order,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapPartnerRow(row: PartnerRow): PartnerDto {
    return {
      id: row.id,
      name: row.name,
      logoUrl: row.logo_url,
      websiteUrl: row.website_url,
      sortOrder: row.sort_order,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapTestimonialRow(row: TestimonialRow): TestimonialDto {
    return {
      id: row.id,
      quote: row.quote,
      authorName: row.author_name,
      authorRole: row.author_role,
      company: row.company,
      avatarUrl: row.avatar_url,
      sortOrder: row.sort_order,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapTeamMemberRow(row: TeamMemberRow): TeamMemberDto {
    return {
      id: row.id,
      fullName: row.full_name,
      role: row.role,
      bio: row.bio,
      avatarUrl: row.avatar_url,
      linkedinUrl: row.linkedin_url,
      sortOrder: row.sort_order,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
