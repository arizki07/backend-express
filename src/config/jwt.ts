import dotenv from "dotenv";
dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
export const ACCESS_TOKEN_EXPIRE = "60m"; // 60 menit
export const REFRESH_TOKEN_EXPIRE = 7 * 24 * 60 * 60; // 7 hari dalam detik
