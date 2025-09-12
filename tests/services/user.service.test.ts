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

jest.mock('../../src/models/user.model');
jest.mock('../../src/utils/hash');

let mockUser: any;

beforeEach(() => {
  jest.clearAllMocks();
  mockUser = {
    id: 1,
    name: 'John Doe',
    username: 'johndoe',
    password_hash: 'hashed_password',
    role: 'user',
    deleted_at: null,
    toJSON() {
      return {
        id: this.id,
        name: this.name,
        username: this.username,
        password_hash: this.password_hash,
        role: this.role,
        deleted_at: this.deleted_at,
      };
    },
    update: jest.fn(async function (updates) {
      Object.assign(this, updates);
      return this;
    }),
    destroy: jest.fn(async function () {
      this.deleted_at = new Date();
      return this;
    }),
  };
});

describe('User Service', () => {
  // --- getUsersService ---
  describe('getUsersService', () => {
    it('should get users with default pagination', async () => {
      (User.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [mockUser], count: 1 });
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

    it('should get users with given filter', async () => {
      (User.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [mockUser], count: 1 });
      const result = await getUsersService({
        page: 1,
        limit: 15,
        q: 'gerald',
        role: 'user',
        createdFrom: Date.now(),
        createdTo: Date.now(),
        sortBy: 'name',
        sortDir: 'DESC',
      });
      expect(User.findAndCountAll).toHaveBeenCalled();
      expect(result.data).toEqual([mockUser]);
      expect(result.meta.totalData).toBe(1);
    });
  });

  // --- getUserByIdService ---
  describe('getUserByIdService', () => {
    it('should return user if found and not deleted', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      const result = await getUserByIdService(1);
      expect(User.findOne).toHaveBeenCalledWith({ where: { id: 1, deleted_at: null } });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      const result = await getUserByIdService(999);
      expect(result).toBeNull();
    });
  });

  // --- createUserService ---
  describe('createUserService', () => {
    it('should hash password and create user', async () => {
      const mockData = { name: 'Alice', username: 'alice123', password: 'secret', role: 'user' };
      const hashedPassword = 'hashedSecret';
      const createdUser = {
        ...mockData,
        password_hash: hashedPassword,
        created_by: 1,
        updated_by: 1,
      };

      (hashPassword as jest.Mock).mockResolvedValue(hashedPassword);
      (User.create as jest.Mock).mockResolvedValue(createdUser);

      const result = await createUserService(mockData, 1);

      expect(hashPassword).toHaveBeenCalledWith(mockData.password);
      expect(User.create).toHaveBeenCalledWith({
        ...mockData,
        password_hash: hashedPassword,
        created_by: 1,
        updated_by: 1,
      });
      expect(result).toEqual(createdUser);
    });
  });

  // --- updateUserService ---
  describe('updateUserService audit', () => {
    it('should set audit before and entityId', async () => {
      const reqMock: any = { res: { locals: {} } };
      // clone asli user sebelum update
      const userBeforeUpdate = { ...mockUser.toJSON() };

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      await updateUserService(1, { name: 'Updated' }, 1, reqMock);

      expect(reqMock.res.locals.__audit.before).toEqual(userBeforeUpdate);
      expect(reqMock.res.locals.__audit.entityId).toBe(1);
    });
  });

  // --- updatePasswordService ---
  describe('updatePasswordService audit', () => {
    it('should set audit before and entityId when updating password', async () => {
      const reqMock: any = { res: { locals: {} } };
      const userBeforeUpdate = { ...mockUser.toJSON() };

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (hashPassword as jest.Mock).mockResolvedValue('new_hash');

      await updatePasswordService(1, 'newpass', 1, reqMock);

      expect(reqMock.res.locals.__audit.before).toEqual(userBeforeUpdate);
      expect(reqMock.res.locals.__audit.entityId).toBe(1);
    });
  });

  // --- deleteUserService ---
  describe('deleteUserService', () => {
    it('should soft delete user and update updated_by', async () => {
      const reqMock: any = { res: { locals: {} } };
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (User.update as jest.Mock).mockResolvedValue([1]);
      const deletedUser = await deleteUserService(1, 1, reqMock);
      expect(mockUser.destroy).toHaveBeenCalled();
      expect(User.update).toHaveBeenCalledWith(
        { updated_by: 1 },
        { where: { id: 1 }, paranoid: false },
      );
      expect(deletedUser.deleted_at).toBeInstanceOf(Date);
      expect(reqMock.res.locals.__audit.before.id).toBe(1);
    });
  });
});
