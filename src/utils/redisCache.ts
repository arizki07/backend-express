import { redisClient } from "../config/redis";

export const setCache = async (key: string, value: any, ttl: number) => {
  await redisClient.set(key, JSON.stringify(value), "EX", ttl);
};

export const getCache = async (key: string) => {
  const data = await redisClient.get(key);
  if (!data) return null;
  return JSON.parse(data);
};

export const delCache = async (key: string) => {
  await redisClient.del(key);
};
