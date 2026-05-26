import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseService } from '../supabase/supabase.service';
import { ServicesService } from './services.service';

function createSingleRowQuery(result: { data: unknown; error: unknown }) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(result),
    maybeSingle: jest.fn().mockResolvedValue(result),
  };
}

function createListQuery(result: { data: unknown; error: unknown }) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue(result),
  };
}

function createMutationQuery(result: { data: unknown; error: unknown }) {
  return {
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(result),
  };
}

function createDeleteQuery(result: { data: unknown; error: unknown }) {
  return {
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(result),
  };
}

describe('ServicesService', () => {
  let service: ServicesService;

  const adminClient = {
    from: jest.fn(),
  };

  const supabaseService = {
    getClient: jest.fn(() => adminClient),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: SupabaseService,
          useValue: supabaseService,
        },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  it('Given des services existants, When listServices est appelé, Then la liste triée est mappée', async () => {
    const listQuery = createListQuery({
      data: [
        {
          id: 'service-1',
          title: 'Conseil',
          description: 'Description',
          icon: 'briefcase',
          sort_order: 1,
          created_at: '2026-05-26T10:00:00.000Z',
          updated_at: '2026-05-26T10:00:00.000Z',
        },
      ],
      error: null,
    });

    adminClient.from.mockReturnValue(listQuery);

    await expect(service.listServices()).resolves.toEqual([
      {
        id: 'service-1',
        title: 'Conseil',
        description: 'Description',
        icon: 'briefcase',
        sortOrder: 1,
        createdAt: '2026-05-26T10:00:00.000Z',
        updatedAt: '2026-05-26T10:00:00.000Z',
      },
    ]);
  });

  it('Given un service avec des détails, When getServiceById est appelé, Then le service enrichi est renvoyé', async () => {
    const serviceQuery = createSingleRowQuery({
      data: {
        id: 'service-1',
        title: 'Conseil',
        description: 'Description',
        icon: null,
        sort_order: 0,
        created_at: '2026-05-26T10:00:00.000Z',
        updated_at: '2026-05-26T10:00:00.000Z',
      },
      error: null,
    });
    const detailQuery = createListQuery({
      data: [
        {
          id: 'detail-1',
          service_id: 'service-1',
          title: 'Diagnostic',
          description: 'Analyse',
          sort_order: 1,
          created_at: '2026-05-26T10:00:00.000Z',
          updated_at: '2026-05-26T10:00:00.000Z',
        },
      ],
      error: null,
    });

    adminClient.from.mockImplementation((table: string) => {
      if (table === 'service') {
        return serviceQuery;
      }

      if (table === 'service_detail') {
        return detailQuery;
      }

      throw new Error(`Unexpected table ${table}`);
    });

    await expect(service.getServiceById('service-1')).resolves.toEqual({
      id: 'service-1',
      title: 'Conseil',
      description: 'Description',
      icon: null,
      sortOrder: 0,
      createdAt: '2026-05-26T10:00:00.000Z',
      updatedAt: '2026-05-26T10:00:00.000Z',
      details: [
        {
          id: 'detail-1',
          serviceId: 'service-1',
          title: 'Diagnostic',
          description: 'Analyse',
          sortOrder: 1,
          createdAt: '2026-05-26T10:00:00.000Z',
          updatedAt: '2026-05-26T10:00:00.000Z',
        },
      ],
    });
  });

  it('Given un payload création service, When createService est appelé, Then le service est inséré et mappé', async () => {
    const mutationQuery = createMutationQuery({
      data: {
        id: 'service-2',
        title: 'Formation',
        description: 'Formation sur mesure',
        icon: 'school',
        sort_order: 3,
        created_at: '2026-05-26T10:00:00.000Z',
        updated_at: '2026-05-26T10:00:00.000Z',
      },
      error: null,
    });

    adminClient.from.mockReturnValue(mutationQuery);

    await expect(
      service.createService({
        title: 'Formation',
        description: 'Formation sur mesure',
        icon: 'school',
        sortOrder: 3,
      }),
    ).resolves.toMatchObject({
      id: 'service-2',
      sortOrder: 3,
    });

    expect(mutationQuery.insert).toHaveBeenCalledWith({
      title: 'Formation',
      description: 'Formation sur mesure',
      icon: 'school',
      sort_order: 3,
    });
  });

  it('Given un payload mise à jour service, When updateService est appelé, Then le service est mis à jour', async () => {
    const mutationQuery = createMutationQuery({
      data: {
        id: 'service-1',
        title: 'Conseil',
        description: 'Nouveau descriptif',
        icon: null,
        sort_order: 4,
        created_at: '2026-05-26T10:00:00.000Z',
        updated_at: '2026-05-27T10:00:00.000Z',
      },
      error: null,
    });

    adminClient.from.mockReturnValue(mutationQuery);

    await expect(
      service.updateService('service-1', {
        description: 'Nouveau descriptif',
        sortOrder: 4,
      }),
    ).resolves.toMatchObject({
      id: 'service-1',
      sortOrder: 4,
    });

    expect(mutationQuery.update).toHaveBeenCalledWith({
      description: 'Nouveau descriptif',
      sort_order: 4,
    });
  });

  it('Given un service existant, When deleteService est appelé, Then la suppression est effectuée', async () => {
    const deleteQuery = createDeleteQuery({
      data: { id: 'service-1' },
      error: null,
    });

    adminClient.from.mockReturnValue(deleteQuery);

    await expect(service.deleteService('service-1')).resolves.toBeUndefined();
    expect(deleteQuery.delete).toHaveBeenCalledTimes(1);
  });

  it('Given un service existant, When createServiceDetail est appelé, Then le détail est créé', async () => {
    const serviceLookupQuery = createSingleRowQuery({
      data: { id: 'service-1' },
      error: null,
    });
    const mutationQuery = createMutationQuery({
      data: {
        id: 'detail-1',
        service_id: 'service-1',
        title: 'Diagnostic',
        description: 'Analyse complète',
        sort_order: 1,
        created_at: '2026-05-26T10:00:00.000Z',
        updated_at: '2026-05-26T10:00:00.000Z',
      },
      error: null,
    });

    adminClient.from.mockImplementation((table: string) => {
      if (table === 'service') {
        return serviceLookupQuery;
      }

      if (table === 'service_detail') {
        return mutationQuery;
      }

      throw new Error(`Unexpected table ${table}`);
    });

    await expect(
      service.createServiceDetail('service-1', {
        title: 'Diagnostic',
        description: 'Analyse complète',
        sortOrder: 1,
      }),
    ).resolves.toMatchObject({
      id: 'detail-1',
      serviceId: 'service-1',
    });
  });

  it('Given un détail existant, When updateServiceDetail est appelé, Then le détail est mis à jour', async () => {
    const mutationQuery = createMutationQuery({
      data: {
        id: 'detail-1',
        service_id: 'service-1',
        title: 'Diagnostic enrichi',
        description: 'Analyse complète',
        sort_order: 2,
        created_at: '2026-05-26T10:00:00.000Z',
        updated_at: '2026-05-27T10:00:00.000Z',
      },
      error: null,
    });

    adminClient.from.mockReturnValue(mutationQuery);

    await expect(
      service.updateServiceDetail('service-1', 'detail-1', {
        title: 'Diagnostic enrichi',
        sortOrder: 2,
      }),
    ).resolves.toMatchObject({
      id: 'detail-1',
      sortOrder: 2,
    });

    expect(mutationQuery.eq).toHaveBeenNthCalledWith(1, 'service_id', 'service-1');
    expect(mutationQuery.eq).toHaveBeenNthCalledWith(2, 'id', 'detail-1');
  });

  it('Given un détail existant, When deleteServiceDetail est appelé, Then le détail est supprimé', async () => {
    const deleteQuery = createDeleteQuery({
      data: { id: 'detail-1' },
      error: null,
    });

    adminClient.from.mockReturnValue(deleteQuery);

    await expect(
      service.deleteServiceDetail('service-1', 'detail-1'),
    ).resolves.toBeUndefined();
    expect(deleteQuery.delete).toHaveBeenCalledTimes(1);
  });

  it('Given une lecture services en erreur, When listServices est appelé, Then une InternalServerErrorException est levée', async () => {
    const listQuery = createListQuery({
      data: null,
      error: { message: 'db-error' },
    });

    adminClient.from.mockReturnValue(listQuery);

    await expect(service.listServices()).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it('Given un service absent, When getServiceById est appelé, Then une NotFoundException est levée', async () => {
    const serviceQuery = createSingleRowQuery({
      data: null,
      error: { message: 'not found' },
    });

    adminClient.from.mockReturnValue(serviceQuery);

    await expect(service.getServiceById('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
