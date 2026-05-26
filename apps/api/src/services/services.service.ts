import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import type {
  CreateServiceDetailDto,
  CreateServiceDto,
  ServiceDetailDto,
  ServiceDto,
  ServiceWithDetailsDto,
  UpdateServiceDetailDto,
  UpdateServiceDto,
} from './services.dto';

const serviceSelectFields =
  'id, title, description, icon, sort_order, created_at, updated_at';
const serviceDetailSelectFields =
  'id, service_id, title, description, sort_order, created_at, updated_at';

const serviceListErrorMessage = 'Impossible de charger la liste des services.';
const serviceNotFoundMessage = 'Service introuvable.';
const serviceDetailNotFoundMessage = 'Détail de service introuvable.';

type ServiceRow = {
  id: string;
  title: string;
  description: string;
  icon: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type ServiceDetailRow = {
  id: string;
  service_id: string;
  title: string;
  description: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class ServicesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async listServices(): Promise<ServiceDto[]> {
    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('service')
      .select(serviceSelectFields)
      .order('sort_order', { ascending: true })
      .limit(1000);

    if (error) {
      throw new InternalServerErrorException({
        success: false,
        message: serviceListErrorMessage,
      });
    }

    return ((data as ServiceRow[] | null) ?? []).map((row) =>
      this.mapService(row),
    );
  }

  async getServiceById(serviceId: string): Promise<ServiceWithDetailsDto> {
    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('service')
      .select(serviceSelectFields)
      .eq('id', serviceId)
      .single();

    if (error || !data) {
      throw new NotFoundException({
        success: false,
        message: serviceNotFoundMessage,
      });
    }

    const { data: detailRows, error: detailError } = await adminClient
      .from('service_detail')
      .select(serviceDetailSelectFields)
      .eq('service_id', serviceId)
      .order('sort_order', { ascending: true })
      .limit(1000);

    if (detailError) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Impossible de charger les détails du service.',
      });
    }

    return {
      ...this.mapService(data as ServiceRow),
      details: ((detailRows as ServiceDetailRow[] | null) ?? []).map((row) =>
        this.mapServiceDetail(row),
      ),
    };
  }

  async createService(payload: CreateServiceDto): Promise<ServiceDto> {
    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('service')
      .insert({
        title: payload.title,
        description: payload.description,
        icon: payload.icon ?? null,
        sort_order: payload.sortOrder ?? 0,
      })
      .select(serviceSelectFields)
      .single();

    if (error || !data) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Impossible de créer le service.',
      });
    }

    return this.mapService(data as ServiceRow);
  }

  async updateService(
    serviceId: string,
    payload: UpdateServiceDto,
  ): Promise<ServiceDto> {
    const updatePayload: Record<string, unknown> = {};

    if (payload.title !== undefined) {
      updatePayload['title'] = payload.title;
    }

    if (payload.description !== undefined) {
      updatePayload['description'] = payload.description;
    }

    if (payload.icon !== undefined) {
      updatePayload['icon'] = payload.icon;
    }

    if (payload.sortOrder !== undefined) {
      updatePayload['sort_order'] = payload.sortOrder;
    }

    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('service')
      .update(updatePayload)
      .eq('id', serviceId)
      .select(serviceSelectFields)
      .single();

    if (error || !data) {
      throw new NotFoundException({
        success: false,
        message: serviceNotFoundMessage,
      });
    }

    return this.mapService(data as ServiceRow);
  }

  async deleteService(serviceId: string): Promise<void> {
    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('service')
      .delete()
      .eq('id', serviceId)
      .select('id')
      .single();

    if (error || !data) {
      throw new NotFoundException({
        success: false,
        message: serviceNotFoundMessage,
      });
    }
  }

  async createServiceDetail(
    serviceId: string,
    payload: CreateServiceDetailDto,
  ): Promise<ServiceDetailDto> {
    await this.ensureServiceExists(serviceId);

    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('service_detail')
      .insert({
        service_id: serviceId,
        title: payload.title,
        description: payload.description,
        sort_order: payload.sortOrder ?? 0,
      })
      .select(serviceDetailSelectFields)
      .single();

    if (error || !data) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Impossible de créer le détail du service.',
      });
    }

    return this.mapServiceDetail(data as ServiceDetailRow);
  }

  async updateServiceDetail(
    serviceId: string,
    detailId: string,
    payload: UpdateServiceDetailDto,
  ): Promise<ServiceDetailDto> {
    const updatePayload: Record<string, unknown> = {};

    if (payload.title !== undefined) {
      updatePayload['title'] = payload.title;
    }

    if (payload.description !== undefined) {
      updatePayload['description'] = payload.description;
    }

    if (payload.sortOrder !== undefined) {
      updatePayload['sort_order'] = payload.sortOrder;
    }

    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('service_detail')
      .update(updatePayload)
      .eq('service_id', serviceId)
      .eq('id', detailId)
      .select(serviceDetailSelectFields)
      .single();

    if (error || !data) {
      throw new NotFoundException({
        success: false,
        message: serviceDetailNotFoundMessage,
      });
    }

    return this.mapServiceDetail(data as ServiceDetailRow);
  }

  async deleteServiceDetail(
    serviceId: string,
    detailId: string,
  ): Promise<void> {
    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('service_detail')
      .delete()
      .eq('service_id', serviceId)
      .eq('id', detailId)
      .select('id')
      .single();

    if (error || !data) {
      throw new NotFoundException({
        success: false,
        message: serviceDetailNotFoundMessage,
      });
    }
  }

  private async ensureServiceExists(serviceId: string): Promise<void> {
    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient
      .from('service')
      .select('id')
      .eq('id', serviceId)
      .maybeSingle();

    if (error || !data) {
      throw new NotFoundException({
        success: false,
        message: serviceNotFoundMessage,
      });
    }
  }

  private mapService(row: ServiceRow): ServiceDto {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      icon: row.icon,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapServiceDetail(row: ServiceDetailRow): ServiceDetailDto {
    return {
      id: row.id,
      serviceId: row.service_id,
      title: row.title,
      description: row.description,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
