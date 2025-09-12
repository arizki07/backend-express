import { User } from '../models/user.model';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, ACCESS_TOKEN_EXPIRE } from '../config/jwt';
import { redisClient } from '../config/redis';
import { comparePassword } from '../utils/hash';

export const loginService = async (username: string, password: string) => {
  const user = await User.findOne({ where: { username } });
  if (!user) throw new Error('username atau password salah');

  const isMatch = await comparePassword(password, user.password_hash);
  if (!isMatch) throw new Error('username atau password salah');

  // Generate access token
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: '1h',
  });

  // Simpan token di Redis
  await redisClient.set(`token_${token}`, token, 'EX', ACCESS_TOKEN_EXPIRE);

  // Ambil data user tanpa password
  const userData = await User.findOne({
    where: { username },
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

  return {
    token,
    user: userData,
    expiredAt: new Date(Date.now() + ACCESS_TOKEN_EXPIRE * 1000).toISOString(),
  };
};

export const refreshService = async (oldToken: string) => {
  const storedToken = await redisClient.get(`token_${oldToken}`);
  if (!storedToken) throw new Error('Invalid token');

  const payload: any = jwt.verify(oldToken, JWT_SECRET);

  const newToken = jwt.sign({ id: payload.id, role: payload.role }, JWT_SECRET, {
    expiresIn: '1h',
  });

  await redisClient.del(`token_${oldToken}`);
  await redisClient.set(`token_${newToken}`, newToken, 'EX', ACCESS_TOKEN_EXPIRE);

  return {
    token: newToken,
    expiredAt: new Date(Date.now() + ACCESS_TOKEN_EXPIRE * 1000).toISOString(),
  };
};

// Belum disertakan di test
export const meService = async (userId: number) => {
  const user = await (User as typeof User).findOne({
    where: { id: userId },
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

  if (!user) throw new Error('User not found');

  return user;
};

export const logoutService = async (userId: number) => {
  // Hapus semua token terkait user
  const keys = await redisClient.keys(`token_*`);
  for (const key of keys) {
    const value = await redisClient.get(key);
    if (value) {
      const payload: any = jwt.verify(value, JWT_SECRET);
      if (payload.id === userId) {
        await redisClient.del(key);
      }
    }
  }
};
