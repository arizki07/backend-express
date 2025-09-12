// tests/services/auth.service.test.ts
import {
  loginService,
  refreshService,
  logoutService,
  meService,
} from '../../src/services/auth.service';
import { User } from '../../src/models/user.model';
import { redisClient } from '../../src/config/redis';
import { comparePassword } from '../../src/utils/hash';
import jwt from 'jsonwebtoken';
import { ACCESS_TOKEN_EXPIRE, JWT_SECRET } from '../../src/config/jwt';

// Mocking the dependencies
jest.mock('../../src/models/user.model');
jest.mock('../../src/config/redis');
jest.mock('../../src/utils/hash');
jest.mock('jsonwebtoken');
jest.mock('../../src/config/jwt', () => ({
  JWT_SECRET: 'test_jwt_secret',
  ACCESS_TOKEN_EXPIRE: 3600, // 1 hour in seconds
}));

const mockUser = {
  id: 1,
  name: 'John Doe',
  username: 'johndoe',
  password_hash: 'hashed_password',
  role: 'user',
};

const mockToken = 'mock_jwt_token';
const mockPayload = { id: 1, role: 'user' };

describe('Auth Service', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- loginService Tests ---
  describe('loginService', () => {
    it('should return token and user data on successful login', async () => {
      // Mocking successful scenario
      (User.findOne as jest.Mock).mockResolvedValue({
        ...mockUser,
        role: 'user', // Menambahkan role
      });
      (User.findOne as jest.Mock).mockResolvedValueOnce(mockUser);
      (comparePassword as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);
      (redisClient.set as jest.Mock).mockResolvedValue('OK');

      const result = await loginService('johndoe', 'password123');

      expect(User.findOne).toHaveBeenCalledWith({ where: { username: 'johndoe' } });
      expect(comparePassword).toHaveBeenCalledWith('password123', mockUser.password_hash);
      expect(jwt.sign).toHaveBeenCalledWith({ id: mockUser.id, role: 'user' }, JWT_SECRET, {
        expiresIn: '1h',
      });
      expect(redisClient.set).toHaveBeenCalledWith(
        `token_${mockToken}`,
        mockToken,
        'EX',
        ACCESS_TOKEN_EXPIRE,
      );
      expect(result).toEqual({
        token: mockToken,
        user: mockUser,
        expiredAt: expect.any(String),
      });
    });

    it('should throw an error for a non-existent user', async () => {
      // Mocking failure scenario: user not found
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(loginService('nonexistent', 'password123')).rejects.toThrow(
        'username atau password salah',
      );
      expect(User.findOne).toHaveBeenCalledWith({ where: { username: 'nonexistent' } });
      expect(comparePassword).not.toHaveBeenCalled();
    });

    it('should throw an error for incorrect password', async () => {
      // Mocking failure scenario: incorrect password
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(loginService('johndoe', 'wrongpassword')).rejects.toThrow(
        'username atau password salah',
      );
      expect(User.findOne).toHaveBeenCalledWith({ where: { username: 'johndoe' } });
      expect(comparePassword).toHaveBeenCalledWith('wrongpassword', mockUser.password_hash);
    });
  });

  // --- refreshService Tests ---
  describe('refreshService', () => {
    it('should return a new token on successful refresh', async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(mockToken);
      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);
      (jwt.sign as jest.Mock).mockReturnValue('new_mock_token');
      (redisClient.del as jest.Mock).mockResolvedValue(1);
      (redisClient.set as jest.Mock).mockResolvedValue('OK');

      const result = await refreshService(mockToken);

      expect(redisClient.get).toHaveBeenCalledWith(`token_${mockToken}`);
      expect(jwt.verify).toHaveBeenCalledWith(mockToken, JWT_SECRET);
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: mockPayload.id, role: mockPayload.role },
        JWT_SECRET,
        { expiresIn: '1h' },
      );
      expect(redisClient.del).toHaveBeenCalledWith(`token_${mockToken}`);
      expect(redisClient.set).toHaveBeenCalledWith(
        'token_new_mock_token',
        'new_mock_token',
        'EX',
        ACCESS_TOKEN_EXPIRE,
      );
      expect(result.token).toBe('new_mock_token');
      expect(result.expiredAt).toBeDefined();
    });

    it('should throw an error for an invalid token', async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(null);

      await expect(refreshService('invalid_token')).rejects.toThrow('Invalid token');
    });
  });

  // MeService Tests ---
  describe('meService', () => {
    const mockUserMe = {
      id: 1,
      name: 'John Doe',
      username: 'johndoe',
      role: 'user',
      created_by: 1,
      updated_by: 1,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return user data if user exists', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUserMe);

      const result = await meService(1);

      expect(User.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        attributes: [
          'id',
          'name',
          'username',
          'role',
          'created_by',
          'updated_by',
          'created_at',
          'updated_at',
          'deleted_at',
        ],
      });

      expect(result).toEqual(mockUserMe);
    });

    it('should throw error if user not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(meService(999)).rejects.toThrow('User not found');

      expect(User.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
        attributes: [
          'id',
          'name',
          'username',
          'role',
          'created_by',
          'updated_by',
          'created_at',
          'updated_at',
          'deleted_at',
        ],
      });
    });

    // --- logoutService Tests ---
    describe('logoutService', () => {
      it('should delete all tokens for a given user ID', async () => {
        const token1 = 'token_user_1_a';
        const token2 = 'token_user_1_b';
        const token3 = 'token_user_2_c';

        // Mock Redis keys and values
        (redisClient.keys as jest.Mock).mockResolvedValue([
          `token_${token1}`,
          `token_${token2}`,
          `token_${token3}`,
        ]);
        (redisClient.get as jest.Mock)
          .mockResolvedValueOnce(token1)
          .mockResolvedValueOnce(token2)
          .mockResolvedValueOnce(token3);
        (jwt.verify as jest.Mock)
          .mockReturnValueOnce({ id: 1, role: 'user' })
          .mockReturnValueOnce({ id: 1, role: 'user' })
          .mockReturnValueOnce({ id: 2, role: 'admin' });
        (redisClient.del as jest.Mock).mockResolvedValue(1);

        await logoutService(1);

        expect(redisClient.keys).toHaveBeenCalledWith('token_*');
        expect(redisClient.get).toHaveBeenCalledTimes(3);
        expect(jwt.verify).toHaveBeenCalledTimes(3);
        expect(redisClient.del).toHaveBeenCalledTimes(2);
        expect(redisClient.del).toHaveBeenCalledWith(`token_${token1}`);
        expect(redisClient.del).toHaveBeenCalledWith(`token_${token2}`);
        expect(redisClient.del).not.toHaveBeenCalledWith(`token_${token3}`);
      });

      // Test baru untuk menutupi skenario nilai null pada Redis
      it('should handle invalid or missing tokens gracefully', async () => {
        const token1 = 'token_user_1_a';
        const invalidToken = 'token_user_1_b'; // Token ini akan di-mock sebagai null

        (redisClient.keys as jest.Mock).mockResolvedValue([
          `token_${token1}`,
          `token_${invalidToken}`,
        ]);
        (redisClient.get as jest.Mock).mockResolvedValueOnce(token1).mockResolvedValueOnce(null); // Memastikan `value` adalah null

        (jwt.verify as jest.Mock).mockReturnValueOnce({ id: 1, role: 'user' });
        (redisClient.del as jest.Mock).mockResolvedValue(1);

        await logoutService(1);

        expect(redisClient.keys).toHaveBeenCalledWith('token_*');
        expect(redisClient.get).toHaveBeenCalledTimes(2);
        expect(redisClient.del).toHaveBeenCalledTimes(1); // Hanya dipanggil sekali untuk token yang valid
        expect(redisClient.del).toHaveBeenCalledWith(`token_${token1}`);
      });
    });
  });
});
