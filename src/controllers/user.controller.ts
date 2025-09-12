import { Request, Response } from 'express';
import { getCache, setCache } from '../utils/redisCache';
import {
  getUsersService,
  getUserByIdService,
  createUserService,
  updateUserService,
  updatePasswordService,
  deleteUserService,
} from '../services/user.service';
import { exportCSV } from '../utils/csvExport';
import bcrypt from 'bcrypt';
import { User } from '../models/user.model';

export const getUsersController = async (req: Request, res: Response) => {
  const cacheKey = `users_${JSON.stringify(req.query)}`;
  const cached = await getCache(cacheKey);
  if (cached) return res.json(cached);

  const result = await getUsersService(req.query);
  await setCache(cacheKey, result, 60);

  res.json(result);
};

export const getUserByIdController = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const cacheKey = `user_${id}`;
  const cached = await getCache(cacheKey);
  if (cached) return res.json(cached);

  const user = await getUserByIdService(id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  await setCache(cacheKey, user, 60);
  res.json(user);
};

export const createUserController = async (req: Request, res: Response) => {
  try {
    const actorId = (req as any).user.id;
    const user = await createUserService(req.body, actorId);
    res.json(user);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const updateUserController = async (req: Request, res: Response) => {
  try {
    const actorId = (req as any).user.id;
    const id = parseInt(req.params.id, 10);

    const user = await updateUserService(id, req.body, actorId, req);
    res.json(user);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const updatePasswordController = async (req: Request, res: Response) => {
  try {
    const actorId = (req as any).user.id;
    const id = parseInt(req.params.id, 10);
    const { password, confirm_password } = req.body;

    if (password !== confirm_password) {
      return res.status(400).json({ message: 'Password confirmation does not match' });
    }

    const user = await updatePasswordService(id, password, actorId, req);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteUserController = async (req: Request, res: Response) => {
  try {
    const actor = (req as any).user;
    const id = parseInt(req.params.id, 10);
    const { confirm_password } = req.body;

    const admin = await User.findByPk(actor.id);
    if (!admin) return res.status(401).json({ message: 'Unauthorized' });

    const valid = await bcrypt.compare(confirm_password, admin.password_hash);
    if (!valid) return res.status(400).json({ message: 'Invalid admin password confirmation' });

    const user = await deleteUserService(id, actor.id, req);
    res.json(user);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const exportUserCSVController = async (req: Request, res: Response) => {
  const { data } = await getUsersService(req.query);

  const csv = exportCSV(
    data.map((u) => u.toJSON()),
    ['id', 'name', 'username', 'role', 'created_at'],
    'users.csv',
  );

  res.header('Content-Type', 'text/csv');
  res.attachment('users.csv');
  res.send(csv);
};
