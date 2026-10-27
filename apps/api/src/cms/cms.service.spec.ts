import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { CmsService } from './cms.service';

type QueryResult = {
  data: unknown;
  error: unknown;
};

function createQuery(result: QueryResult) {
  const query = {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    eq: jest.fn(),
    neq: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    single: jest.fn(),
  };

  query.select.mockReturnValue(query);
  query.insert.mockReturnValue(query);
  query.update.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.neq.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.limit.mockResolvedValue(result);
  query.single.mockResolvedValue(result);

  return query;
}

describe('CmsService', () => {
  const adminClient = {
    from: jest.fn(),
  };

  const supabaseService = {
    getClient: jest.fn(() => adminClient),
  };

  const service = new CmsService(supabaseService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Given published CMS rows, When getHomepageContent is called, Then all published collections are mapped', async () => {
    const statisticQuery = createQuery({
      data: [
        {
          id: 'stat-1',
          label: 'Participants accompagnés',
          value: '250+',
          suffix: null,
          sort_order: 1,
          status: 'published',
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-02T00:00:00.000Z',
        },
      ],
      error: null,
    });

    const partnerQuery = createQuery({
      data: [
        {
          id: 'partner-1',
          name: 'KRAAK Partner',
          logo_url: 'https://cdn.kraak.test/logo.png',
          website_url: 'https://partner.kraak.test',
          sort_order: 1,
          status: 'published',
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-02T00:00:00.000Z',
        },
      ],
      error: null,
    });

    const testimonialQuery = createQuery({
      data: [
        {
          id: 'testimonial-1',
          quote: 'Excellent accompagnement',
          author_name: 'Awa',
          author_role: 'Cheffe de projet',
          company: 'KRAAK',
          avatar_url: null,
          sort_order: 1,
          status: 'published',
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-02T00:00:00.000Z',
        },
      ],
      error: null,
    });

    const teamMemberQuery = createQuery({
      data: [
        {
          id: 'member-1',
          full_name: 'Ange K',
          role: 'Coach',
          bio: null,
          avatar_url: null,
          linkedin_url: null,
          sort_order: 1,
          status: 'published',
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-02T00:00:00.000Z',
        },
      ],
      error: null,
    });

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'statistic') {
        return statisticQuery;
      }

      if (tableName === 'partner') {
        return partnerQuery;
      }

      if (tableName === 'testimonial') {
        return testimonialQuery;
      }

      if (tableName === 'team_member') {
        return teamMemberQuery;
      }

      throw new Error(`Unexpected table: ${tableName}`);
    });

    await expect(service.getHomepageContent()).resolves.toEqual({
      statistics: [
        {
          id: 'stat-1',
          label: 'Participants accompagnés',
          value: '250+',
          suffix: null,
          sortOrder: 1,
          status: 'published',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      ],
      partners: [
        {
          id: 'partner-1',
          name: 'KRAAK Partner',
          logoUrl: 'https://cdn.kraak.test/logo.png',
          websiteUrl: 'https://partner.kraak.test',
          sortOrder: 1,
          status: 'published',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      ],
      testimonials: [
        {
          id: 'testimonial-1',
          quote: 'Excellent accompagnement',
          authorName: 'Awa',
          authorRole: 'Cheffe de projet',
          company: 'KRAAK',
          avatarUrl: null,
          sortOrder: 1,
          status: 'published',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      ],
      teamMembers: [
        {
          id: 'member-1',
          fullName: 'Ange K',
          role: 'Coach',
          bio: null,
          avatarUrl: null,
          linkedinUrl: null,
          sortOrder: 1,
          status: 'published',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      ],
    });

    expect(statisticQuery.eq).toHaveBeenCalledWith('status', 'published');
    expect(partnerQuery.eq).toHaveBeenCalledWith('status', 'published');
    expect(testimonialQuery.eq).toHaveBeenCalledWith('status', 'published');
    expect(teamMemberQuery.eq).toHaveBeenCalledWith('status', 'published');
  });

  it('Given published query failures, When getHomepageContent is called, Then empty arrays are returned', async () => {
    const statisticQuery = createQuery({
      data: null,
      error: { message: 'db failure' },
    });

    const partnerQuery = createQuery({
      data: null,
      error: { message: 'db failure' },
    });

    const testimonialQuery = createQuery({
      data: null,
      error: { message: 'db failure' },
    });

    const teamMemberQuery = createQuery({
      data: null,
      error: { message: 'db failure' },
    });

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'statistic') {
        return statisticQuery;
      }

      if (tableName === 'partner') {
        return partnerQuery;
      }

      if (tableName === 'testimonial') {
        return testimonialQuery;
      }

      if (tableName === 'team_member') {
        return teamMemberQuery;
      }

      throw new Error(`Unexpected table: ${tableName}`);
    });

    await expect(service.getHomepageContent()).resolves.toEqual({
      statistics: [],
      partners: [],
      testimonials: [],
      teamMembers: [],
    });
  });

  it('Given statistic table rows, When list/create/update/delete statistics are called, Then repository operations are mapped', async () => {
    const listQuery = createQuery({
      data: [
        {
          id: 'stat-1',
          label: 'Participants accompagnés',
          value: '250+',
          suffix: null,
          sort_order: 1,
          status: 'published',
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-02T00:00:00.000Z',
        },
      ],
      error: null,
    });

    const createQueryResult = createQuery({
      data: {
        id: 'stat-2',
        label: 'Nouveaux inscrits',
        value: '100',
        suffix: null,
        sort_order: 2,
        status: 'draft',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-02T00:00:00.000Z',
      },
      error: null,
    });

    const updateQueryResult = createQuery({
      data: {
        id: 'stat-1',
        label: 'Participants accompagnés',
        value: '300+',
        suffix: null,
        sort_order: 1,
        status: 'published',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-02T00:00:00.000Z',
      },
      error: null,
    });

    const deleteQueryResult = createQuery({
      data: { id: 'stat-1' },
      error: null,
    });

    adminClient.from
      .mockReturnValueOnce(listQuery)
      .mockReturnValueOnce(createQueryResult)
      .mockReturnValueOnce(updateQueryResult)
      .mockReturnValueOnce(deleteQueryResult);

    await expect(service.listStatistics()).resolves.toHaveLength(1);

    await expect(
      service.createStatistic({
        label: 'Nouveaux inscrits',
        value: '100',
        suffix: null,
        sortOrder: 2,
        status: 'draft',
      }),
    ).resolves.toMatchObject({ id: 'stat-2' });

    await expect(
      service.updateStatistic('stat-1', {
        value: '300+',
      }),
    ).resolves.toMatchObject({ value: '300+' });

    await expect(service.deleteStatistic('stat-1')).resolves.toBeUndefined();

    expect(listQuery.neq).toHaveBeenCalledWith('status', 'archived');
    expect(createQueryResult.insert).toHaveBeenCalledWith({
      label: 'Nouveaux inscrits',
      value: '100',
      suffix: null,
      sort_order: 2,
      status: 'draft',
    });
    expect(updateQueryResult.update).toHaveBeenCalledWith({
      value: '300+',
    });
    expect(deleteQueryResult.update).toHaveBeenCalledWith({
      status: 'archived',
    });
  });

  it('Given statistic read/create failures, When list/create are called, Then InternalServerErrorException is thrown', async () => {
    adminClient.from
      .mockReturnValueOnce(
        createQuery({ data: null, error: { message: 'db' } }),
      )
      .mockReturnValueOnce(
        createQuery({ data: null, error: { message: 'db' } }),
      );

    await expect(service.listStatistics()).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
    await expect(
      service.createStatistic({
        label: 'x',
        value: 'x',
        suffix: null,
        sortOrder: 0,
        status: 'draft',
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('Given statistic update/delete failures, When update/delete are called, Then NotFoundException is thrown', async () => {
    adminClient.from
      .mockReturnValueOnce(
        createQuery({ data: null, error: { message: 'db' } }),
      )
      .mockReturnValueOnce(
        createQuery({ data: null, error: { message: 'db' } }),
      );

    await expect(
      service.updateStatistic('missing', { value: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.deleteStatistic('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('Given partner table rows, When list/create/update/delete partners are called, Then repository operations are mapped', async () => {
    adminClient.from
      .mockReturnValueOnce(
        createQuery({
          data: [
            {
              id: 'partner-1',
              name: 'KRAAK Partner',
              logo_url: 'https://cdn.kraak.test/logo.png',
              website_url: null,
              sort_order: 1,
              status: 'published',
              created_at: '2026-01-01T00:00:00.000Z',
              updated_at: '2026-01-02T00:00:00.000Z',
            },
          ],
          error: null,
        }),
      )
      .mockReturnValueOnce(
        createQuery({
          data: {
            id: 'partner-2',
            name: 'New Partner',
            logo_url: 'https://cdn.kraak.test/new-logo.png',
            website_url: null,
            sort_order: 2,
            status: 'draft',
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-02T00:00:00.000Z',
          },
          error: null,
        }),
      )
      .mockReturnValueOnce(
        createQuery({
          data: {
            id: 'partner-1',
            name: 'Updated Partner',
            logo_url: 'https://cdn.kraak.test/logo.png',
            website_url: null,
            sort_order: 1,
            status: 'published',
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-02T00:00:00.000Z',
          },
          error: null,
        }),
      )
      .mockReturnValueOnce(
        createQuery({ data: { id: 'partner-1' }, error: null }),
      );

    await expect(service.listPartners()).resolves.toHaveLength(1);
    await expect(
      service.createPartner({
        name: 'New Partner',
        logoUrl: 'https://cdn.kraak.test/new-logo.png',
        websiteUrl: null,
        sortOrder: 2,
        status: 'draft',
      }),
    ).resolves.toMatchObject({ id: 'partner-2' });
    await expect(
      service.updatePartner('partner-1', {
        name: 'Updated Partner',
      }),
    ).resolves.toMatchObject({ id: 'partner-1' });
    await expect(service.deletePartner('partner-1')).resolves.toBeUndefined();
  });

  it('Given testimonial table rows, When list/create/update/delete testimonials are called, Then repository operations are mapped', async () => {
    adminClient.from
      .mockReturnValueOnce(
        createQuery({
          data: [
            {
              id: 'testimonial-1',
              quote: 'Excellent accompagnement',
              author_name: 'Awa',
              author_role: null,
              company: null,
              avatar_url: null,
              sort_order: 1,
              status: 'published',
              created_at: '2026-01-01T00:00:00.000Z',
              updated_at: '2026-01-02T00:00:00.000Z',
            },
          ],
          error: null,
        }),
      )
      .mockReturnValueOnce(
        createQuery({
          data: {
            id: 'testimonial-2',
            quote: 'Très utile',
            author_name: 'Nina',
            author_role: null,
            company: null,
            avatar_url: null,
            sort_order: 2,
            status: 'draft',
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-02T00:00:00.000Z',
          },
          error: null,
        }),
      )
      .mockReturnValueOnce(
        createQuery({
          data: {
            id: 'testimonial-1',
            quote: 'Mise a jour',
            author_name: 'Awa',
            author_role: null,
            company: null,
            avatar_url: null,
            sort_order: 1,
            status: 'published',
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-02T00:00:00.000Z',
          },
          error: null,
        }),
      )
      .mockReturnValueOnce(
        createQuery({
          data: { id: 'testimonial-1' },
          error: null,
        }),
      );

    await expect(service.listTestimonials()).resolves.toHaveLength(1);
    await expect(
      service.createTestimonial({
        quote: 'Très utile',
        authorName: 'Nina',
        authorRole: null,
        company: null,
        avatarUrl: null,
        sortOrder: 2,
        status: 'draft',
      }),
    ).resolves.toMatchObject({ id: 'testimonial-2' });
    await expect(
      service.updateTestimonial('testimonial-1', {
        quote: 'Mise a jour',
      }),
    ).resolves.toMatchObject({ quote: 'Mise a jour' });
    await expect(
      service.deleteTestimonial('testimonial-1'),
    ).resolves.toBeUndefined();
  });

  it('Given team member table rows, When list/create/update/delete members are called, Then repository operations are mapped', async () => {
    adminClient.from
      .mockReturnValueOnce(
        createQuery({
          data: [
            {
              id: 'member-1',
              full_name: 'Ange K',
              role: 'Coach',
              bio: null,
              avatar_url: null,
              linkedin_url: null,
              sort_order: 1,
              status: 'published',
              created_at: '2026-01-01T00:00:00.000Z',
              updated_at: '2026-01-02T00:00:00.000Z',
            },
          ],
          error: null,
        }),
      )
      .mockReturnValueOnce(
        createQuery({
          data: {
            id: 'member-2',
            full_name: 'Nina D',
            role: 'Mentor',
            bio: null,
            avatar_url: null,
            linkedin_url: null,
            sort_order: 2,
            status: 'draft',
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-02T00:00:00.000Z',
          },
          error: null,
        }),
      )
      .mockReturnValueOnce(
        createQuery({
          data: {
            id: 'member-1',
            full_name: 'Ange K',
            role: 'Lead Coach',
            bio: null,
            avatar_url: null,
            linkedin_url: null,
            sort_order: 1,
            status: 'published',
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-02T00:00:00.000Z',
          },
          error: null,
        }),
      )
      .mockReturnValueOnce(
        createQuery({ data: { id: 'member-1' }, error: null }),
      );

    await expect(service.listTeamMembers()).resolves.toHaveLength(1);
    await expect(
      service.createTeamMember({
        fullName: 'Nina D',
        role: 'Mentor',
        bio: null,
        avatarUrl: null,
        linkedinUrl: null,
        sortOrder: 2,
        status: 'draft',
      }),
    ).resolves.toMatchObject({ id: 'member-2' });
    await expect(
      service.updateTeamMember('member-1', {
        role: 'Lead Coach',
      }),
    ).resolves.toMatchObject({ role: 'Lead Coach' });
    await expect(service.deleteTeamMember('member-1')).resolves.toBeUndefined();
  });

  it('Given repository write failures, When create/update/delete partner-testimonial-team operations are called, Then exceptions are thrown', async () => {
    adminClient.from
      .mockReturnValueOnce(
        createQuery({ data: null, error: { message: 'db' } }),
      )
      .mockReturnValueOnce(
        createQuery({ data: null, error: { message: 'db' } }),
      )
      .mockReturnValueOnce(
        createQuery({ data: null, error: { message: 'db' } }),
      )
      .mockReturnValueOnce(
        createQuery({ data: null, error: { message: 'db' } }),
      )
      .mockReturnValueOnce(
        createQuery({ data: null, error: { message: 'db' } }),
      )
      .mockReturnValueOnce(
        createQuery({ data: null, error: { message: 'db' } }),
      )
      .mockReturnValueOnce(
        createQuery({ data: null, error: { message: 'db' } }),
      )
      .mockReturnValueOnce(
        createQuery({ data: null, error: { message: 'db' } }),
      )
      .mockReturnValueOnce(
        createQuery({ data: null, error: { message: 'db' } }),
      )
      .mockReturnValueOnce(
        createQuery({ data: null, error: { message: 'db' } }),
      )
      .mockReturnValueOnce(
        createQuery({ data: null, error: { message: 'db' } }),
      )
      .mockReturnValueOnce(
        createQuery({ data: null, error: { message: 'db' } }),
      );

    await expect(
      service.createPartner({
        name: 'x',
        logoUrl: 'https://x.test/logo.png',
        websiteUrl: null,
        sortOrder: 0,
        status: 'draft',
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
    await expect(
      service.updatePartner('x', { name: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.deletePartner('x')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    await expect(
      service.createTestimonial({
        quote: 'x',
        authorName: 'x',
        authorRole: null,
        company: null,
        avatarUrl: null,
        sortOrder: 0,
        status: 'draft',
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
    await expect(
      service.updateTestimonial('x', { quote: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.deleteTestimonial('x')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    await expect(
      service.createTeamMember({
        fullName: 'x',
        role: 'x',
        bio: null,
        avatarUrl: null,
        linkedinUrl: null,
        sortOrder: 0,
        status: 'draft',
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
    await expect(
      service.updateTeamMember('x', { role: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.deleteTeamMember('x')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    await expect(service.listPartners()).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
    await expect(service.listTestimonials()).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
    await expect(service.listTeamMembers()).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it('Given full update payloads, When update methods are called, Then all optional fields are propagated to repository payloads', async () => {
    const statisticUpdateQuery = createQuery({
      data: {
        id: 'stat-1',
        label: 'Label MAJ',
        value: '999',
        suffix: '+',
        sort_order: 9,
        status: 'draft',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-02T00:00:00.000Z',
      },
      error: null,
    });
    const partnerUpdateQuery = createQuery({
      data: {
        id: 'partner-1',
        name: 'Partner MAJ',
        logo_url: 'https://cdn.kraak.test/updated-logo.png',
        website_url: 'https://updated.partner.test',
        sort_order: 3,
        status: 'published',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-02T00:00:00.000Z',
      },
      error: null,
    });
    const testimonialUpdateQuery = createQuery({
      data: {
        id: 'testimonial-1',
        quote: 'Témoignage MAJ',
        author_name: 'Auteur MAJ',
        author_role: 'Coach',
        company: 'KRAAK',
        avatar_url: 'https://cdn.kraak.test/avatar.png',
        sort_order: 4,
        status: 'published',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-02T00:00:00.000Z',
      },
      error: null,
    });
    const memberUpdateQuery = createQuery({
      data: {
        id: 'member-1',
        full_name: 'Membre MAJ',
        role: 'Lead',
        bio: 'Bio MAJ',
        avatar_url: 'https://cdn.kraak.test/member.png',
        linkedin_url: 'https://linkedin.com/in/member',
        sort_order: 5,
        status: 'published',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-02T00:00:00.000Z',
      },
      error: null,
    });

    adminClient.from
      .mockReturnValueOnce(statisticUpdateQuery)
      .mockReturnValueOnce(partnerUpdateQuery)
      .mockReturnValueOnce(testimonialUpdateQuery)
      .mockReturnValueOnce(memberUpdateQuery);

    await expect(
      service.updateStatistic('stat-1', {
        label: 'Label MAJ',
        value: '999',
        suffix: '+',
        sortOrder: 9,
        status: 'draft',
      }),
    ).resolves.toMatchObject({ id: 'stat-1' });
    await expect(
      service.updatePartner('partner-1', {
        name: 'Partner MAJ',
        logoUrl: 'https://cdn.kraak.test/updated-logo.png',
        websiteUrl: 'https://updated.partner.test',
        sortOrder: 3,
        status: 'published',
      }),
    ).resolves.toMatchObject({ id: 'partner-1' });
    await expect(
      service.updateTestimonial('testimonial-1', {
        quote: 'Témoignage MAJ',
        authorName: 'Auteur MAJ',
        authorRole: 'Coach',
        company: 'KRAAK',
        avatarUrl: 'https://cdn.kraak.test/avatar.png',
        sortOrder: 4,
        status: 'published',
      }),
    ).resolves.toMatchObject({ id: 'testimonial-1' });
    await expect(
      service.updateTeamMember('member-1', {
        fullName: 'Membre MAJ',
        role: 'Lead',
        bio: 'Bio MAJ',
        avatarUrl: 'https://cdn.kraak.test/member.png',
        linkedinUrl: 'https://linkedin.com/in/member',
        sortOrder: 5,
        status: 'published',
      }),
    ).resolves.toMatchObject({ id: 'member-1' });

    expect(statisticUpdateQuery.update).toHaveBeenCalledWith({
      label: 'Label MAJ',
      value: '999',
      suffix: '+',
      sort_order: 9,
      status: 'draft',
    });
    expect(partnerUpdateQuery.update).toHaveBeenCalledWith({
      name: 'Partner MAJ',
      logo_url: 'https://cdn.kraak.test/updated-logo.png',
      website_url: 'https://updated.partner.test',
      sort_order: 3,
      status: 'published',
    });
    expect(testimonialUpdateQuery.update).toHaveBeenCalledWith({
      quote: 'Témoignage MAJ',
      author_name: 'Auteur MAJ',
      author_role: 'Coach',
      company: 'KRAAK',
      avatar_url: 'https://cdn.kraak.test/avatar.png',
      sort_order: 4,
      status: 'published',
    });
    expect(memberUpdateQuery.update).toHaveBeenCalledWith({
      full_name: 'Membre MAJ',
      role: 'Lead',
      bio: 'Bio MAJ',
      avatar_url: 'https://cdn.kraak.test/member.png',
      linkedin_url: 'https://linkedin.com/in/member',
      sort_order: 5,
      status: 'published',
    });
  });

  it('Given null data without query error, When create and update methods are called, Then create throws InternalServerErrorException and update throws NotFoundException', async () => {
    adminClient.from
      .mockReturnValueOnce(createQuery({ data: null, error: null }))
      .mockReturnValueOnce(createQuery({ data: null, error: null }))
      .mockReturnValueOnce(createQuery({ data: null, error: null }))
      .mockReturnValueOnce(createQuery({ data: null, error: null }))
      .mockReturnValueOnce(createQuery({ data: null, error: null }))
      .mockReturnValueOnce(createQuery({ data: null, error: null }))
      .mockReturnValueOnce(createQuery({ data: null, error: null }))
      .mockReturnValueOnce(createQuery({ data: null, error: null }));

    await expect(
      service.createStatistic({
        label: 'x',
        value: 'x',
        suffix: null,
        sortOrder: 0,
        status: 'draft',
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
    await expect(
      service.createPartner({
        name: 'x',
        logoUrl: 'https://x.test/logo.png',
        websiteUrl: null,
        sortOrder: 0,
        status: 'draft',
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
    await expect(
      service.createTestimonial({
        quote: 'x',
        authorName: 'x',
        authorRole: null,
        company: null,
        avatarUrl: null,
        sortOrder: 0,
        status: 'draft',
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
    await expect(
      service.createTeamMember({
        fullName: 'x',
        role: 'x',
        bio: null,
        avatarUrl: null,
        linkedinUrl: null,
        sortOrder: 0,
        status: 'draft',
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);

    await expect(
      service.updateStatistic('missing', { value: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.updatePartner('missing', { name: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.updateTestimonial('missing', { quote: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.updateTeamMember('missing', { role: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('Given list queries with null data and no error, When list methods are called, Then each list returns an empty array', async () => {
    adminClient.from
      .mockReturnValueOnce(createQuery({ data: null, error: null }))
      .mockReturnValueOnce(createQuery({ data: null, error: null }))
      .mockReturnValueOnce(createQuery({ data: null, error: null }))
      .mockReturnValueOnce(createQuery({ data: null, error: null }));

    await expect(service.listStatistics()).resolves.toEqual([]);
    await expect(service.listPartners()).resolves.toEqual([]);
    await expect(service.listTestimonials()).resolves.toEqual([]);
    await expect(service.listTeamMembers()).resolves.toEqual([]);
  });

  it('Given homepage published queries with null data and no error, When getHomepageContent is called, Then each published section is empty', async () => {
    const statisticQuery = createQuery({ data: null, error: null });
    const partnerQuery = createQuery({ data: null, error: null });
    const testimonialQuery = createQuery({ data: null, error: null });
    const teamMemberQuery = createQuery({ data: null, error: null });

    adminClient.from.mockImplementation((tableName: string) => {
      if (tableName === 'statistic') {
        return statisticQuery;
      }

      if (tableName === 'partner') {
        return partnerQuery;
      }

      if (tableName === 'testimonial') {
        return testimonialQuery;
      }

      if (tableName === 'team_member') {
        return teamMemberQuery;
      }

      throw new Error(`Unexpected table: ${tableName}`);
    });

    await expect(service.getHomepageContent()).resolves.toEqual({
      statistics: [],
      partners: [],
      testimonials: [],
      teamMembers: [],
    });
  });
});
