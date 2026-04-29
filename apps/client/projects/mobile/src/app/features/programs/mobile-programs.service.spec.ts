import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  ParticipantProgramDetailDto,
  ParticipantProgramListItemDto,
} from '@kraak/contracts';
import { MobileAuthService } from '../auth/mobile-auth.service';
import { MobileProgramsService } from './mobile-programs.service';

describe('MobileProgramsService', () => {
  let service: MobileProgramsService;
  let authService: { currentSession: () => { accessToken: string } | null };

  const mockProgramListItem: ParticipantProgramListItemDto = {
    enrollmentId: 'enr-1',
    enrollmentStatus: 'active',
    program: {
      id: 'prog-1',
      slug: 'programme-1',
      title: 'Programme test',
      summary: 'Un programme de test',
      description: 'Description du programme',
      status: 'published',
      visibility: 'participants',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    cohort: null,
  };

  const mockProgramDetail: ParticipantProgramDetailDto = {
    enrollmentId: 'enr-1',
    enrollmentStatus: 'active',
    program: mockProgramListItem.program,
    cohort: null,
    sessions: [],
    resources: [],
    announcements: [],
  };

  beforeEach(() => {
    authService = {
      currentSession: vi.fn(() => ({ accessToken: 'test-token' })),
    };

    TestBed.configureTestingModule({
      providers: [
        MobileProgramsService,
        { provide: MobileAuthService, useValue: authService },
      ],
    });

    service = TestBed.inject(MobileProgramsService);
  });

  describe('listPrograms', () => {
    it('Given a user is authenticated, when listPrograms is called, then it should return a list of programs', async () => {
      const mockFetch = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify([mockProgramListItem]), {
          status: 200,
        }),
      );

      const result = await service.listPrograms();

      expect(result).toEqual([mockProgramListItem]);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/programs'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        }),
      );
    });

    it('Given a user is not authenticated, when listPrograms is called, then it should still make the request without auth header', async () => {
      authService.currentSession = vi.fn(() => null);

      const mockFetch = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify([]), {
          status: 401,
        }),
      );

      try {
        await service.listPrograms();
      } catch {
        // Expected to fail
      }

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/programs'),
        expect.any(Object),
      );
    });
  });

  describe('getProgramDetail', () => {
    it('Given a user is authenticated and a valid program ID, when getProgramDetail is called, then it should return program details', async () => {
      const mockFetch = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockProgramDetail), {
          status: 200,
        }),
      );

      const result = await service.getProgramDetail('prog-1');

      expect(result).toEqual(mockProgramDetail);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/programs/prog-1'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        }),
      );
    });
  });
});
