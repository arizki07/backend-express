import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/jwt';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      id: number;
      username: string;
      role: string;
    };

    req.user = payload; // ✅ Sekarang TypeScript tidak error
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};
