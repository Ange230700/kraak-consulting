import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SupportRequestsController } from './support-requests.controller';
import { SupportService } from './support.service';

describe('SupportRequestsController', () => {
  let controller: SupportRequestsController;

  const supportService = {
    listSupportRequests: jest.fn(),
    updateSupportRequestStatus: jest.fn(),
  };

  beforeEach(async () => {
    supportService.listSupportRequests.mockReset();
    supportService.updateSupportRequestStatus.mockReset();

    supportService.listSupportRequests.mockResolvedValue([
      {
        id: 'req-1',
        userId: 'user-1',
        participantId: 'participant-1',
        subject: 'Connexion impossible',
        message: 'Je ne peux plus acceder a mon espace.',
        status: 'open',
        category: 'technical',
        assignedToUserId: null,
        createdAt: '2026-04-29T10:00:00.000Z',
        updatedAt: '2026-04-29T10:00:00.000Z',
      },
    ]);

    supportService.updateSupportRequestStatus.mockResolvedValue({
      id: 'req-1',
      userId: 'user-1',
      participantId: 'participant-1',
      subject: 'Connexion impossible',
      message: 'Je ne peux plus acceder a mon espace.',
      status: 'in_progress',
      category: 'technical',
      assignedToUserId: 'admin-1',
      createdAt: '2026-04-29T10:00:00.000Z',
      updatedAt: '2026-04-29T10:05:00.000Z',
    });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupportRequestsController],
      providers: [
        {
          provide: SupportService,
          useValue: supportService,
        },
      ],
    }).compile();

    controller = module.get<SupportRequestsController>(
      SupportRequestsController,
    );
  });

  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });

  it('Given un header Bearer valide, When la liste est demandee, Then le token est transmis au service', async () => {
    await controller.list('Bearer access-token');

    expect(supportService.listSupportRequests).toHaveBeenCalledWith(
      'access-token',
    );
  });

  it('Given un header absent, When la liste est demandee, Then une UnauthorizedException est renvoyee', async () => {
    await expect(controller.list(undefined)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('Given un argument authorization omis, When la liste est demandee, Then une UnauthorizedException est renvoyee', async () => {
    await expect(controller.list()).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('Given un payload de statut valide, When updateStatus est appele, Then le service est invoque avec token et payload normalise', async () => {
    await controller.updateStatus(
      'req-1',
      { status: ' in_progress ' },
      'Bearer access-token',
    );

    expect(supportService.updateSupportRequestStatus).toHaveBeenCalledWith(
      'req-1',
      { status: 'in_progress' },
      'access-token',
    );
  });

  it('Given un payload invalide, When updateStatus est appele, Then une BadRequestException est renvoyee', async () => {
    await expect(
      controller.updateStatus(
        'req-1',
        { status: 'pending' },
        'Bearer access-token',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('Given un header absent, When updateStatus est appele, Then une UnauthorizedException est renvoyee', async () => {
    await expect(
      controller.updateStatus('req-1', { status: 'in_progress' }, undefined),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('Given un argument authorization omis, When updateStatus est appele, Then une UnauthorizedException est renvoyee', async () => {
    await expect(
      controller.updateStatus('req-1', { status: 'in_progress' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
