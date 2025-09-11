import { User } from "../models/user.model";
import jwt from "jsonwebtoken";
import {
  JWT_SECRET,
  ACCESS_TOKEN_EXPIRE,
  REFRESH_TOKEN_EXPIRE,
} from "../config/jwt";
import { redisClient } from "../config/redis";
import { comparePassword } from "../utils/hash";

export const loginService = async (username: string, password: string) => {
  const user = await User.findOne({ where: { username } });
  if (!user) throw new Error("username atau password salah");

  const isMatch = await comparePassword(password, user.password_hash);
  if (!isMatch) throw new Error("username atau password salah");

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRE,
  });
  const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRE,
  });

  await redisClient.set(
    `refresh_${user.id}`,
    refreshToken,
    "EX",
    REFRESH_TOKEN_EXPIRE
  );

  return { token, refreshToken, user, expiredAt: Date.now() + 60 * 60 * 1000 };
};

export const refreshService = async (oldToken: string) => {
  try {
    const payload: any = jwt.verify(oldToken, JWT_SECRET);
    const storedToken = await redisClient.get(`refresh_${payload.id}`);
    if (storedToken !== oldToken) throw new Error("Invalid refresh token");

    const newToken = jwt.sign({ id: payload.id }, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRE,
    });
    const newRefreshToken = jwt.sign({ id: payload.id }, JWT_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRE,
    });

    await redisClient.set(
      `refresh_${payload.id}`,
      newRefreshToken,
      "EX",
      REFRESH_TOKEN_EXPIRE
    );

    return { token: newToken, refreshToken: newRefreshToken };
  } catch {
    throw new Error("Invalid refresh token");
  }
};

export const logoutService = async (userId: number) => {
  await redisClient.del(`refresh_${userId}`);
};
