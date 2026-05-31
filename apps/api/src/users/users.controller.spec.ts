import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UsersController } from './users.controller';

const mockFindAll = jest.fn();
const mockFindOne = jest.fn();
const mockUpdate = jest.fn();
const mockRemove = jest.fn();
const mockInvite = jest.fn();

const mockUsersService = {
  findAll: mockFindAll,
  findOne: mockFindOne,
  update: mockUpdate,
  remove: mockRemove,
  invite: mockInvite,
};

const mockRequireAdminAccess = jest.fn();

jest.mock('../shared/admin-access.utils', () => ({
  requireAdminAccess: (...args: unknown[]) => mockRequireAdminAccess(...args),
}));

const mockAuthService = {};

const validToken = 'Bearer valid-token';

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    controller = new UsersController(
      mockUsersService as never,
      mockAuthService as never,
    );
  });

  describe('findAll', () => {
    it('Given an admin token, When findAll is called, Then returns user list', async () => {
      const users = [{ id: '1', email: 'alice@example.com' }];
      mockFindAll.mockResolvedValueOnce(users);

      const result = await controller.findAll(validToken);

      expect(result).toEqual(users);
      expect(mockRequireAdminAccess).toHaveBeenCalledWith(
        mockAuthService,
        validToken,
      );
    });

    it('Given a missing token, When findAll is called, Then throws UnauthorizedException', async () => {
      mockRequireAdminAccess.mockRejectedValueOnce(new UnauthorizedException());

      await expect(controller.findAll('')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('findOne', () => {
    it('Given a valid admin token and existing ID, When findOne is called, Then returns user', async () => {
      const user = { id: '1', email: 'alice@example.com' };
      mockFindOne.mockResolvedValueOnce(user);

      const result = await controller.findOne('1', validToken);

      expect(result).toEqual(user);
    });

    it('Given a missing token, When findOne is called, Then throws UnauthorizedException', async () => {
      mockRequireAdminAccess.mockRejectedValueOnce(new UnauthorizedException());

      await expect(controller.findOne('1', '')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('update', () => {
    it('Given valid update data, When update is called, Then returns updated user', async () => {
      const updated = {
        id: '1',
        firstName: 'Alicia',
        email: 'alice@example.com',
      };
      mockUpdate.mockResolvedValueOnce(updated);

      const result = await controller.update(
        '1',
        { firstName: 'Alicia' },
        validToken,
      );

      expect(result.firstName).toBe('Alicia');
    });

    it('Given invalid update payload, When update is called, Then throws BadRequestException', async () => {
      await expect(
        controller.update('1', { role: 'invalid-role' }, validToken),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('invite', () => {
    it('Given valid invite data, When invite is called, Then returns created user', async () => {
      const user = { id: '2', email: 'bob@example.com' };
      mockInvite.mockResolvedValueOnce(user);

      const result = await controller.invite(
        {
          email: 'bob@example.com',
          firstName: 'Bob',
          lastName: 'Dupont',
          role: 'participant',
        },
        validToken,
      );

      expect(result.email).toBe('bob@example.com');
    });

    it('Given invalid invite payload, When invite is called, Then throws BadRequestException', async () => {
      await expect(
        controller.invite({ email: 'not-an-email' }, validToken),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('Given a valid admin token, When remove is called, Then the user is deleted', async () => {
      mockRemove.mockResolvedValueOnce(undefined);

      await controller.remove('1', validToken);

      expect(mockRequireAdminAccess).toHaveBeenCalledWith(
        mockAuthService,
        validToken,
      );
      expect(mockRemove).toHaveBeenCalledWith('1');
    });
  });
});
