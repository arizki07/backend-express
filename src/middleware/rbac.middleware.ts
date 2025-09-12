import { Request, Response, NextFunction } from 'express';

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user; // di-attach dari authenticate
    const targetUserId = parseInt(req.params.id, 10);

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Admin bisa update siapa saja
    if (user.role === 'admin') {
      return next();
    }

    // User biasa hanya bisa update diri sendiri
    if (roles.includes(user.role) && user.id === targetUserId) {
      return next();
    }

    return res.status(403).json({ message: 'Forbidden' });
  };
};
