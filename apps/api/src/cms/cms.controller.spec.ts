import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common/enums/request-method.enum';

import { CmsController } from './cms.controller';

describe('CmsController', () => {
  const cmsService = {
    getHomepageContent: jest.fn(),
    listStatistics: jest.fn(),
    createStatistic: jest.fn(),
    updateStatistic: jest.fn(),
    deleteStatistic: jest.fn(),
    listPartners: jest.fn(),
    createPartner: jest.fn(),
    updatePartner: jest.fn(),
    deletePartner: jest.fn(),
    listTestimonials: jest.fn(),
    createTestimonial: jest.fn(),
    updateTestimonial: jest.fn(),
    deleteTestimonial: jest.fn(),
    listTeamMembers: jest.fn(),
    createTeamMember: jest.fn(),
    updateTeamMember: jest.fn(),
    deleteTeamMember: jest.fn(),
  };

  const authService = {
    getSession: jest.fn(),
  };

  const controller = new CmsController(
    cmsService as never,
    authService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();

    authService.getSession.mockResolvedValue({
      profile: {
        appUser: {
          role: 'admin',
        },
      },
    });

    cmsService.getHomepageContent.mockResolvedValue({
      statistics: [],
      partners: [],
      testimonials: [],
      teamMembers: [],
    });

    cmsService.listStatistics.mockResolvedValue([]);
    cmsService.createStatistic.mockResolvedValue({ id: 'stat-1' });
    cmsService.updateStatistic.mockResolvedValue({ id: 'stat-1' });
    cmsService.deleteStatistic.mockResolvedValue(undefined);
    cmsService.listPartners.mockResolvedValue([]);
    cmsService.createPartner.mockResolvedValue({ id: 'partner-1' });
    cmsService.updatePartner.mockResolvedValue({ id: 'partner-1' });
    cmsService.deletePartner.mockResolvedValue(undefined);
    cmsService.listTestimonials.mockResolvedValue([]);
    cmsService.createTestimonial.mockResolvedValue({ id: 'testimonial-1' });
    cmsService.updateTestimonial.mockResolvedValue({ id: 'testimonial-1' });
    cmsService.deleteTestimonial.mockResolvedValue(undefined);
    cmsService.listTeamMembers.mockResolvedValue([]);
    cmsService.createTeamMember.mockResolvedValue({ id: 'member-1' });
    cmsService.updateTeamMember.mockResolvedValue({ id: 'member-1' });
    cmsService.deleteTeamMember.mockResolvedValue(undefined);
  });

  it('Given CMS controller, When reading Nest metadata, Then routes are exposed', () => {
    expect(Reflect.getMetadata(PATH_METADATA, CmsController)).toBe('/');
    expect(
      Reflect.getMetadata(METHOD_METADATA, controller.getHomepageContent),
    ).toBe(RequestMethod.GET);
    expect(
      Reflect.getMetadata(METHOD_METADATA, controller.createStatistic),
    ).toBe(RequestMethod.POST);
    expect(
      Reflect.getMetadata(METHOD_METADATA, controller.updateStatistic),
    ).toBe(RequestMethod.PATCH);
    expect(
      Reflect.getMetadata(METHOD_METADATA, controller.deleteStatistic),
    ).toBe(RequestMethod.DELETE);
  });

  it('Given public homepage route, When it is called, Then service content is returned', async () => {
    await expect(controller.getHomepageContent()).resolves.toEqual({
      statistics: [],
      partners: [],
      testimonials: [],
      teamMembers: [],
    });
  });

  it('Given admin header, When listing CMS resources, Then each list service is invoked', async () => {
    await controller.listStatistics('Bearer access-token');
    await controller.listPartners('Bearer access-token');
    await controller.listTestimonials('Bearer access-token');
    await controller.listTeamMembers('Bearer access-token');

    expect(authService.getSession).toHaveBeenCalledWith('access-token');
    expect(cmsService.listStatistics).toHaveBeenCalled();
    expect(cmsService.listPartners).toHaveBeenCalled();
    expect(cmsService.listTestimonials).toHaveBeenCalled();
    expect(cmsService.listTeamMembers).toHaveBeenCalled();
  });

  it('Given valid admin payloads, When creating CMS resources, Then each create service is invoked', async () => {
    await controller.createStatistic(
      {
        label: 'Participants accompagnés',
        value: '250+',
        suffix: null,
        sortOrder: 1,
        status: 'published',
      },
      'Bearer access-token',
    );

    await controller.createPartner(
      {
        name: 'KRAAK Partner',
        logoUrl: 'https://cdn.kraak.test/logo.png',
        websiteUrl: 'https://partner.kraak.test',
        sortOrder: 2,
        status: 'draft',
      },
      'Bearer access-token',
    );

    await controller.createTestimonial(
      {
        quote: 'Excellent accompagnement',
        authorName: 'Awa',
        authorRole: 'Cheffe de projet',
        company: 'KRAAK',
        avatarUrl: 'https://cdn.kraak.test/avatar.png',
        sortOrder: 3,
        status: 'published',
      },
      'Bearer access-token',
    );

    await controller.createTeamMember(
      {
        fullName: 'Ange K',
        role: 'Coach',
        bio: null,
        avatarUrl: null,
        linkedinUrl: 'https://linkedin.com/in/ange-k',
        sortOrder: 4,
        status: 'draft',
      },
      'Bearer access-token',
    );

    expect(cmsService.createStatistic).toHaveBeenCalledTimes(1);
    expect(cmsService.createPartner).toHaveBeenCalledTimes(1);
    expect(cmsService.createTestimonial).toHaveBeenCalledTimes(1);
    expect(cmsService.createTeamMember).toHaveBeenCalledTimes(1);
  });

  it('Given valid admin payloads, When updating CMS resources, Then each update service is invoked', async () => {
    await controller.updateStatistic(
      'stat-1',
      {
        value: '300+',
      },
      'Bearer access-token',
    );

    await controller.updatePartner(
      'partner-1',
      {
        websiteUrl: null,
      },
      'Bearer access-token',
    );

    await controller.updateTestimonial(
      'testimonial-1',
      {
        company: null,
      },
      'Bearer access-token',
    );

    await controller.updateTeamMember(
      'member-1',
      {
        bio: 'Mentor principal',
      },
      'Bearer access-token',
    );

    expect(cmsService.updateStatistic).toHaveBeenCalledWith('stat-1', {
      value: '300+',
    });
    expect(cmsService.updatePartner).toHaveBeenCalledWith('partner-1', {
      websiteUrl: null,
    });
    expect(cmsService.updateTestimonial).toHaveBeenCalledWith('testimonial-1', {
      company: null,
    });
    expect(cmsService.updateTeamMember).toHaveBeenCalledWith('member-1', {
      bio: 'Mentor principal',
    });
  });

  it('Given admin header, When deleting CMS resources, Then each delete service is invoked', async () => {
    await controller.deleteStatistic('stat-1', 'Bearer access-token');
    await controller.deletePartner('partner-1', 'Bearer access-token');
    await controller.deleteTestimonial('testimonial-1', 'Bearer access-token');
    await controller.deleteTeamMember('member-1', 'Bearer access-token');

    expect(cmsService.deleteStatistic).toHaveBeenCalledWith('stat-1');
    expect(cmsService.deletePartner).toHaveBeenCalledWith('partner-1');
    expect(cmsService.deleteTestimonial).toHaveBeenCalledWith('testimonial-1');
    expect(cmsService.deleteTeamMember).toHaveBeenCalledWith('member-1');
  });

  it('Given invalid create payloads, When controller validates, Then BadRequestException is thrown', async () => {
    await expect(
      controller.createStatistic(
        {
          label: '',
        },
        'Bearer access-token',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      controller.createPartner(
        {
          name: '',
        },
        'Bearer access-token',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      controller.createTestimonial(
        {
          quote: '',
        },
        'Bearer access-token',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      controller.createTeamMember(
        {
          fullName: '',
        },
        'Bearer access-token',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('Given invalid update payloads, When controller validates, Then BadRequestException is thrown', async () => {
    await expect(
      controller.updateStatistic(
        'stat-1',
        {
          status: 'invalid',
        },
        'Bearer access-token',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      controller.updatePartner(
        'partner-1',
        {
          logoUrl: 'not-an-url',
        },
        'Bearer access-token',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      controller.updateTestimonial(
        'testimonial-1',
        {
          avatarUrl: 'not-an-url',
        },
        'Bearer access-token',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      controller.updateTeamMember(
        'member-1',
        {
          linkedinUrl: 'not-an-url',
        },
        'Bearer access-token',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('Given non-admin session, When admin route is called, Then ForbiddenException is thrown', async () => {
    authService.getSession.mockResolvedValueOnce({
      profile: {
        appUser: {
          role: 'participant',
        },
      },
    });

    await expect(
      controller.listStatistics('Bearer access-token'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('Given Reflect.metadata indisponible, When cms controller module est chargé, Then les décorateurs restent chargeables', async () => {
    const mutableReflect = Reflect as unknown as {
      metadata: typeof Reflect.metadata | undefined;
    };
    const originalMetadata = mutableReflect.metadata;

    try {
      jest.resetModules();
      mutableReflect.metadata = undefined;

      await jest.isolateModulesAsync(async () => {
        const reloaded = (await import('./cms.controller')) as {
          CmsController: unknown;
        };

        expect(reloaded.CmsController).toBeDefined();
      });
    } finally {
      mutableReflect.metadata = originalMetadata;
    }
  });

  it('Given missing Authorization header, When admin routes are called, Then UnauthorizedException is thrown', async () => {
    await expect(controller.listStatistics()).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(controller.createStatistic({})).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(
      controller.updateStatistic('stat-1', {}),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(controller.deleteStatistic('stat-1')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    await expect(controller.listPartners()).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(controller.createPartner({})).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(
      controller.updatePartner('partner-1', {}),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(controller.deletePartner('partner-1')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    await expect(controller.listTestimonials()).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(controller.createTestimonial({})).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(
      controller.updateTestimonial('testimonial-1', {}),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      controller.deleteTestimonial('testimonial-1'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    await expect(controller.listTeamMembers()).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(controller.createTeamMember({})).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(
      controller.updateTeamMember('member-1', {}),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      controller.deleteTeamMember('member-1'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
