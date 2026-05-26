import {
  BadRequestException,
  NotFoundException,
  RequestMethod,
  UnauthorizedException,
} from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth/auth.service';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsService } from './announcements.service';

describe('AnnouncementsController', () => {
  let controller: AnnouncementsController;

  const mockListResponse = {
    data: [
      {
        id: 'ann-001',
        title: 'Important Update',
        body: 'This is an important announcement for all participants',
        priority: 'high',
        audienceType: 'all_participants',
        programId: null,
        cohortId: null,
        status: 'published',
        publishedAt: '2026-04-20T10:00:00Z',
        createdByUserId: 'user-001',
        createdAt: '2026-04-19T10:00:00Z',
        updatedAt: '2026-04-20T10:00:00Z',
      },
    ],
    total: 1,
  };

  const mockAnnouncement = mockListResponse.data[0];

  const mockAnnouncementsService = {
    listAnnouncements: jest.fn(),
    getAnnouncementById: jest.fn(),
    createAnnouncement: jest.fn(),
    updateAnnouncement: jest.fn(),
    deleteAnnouncement: jest.fn(),
  };

  const authService = {
    getSession: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockAnnouncementsService.listAnnouncements.mockResolvedValue(
      mockListResponse,
    );
    mockAnnouncementsService.getAnnouncementById.mockResolvedValue(
      mockAnnouncement,
    );
    mockAnnouncementsService.createAnnouncement.mockResolvedValue(
      mockAnnouncement,
    );
    mockAnnouncementsService.updateAnnouncement.mockResolvedValue(
      mockAnnouncement,
    );
    authService.getSession.mockResolvedValue({
      profile: {
        appUser: {
          id: 'user-001',
          role: 'admin',
        },
      },
    });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnnouncementsController],
      providers: [
        {
          provide: AnnouncementsService,
          useValue: mockAnnouncementsService,
        },
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AnnouncementsController>(AnnouncementsController);
  });

  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });

  it('Given le module announcements, When on lit ses métadonnées NestJS, Then GET /announcements est exposé', () => {
    expect(Reflect.getMetadata(PATH_METADATA, AnnouncementsController)).toBe(
      'announcements',
    );
    expect(
      Reflect.getMetadata(METHOD_METADATA, controller.listAnnouncements),
    ).toBe(RequestMethod.GET);
  });

  describe('listAnnouncements', () => {
    it('Given: valid authorization header, When: listAnnouncements called, Then: return list of announcements', async () => {
      const result = await controller.listAnnouncements(
        'Bearer ' + 'access-token',
        1,
        20,
      );

      expect(result).toEqual(mockListResponse);
      expect(mockAnnouncementsService.listAnnouncements).toHaveBeenCalledWith(
        'access-token',
        1,
        20,
      );
    });

    it('Given: missing authorization header, When: listAnnouncements called, Then: return public published announcements', async () => {
      const result = await controller.listAnnouncements();

      expect(result).toEqual(mockListResponse);
      expect(mockAnnouncementsService.listAnnouncements).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined,
      );
    });

    it('Given: invalid authorization header format, When: listAnnouncements called, Then: throw UnauthorizedException', async () => {
      await expect(
        controller.listAnnouncements('InvalidToken'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getAnnouncementById', () => {
    it('Given: valid authorization header and announcement ID, When: getAnnouncementById called, Then: return announcement detail', async () => {
      const result = await controller.getAnnouncementById(
        'ann-001',
        'Bearer ' + 'access-token',
      );

      expect(result).toEqual(mockAnnouncement);
      expect(mockAnnouncementsService.getAnnouncementById).toHaveBeenCalledWith(
        'ann-001',
        'access-token',
      );
    });

    it('Given: valid authorization but non-existent announcement ID, When: getAnnouncementById called, Then: throw NotFoundException', async () => {
      mockAnnouncementsService.getAnnouncementById.mockRejectedValueOnce(
        new NotFoundException('Announcement not found'),
      );

      await expect(
        controller.getAnnouncementById(
          'non-existent',
          'Bearer ' + 'access-token',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('Given: missing authorization header, When: getAnnouncementById called, Then: throw UnauthorizedException', async () => {
      await expect(controller.getAnnouncementById('ann-001')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('admin CRUD', () => {
    it('Given un payload valide et un token admin, When createAnnouncement est appelé, Then le service reçoit le payload et le createdByUserId', async () => {
      await controller.createAnnouncement(
        {
          title: 'Annonce',
          body: 'Contenu',
          audienceType: 'all_participants',
        },
        'Bearer ' + 'access-token',
      );

      expect(mockAnnouncementsService.createAnnouncement).toHaveBeenCalledWith(
        {
          title: 'Annonce',
          body: 'Contenu',
          audienceType: 'all_participants',
        },
        'user-001',
      );
    });

    it('Given un payload invalide, When createAnnouncement est appelé, Then une BadRequestException est renvoyée', async () => {
      await expect(
        controller.createAnnouncement(
          {
            title: '',
            body: 'Contenu',
            audienceType: 'all_participants',
          },
          'Bearer ' + 'access-token',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('Given un payload valide, When patchAnnouncement est appelé, Then la route PUT est réutilisée', async () => {
      await controller.patchAnnouncement(
        'ann-001',
        {
          body: 'Contenu mis à jour',
        },
        'Bearer ' + 'access-token',
      );

      expect(mockAnnouncementsService.updateAnnouncement).toHaveBeenCalledWith(
        'ann-001',
        {
          body: 'Contenu mis à jour',
        },
      );
    });

    it('Given un token admin valide, When deleteAnnouncement est appelé, Then le service deleteAnnouncement est invoqué', async () => {
      await controller.deleteAnnouncement(
        'ann-001',
        'Bearer ' + 'access-token',
      );

      expect(mockAnnouncementsService.deleteAnnouncement).toHaveBeenCalledWith(
        'ann-001',
      );
    });

    it('Given un header Authorization absent, When createAnnouncement est appelé, Then une UnauthorizedException est renvoyée', async () => {
      await expect(
        controller.createAnnouncement({
          title: 'Annonce',
          body: 'Contenu',
          audienceType: 'all_participants',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
