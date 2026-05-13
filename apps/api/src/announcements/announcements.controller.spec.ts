import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import type { AnnouncementDto } from '@kraak/contracts';
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
      } satisfies AnnouncementDto,
    ],
    total: 1,
  };

  const mockAnnouncement = mockListResponse.data[0];

  const mockAnnouncementsService = {
    listAnnouncements: jest.fn(),
    getAnnouncementById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnnouncementsController],
      providers: [
        {
          provide: AnnouncementsService,
          useValue: mockAnnouncementsService,
        },
      ],
    }).compile();

    controller = module.get<AnnouncementsController>(AnnouncementsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listAnnouncements', () => {
    it('Given: valid authorization header, When: listAnnouncements called, Then: return list of announcements', async () => {
      const authHeader = 'Bearer valid-token';
      mockAnnouncementsService.listAnnouncements.mockResolvedValue(
        mockListResponse,
      );

      const result = await controller.listAnnouncements(authHeader, 1, 20);

      expect(result).toEqual(mockListResponse);
      expect(mockAnnouncementsService.listAnnouncements).toHaveBeenCalledWith(
        'valid-token',
        1,
        20,
      );
    });

    it('Given: valid authorization header with pagination, When: listAnnouncements called, Then: apply pagination parameters', async () => {
      const authHeader = 'Bearer valid-token';
      mockAnnouncementsService.listAnnouncements.mockResolvedValue(
        mockListResponse,
      );

      await controller.listAnnouncements(authHeader, 2, 50);

      expect(mockAnnouncementsService.listAnnouncements).toHaveBeenCalledWith(
        'valid-token',
        2,
        50,
      );
    });

    it('Given: valid authorization header without pagination params, When: listAnnouncements called, Then: undefined page and limit are forwarded', async () => {
      const authHeader = 'Bearer valid-token';
      mockAnnouncementsService.listAnnouncements.mockResolvedValue(
        mockListResponse,
      );

      await controller.listAnnouncements(authHeader);

      expect(mockAnnouncementsService.listAnnouncements).toHaveBeenCalledWith(
        'valid-token',
        undefined,
        undefined,
      );
    });

    it('Given: missing authorization header, When: listAnnouncements called, Then: throw UnauthorizedException', async () => {
      await expect(controller.listAnnouncements()).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('Given: invalid authorization header format, When: listAnnouncements called, Then: throw UnauthorizedException', async () => {
      const authHeader = 'InvalidToken';

      await expect(controller.listAnnouncements(authHeader)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('Given: malformed Bearer token, When: listAnnouncements called, Then: throw UnauthorizedException', async () => {
      const authHeader = 'Bearer invalid token extra';

      await expect(controller.listAnnouncements(authHeader)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getAnnouncementById', () => {
    it('Given: valid authorization header and announcement ID, When: getAnnouncementById called, Then: return announcement detail', async () => {
      const authHeader = 'Bearer valid-token';
      const announcementId = 'ann-001';

      mockAnnouncementsService.getAnnouncementById.mockResolvedValue(
        mockAnnouncement,
      );

      const result = await controller.getAnnouncementById(
        announcementId,
        authHeader,
      );

      expect(result).toEqual(mockAnnouncement);
      expect(mockAnnouncementsService.getAnnouncementById).toHaveBeenCalledWith(
        announcementId,
        'valid-token',
      );
    });

    it('Given: valid authorization but non-existent announcement ID, When: getAnnouncementById called, Then: throw NotFoundException', async () => {
      const authHeader = 'Bearer valid-token';
      const announcementId = 'non-existent';

      mockAnnouncementsService.getAnnouncementById.mockRejectedValue(
        new NotFoundException('Announcement not found'),
      );

      await expect(
        controller.getAnnouncementById(announcementId, authHeader),
      ).rejects.toThrow(NotFoundException);
    });

    it('Given: missing authorization header, When: getAnnouncementById called, Then: throw UnauthorizedException', async () => {
      const announcementId = 'ann-001';

      await expect(
        controller.getAnnouncementById(announcementId),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('Given: authorization argument omitted, When: getAnnouncementById called, Then: throw UnauthorizedException', async () => {
      const announcementId = 'ann-001';

      await expect(
        controller.getAnnouncementById(announcementId),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('Given: invalid authorization header format, When: getAnnouncementById called, Then: throw UnauthorizedException', async () => {
      const authHeader = 'InvalidToken';
      const announcementId = 'ann-001';

      await expect(
        controller.getAnnouncementById(announcementId, authHeader),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('Given: unauthorized participant accessing announcement, When: getAnnouncementById called, Then: throw NotFoundException', async () => {
      const authHeader = 'Bearer valid-token';
      const announcementId = 'restricted-ann';

      mockAnnouncementsService.getAnnouncementById.mockRejectedValue(
        new NotFoundException('Announcement not found or not accessible'),
      );

      await expect(
        controller.getAnnouncementById(announcementId, authHeader),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
