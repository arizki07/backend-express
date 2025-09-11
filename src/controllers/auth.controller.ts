import { Request, Response } from 'express';
import { loginService, refreshService, logoutService } from '../services/auth.service';
import { createAudit } from '../services/audit.service';

export const loginController = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const result = await loginService(username, password);

    // Audit log login
    await createAudit(result.user.id, 'user', result.user.id, 'LOGIN');

    res.json({ data: result });
  } catch (err: any) {
    res.status(401).json({ message: err.message });
  }
};

export const refreshController = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    const result = await refreshService(refreshToken);

    res.json({ data: result });
  } catch (err: any) {
    res.status(401).json({ message: err.message });
  }
};

export const logoutController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    await logoutService(userId);

    // Audit log logout
    await createAudit(userId, 'user', userId, 'LOGOUT');

    res.json({ message: 'Logged out' });
  } catch (err) {
    res.status(400).json({ message: 'Bad Request' });
  }
};
