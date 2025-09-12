import { Request, Response } from 'express';
import { loginService, refreshService, logoutService, meService } from '../services/auth.service';
import { User } from '../models';

export const loginController = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const result = await loginService(username, password);

    res.json({ data: result });
  } catch (err: any) {
    res.status(401).json({ message: err.message });
  }
};

export const refreshController = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const result = await refreshService(token);

    res.json({ data: result });
  } catch (err: any) {
    res.status(401).json({ message: err.message });
  }
};

export const meController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id; // pastikan middleware JWT sudah menaruh user di req.user
    const user = await meService(userId);

    res.json({ data: user });
  } catch (err: any) {
    res.status(401).json({ message: err.message });
  }
};

export const logoutController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    await logoutService(userId);

    res.json({ message: 'Logged out' });
  } catch (err) {
    res.status(400).json({ message: 'Bad Request' });
  }
};
