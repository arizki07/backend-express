import {
  getUsersService,
  getUserByIdService,
  createUserService,
  updateUserService,
  updatePasswordService,
  deleteUserService,
} from '../../src/services/user.service';
import { User } from '../../src/models/user.model';
import { hashPassword } from '../../src/utils/hash';
import { Op } from 'sequelize';

// Mocking dependencies
jest.mock('../../src/models/user.model');
jest.mock('../../src/utils/hash');

const mockUser = {
  id: 1,
  name: 'John Doe',
  username: 'johndoe',
  password_hash: 'hashed_password',
  role: 'user',
  toJSON: () => ({
    id: 1,
    name: 'John Doe',
    username: 'johndoe',
  }),
  update: jest.fn(),
};

describe('User Service', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- getUsersService Tests ---
  describe('getUsersService', () => {
    it('should get users with default pagination', async () => {
      (User.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [mockUser],
        count: 1,
      });

      const result = await getUsersService({});
      expect(User.findAndCountAll).toHaveBeenCalledWith({
        where: { deleted_at: null },
        limit: 10,
        offset: 0,
        order: [['id', 'ASC']],
      });
      expect(result.data).toEqual([mockUser]);
      expect(result.meta.totalData).toBe(1);
    });

    it('should filter users by query string', async () => {
      const query = { q: 'johndoe' };
      (User.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [mockUser],
        count: 1,
      });

      await getUsersService(query);
      expect(User.findAndCountAll).toHaveBeenCalledWith({
        where: {
          deleted_at: null,
          [Op.or]: [{ name: { [Op.like]: '%johndoe%' } }, { username: { [Op.like]: '%johndoe%' } }],
        },
        limit: 10,
        offset: 0,
        order: [['id', 'ASC']],
      });
    });

    it('should filter users by role', async () => {
      const query = { role: 'admin' };
      (User.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [mockUser],
        count: 1,
      });

      await getUsersService(query);
      expect(User.findAndCountAll).toHaveBeenCalledWith({
        where: { deleted_at: null, role: 'admin' },
        limit: 10,
        offset: 0,
        order: [['id', 'ASC']],
      });
    });

    it('should filter users by created date range', async () => {
      const query = { createdFrom: '2023-01-01', createdTo: '2023-12-31' };
      (User.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [mockUser],
        count: 1,
      });

      await getUsersService(query);
      expect(User.findAndCountAll).toHaveBeenCalledWith({
        where: {
          deleted_at: null,
          created_at: {
            [Op.gte]: new Date('2023-01-01'),
            [Op.lte]: new Date('2023-12-31'),
          },
        },
        limit: 10,
        offset: 0,
        order: [['id', 'ASC']],
      });
    });

    it('should sort users based on query parameters', async () => {
      const query = { sortBy: 'name', sortDir: 'DESC' };
      (User.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [mockUser],
        count: 1,
      });

      await getUsersService(query);
      expect(User.findAndCountAll).toHaveBeenCalledWith({
        where: { deleted_at: null },
        limit: 10,
        offset: 0,
        order: [['name', 'DESC']],
      });
    });
  });

  // --- getUserByIdService Tests ---
  describe('getUserByIdService', () => {
    it('should return a user if found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      const user = await getUserByIdService(1);
      expect(User.findOne).toHaveBeenCalledWith({ where: { id: 1, deleted_at: null } });
      expect(user).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      const user = await getUserByIdService(999);
      expect(user).toBeNull();
    });
  });

  // --- createUserService Tests ---
  describe('createUserService', () => {
    it('should create a new user and hash the password', async () => {
      const userData = {
        name: 'Jane Doe',
        username: 'janedoe',
        password: 'password123',
      };
      (hashPassword as jest.Mock).mockResolvedValue('hashed_password');
      (User.create as jest.Mock).mockResolvedValue(mockUser);

      const user = await createUserService(userData, 1);
      expect(hashPassword).toHaveBeenCalledWith('password123');
      expect(User.create).toHaveBeenCalledWith({
        ...userData,
        password_hash: 'hashed_password',
        created_by: 1,
        updated_by: 1,
      });
      expect(user).toEqual(mockUser);
    });
  });

  // --- updateUserService Tests ---
  describe('updateUserService', () => {
    it('should update a user successfully', async () => {
      const updateData = { name: 'John A. Doe' };

      const reqMock = { res: { locals: { __audit: {} as any } } };

      const updatedUserMock = {
        ...mockUser,
        ...updateData,
        toJSON: () => ({ ...mockUser.toJSON(), ...updateData }),
      };

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (mockUser.update as jest.Mock).mockResolvedValue(updatedUserMock);

      const updatedUser = await updateUserService(1, updateData, 1, reqMock as any);
      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(mockUser.update).toHaveBeenCalledWith({ ...updateData, updated_by: 1 });
      expect(reqMock.res.locals.__audit.before).toEqual(mockUser.toJSON());
      expect(reqMock.res.locals.__audit.after).toEqual(updatedUserMock.toJSON());
      expect(updatedUser).toEqual(updatedUserMock);
    });

    it('should throw an error if user not found', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);
      await expect(updateUserService(999, {}, 1)).rejects.toThrow('User not found');
    });
  });

  // --- updatePasswordService Tests ---
  describe('updatePasswordService', () => {
    it('should update user password successfully', async () => {
      const newPassword = 'newPassword123';
      const newHashedPassword = 'new_hashed_password';

      const reqMock = { res: { locals: { __audit: {} as any } } };

      const updatedUserMock = {
        ...mockUser,
        password_hash: newHashedPassword,
        toJSON: () => ({ ...mockUser.toJSON(), password_hash: newHashedPassword }),
      };

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (hashPassword as jest.Mock).mockResolvedValue(newHashedPassword);
      (mockUser.update as jest.Mock).mockResolvedValue(updatedUserMock);

      const updatedUser = await updatePasswordService(1, newPassword, 1, reqMock as any);
      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(hashPassword).toHaveBeenCalledWith(newPassword);
      expect(mockUser.update).toHaveBeenCalledWith({
        password_hash: newHashedPassword,
        updated_by: 1,
      });
      expect(updatedUser.password_hash).toBe('new_hashed_password');
    });

    it('should throw an error if user not found', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);
      await expect(updatePasswordService(999, 'new_password', 1)).rejects.toThrow('User not found');
    });
  });

  // --- deleteUserService Tests ---
  describe('deleteUserService', () => {
    it('should soft delete a user successfully', async () => {
      const reqMock = { res: { locals: { __audit: {} as any } } };
      const date = new Date();
      const deletedUserMock = {
        ...mockUser,
        deleted_at: date,
        toJSON: () => ({ ...mockUser.toJSON(), deleted_at: date }),
      };

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (mockUser.update as jest.Mock).mockResolvedValue(deletedUserMock);

      const deletedUser = await deleteUserService(1, 1, reqMock as any);
      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(mockUser.update).toHaveBeenCalledWith({ deleted_at: expect.any(Date), updated_by: 1 });
      expect(deletedUser.deleted_at).toBeDefined();
    });

    it('should throw an error if user not found', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);
      await expect(deleteUserService(999, 1)).rejects.toThrow('User not found');
    });
  });
});
