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
    mockSelect.mockReset().mockReturnThis();
    mockOrder.mockReset().mockReturnThis();
    mockEq.mockReset().mockReturnThis();
    mockSingle.mockReset();
    mockUpdate.mockReset().mockReturnThis();
    mockDelete.mockReset().mockReturnThis();
    mockUpsert.mockReset().mockReturnThis();
    mockInviteUser.mockReset();

    mockClient.from.mockImplementation(() => ({
      select: mockSelect,
      order: mockOrder,
      eq: mockEq,
      single: mockSingle,
      update: mockUpdate,
      delete: mockDelete,
      upsert: mockUpsert,
    }));

    service = new UsersService(mockSupabaseService as never);
  });

  describe('findAll', () => {
    it('Given users in database, When findAll is called, Then returns mapped DTOs', async () => {
      mockOrder.mockResolvedValueOnce({ data: [mockUserRow], error: null });

      const result = await service.findAll();

      expect(mockClient.from).toHaveBeenCalledWith('app_user');
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
        error: { code: 'PGRST116', message: 'Not found' },
      });

      await expect(service.findOne('unknown-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('Given a non-not-found Supabase error, When findOne is called, Then throws InternalServerErrorException', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST001', message: 'Unexpected' },
      });

      await expect(service.findOne('user-1')).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('Given a Supabase error without string code, When findOne is called, Then throws InternalServerErrorException', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Unexpected without code' },
      });

      await expect(service.findOne('user-1')).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('Given no row and no Supabase error, When findOne is called, Then throws NotFoundException', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await expect(service.findOne('user-1')).rejects.toThrow(
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

    it('Given all optional fields, When update is called, Then snake_case payload fields are sent to Supabase', async () => {
      mockSingle.mockResolvedValueOnce({ data: mockUserRow, error: null });

      await service.update('user-1', {
        email: 'alice+update@example.com',
        firstName: 'Alicia',
        lastName: 'Martin-Dupont',
        role: 'admin',
        phone: '+33123456789',
        preferredContactChannel: 'email',
        isActive: false,
      });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'alice+update@example.com',
          first_name: 'Alicia',
          last_name: 'Martin-Dupont',
          role: 'admin',
          phone: '+33123456789',
          preferred_contact_channel: 'email',
          is_active: false,
        }),
      );
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

    it('Given an existing user but delete fails, When remove is called, Then throws InternalServerErrorException', async () => {
      const existingQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest
          .fn()
          .mockResolvedValue({ data: { id: 'user-1' }, error: null }),
      };

      const deleteQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: { message: 'Delete error' } }),
      };

      mockClient.from
        .mockImplementationOnce(() => existingQuery)
        .mockImplementationOnce(() => deleteQuery);

      await expect(service.remove('user-1')).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    describe('invite', () => {
      it('Given valid payload, When invite is called, Then creates invited user profile and returns DTO', async () => {
        mockInviteUser.mockResolvedValueOnce({
          data: { user: { id: 'user-1' } },
          error: null,
        });
        mockSingle.mockResolvedValueOnce({ data: mockUserRow, error: null });

        const result = await service.invite({
          email: 'alice@example.com',
          firstName: 'Alice',
          lastName: 'Martin',
          role: 'participant',
          isActive: true,
        });

        expect(mockClient.from).toHaveBeenCalledWith('app_user');
        expect(mockInviteUser).toHaveBeenCalledWith('alice@example.com', {
          data: {
            first_name: 'Alice',
            last_name: 'Martin',
            role: 'participant',
          },
        });
        expect(result.id).toBe('user-1');
        expect(result.email).toBe('alice@example.com');
      });

      it('Given an auth invite error, When invite is called, Then throws InternalServerErrorException', async () => {
        mockInviteUser.mockResolvedValueOnce({
          data: null,
          error: { message: 'Auth error' },
        });

        await expect(
          service.invite({
            email: 'alice@example.com',
            firstName: 'Alice',
            lastName: 'Martin',
            role: 'participant',
            isActive: true,
          }),
        ).rejects.toThrow(InternalServerErrorException);
      });

      it('Given invite response without user, When invite is called, Then throws InternalServerErrorException', async () => {
        mockInviteUser.mockResolvedValueOnce({
          data: {},
          error: null,
        });

        await expect(
          service.invite({
            email: 'alice@example.com',
            firstName: 'Alice',
            lastName: 'Martin',
            role: 'participant',
            isActive: true,
          }),
        ).rejects.toThrow(InternalServerErrorException);
      });

      it('Given a successful invite with optional fields omitted, When invite is called, Then defaults are applied in upsert payload', async () => {
        mockInviteUser.mockResolvedValueOnce({
          data: { user: { id: 'user-1' } },
          error: null,
        });
        mockSingle.mockResolvedValueOnce({ data: mockUserRow, error: null });

        await service.invite({
          email: 'alice@example.com',
          firstName: 'Alice',
          lastName: 'Martin',
          role: 'participant',
        });

        expect(mockUpsert).toHaveBeenCalledWith(
          expect.objectContaining({
            phone: null,
            preferred_contact_channel: null,
            is_active: true,
          }),
          { onConflict: 'id' },
        );
      });

      it('Given invite succeeds but profile upsert fails, When invite is called, Then throws InternalServerErrorException', async () => {
        mockInviteUser.mockResolvedValueOnce({
          data: { user: { id: 'user-1' } },
          error: null,
        });
        mockSingle.mockResolvedValueOnce({
          data: null,
          error: { message: 'Upsert error' },
        });

        await expect(
          service.invite({
            email: 'alice@example.com',
            firstName: 'Alice',
            lastName: 'Martin',
            role: 'participant',
            isActive: true,
          }),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });
  });
});
