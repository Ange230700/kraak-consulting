import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UsersService } from './users.service';

const mockSelect = jest.fn();
const mockOrder = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockUpsert = jest.fn();
const mockInviteUser = jest.fn();

const mockClient = {
  from: jest.fn(() => ({
    select: mockSelect.mockReturnThis(),
    order: mockOrder.mockReturnThis(),
    eq: mockEq.mockReturnThis(),
    single: mockSingle,
    update: mockUpdate.mockReturnThis(),
    delete: mockDelete.mockReturnThis(),
    upsert: mockUpsert.mockReturnThis(),
  })),
  auth: {
    admin: {
      inviteUserByEmail: mockInviteUser,
    },
  },
};

const mockSupabaseService = {
  getClient: jest.fn(() => mockClient),
};

const mockUserRow = {
  id: 'user-1',
  email: 'alice@example.com',
  role: 'participant',
  first_name: 'Alice',
  last_name: 'Martin',
  phone: null,
  preferred_contact_channel: null,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService(mockSupabaseService as never);
  });

  describe('findAll', () => {
    it('Given users in database, When findAll is called, Then returns mapped DTOs', async () => {
      mockOrder.mockResolvedValueOnce({ data: [mockUserRow], error: null });

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('alice@example.com');
      expect(result[0].firstName).toBe('Alice');
    });

    it('Given a Supabase error, When findAll is called, Then throws InternalServerErrorException', async () => {
      mockOrder.mockResolvedValueOnce({
        data: null,
        error: { message: 'DB error' },
      });

      await expect(service.findAll()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findOne', () => {
    it('Given an existing user ID, When findOne is called, Then returns the user DTO', async () => {
      mockSingle.mockResolvedValueOnce({ data: mockUserRow, error: null });

      const result = await service.findOne('user-1');

      expect(result.id).toBe('user-1');
      expect(result.lastName).toBe('Martin');
    });

    it('Given an unknown user ID, When findOne is called, Then throws NotFoundException', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(service.findOne('unknown-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('Given valid update data, When update is called, Then returns updated DTO', async () => {
      const updatedRow = {
        ...mockUserRow,
        first_name: 'Alicia',
        updated_at: '2024-06-01T00:00:00Z',
      };
      mockSingle.mockResolvedValueOnce({ data: updatedRow, error: null });

      const result = await service.update('user-1', { firstName: 'Alicia' });

      expect(result.firstName).toBe('Alicia');
    });

    it('Given a Supabase error on update, When update is called, Then throws InternalServerErrorException', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'DB error' },
      });

      await expect(
        service.update('user-1', { firstName: 'X' }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('remove', () => {
    it('Given an existing user, When remove is called, Then deletes without error', async () => {
      mockSingle.mockResolvedValueOnce({ data: { id: 'user-1' }, error: null });
      mockDelete.mockReturnValue({
        eq: jest.fn().mockResolvedValueOnce({ error: null }),
      });

      await expect(service.remove('user-1')).resolves.not.toThrow();
    });

    it('Given an unknown user, When remove is called, Then throws NotFoundException', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(service.remove('unknown-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
