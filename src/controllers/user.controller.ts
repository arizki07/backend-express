import { Request, Response } from 'express';
import { getCache, setCache } from '../utils/redisCache';
import {
  getUsersService,
  getUserByIdService,
  createUserService,
  updateUserService,
  updatePasswordService,
  deleteUserService,
  // exportUsersService,
} from '../services/user.service';
import { exportCSV } from '../utils/csvExport';
import bcrypt from 'bcrypt';
import { User } from '../models/user.model';
import { Parser } from 'json2csv';
import { Op } from 'sequelize';

export const getUsersController = async (req: Request, res: Response) => {
  const cacheKey = `users_${JSON.stringify(req.query)}`;
  const cached = await getCache(cacheKey);
  if (cached) return res.json(cached);

  const result = await getUsersService(req.query);
  await setCache(cacheKey, result, 60);

  res.json(result);
};

export const getUserByIdController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);

    // ⚠️ Perbaikan: Validasi ID sebelum memproses
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid user ID provided.' });
    }

    const cacheKey = `user_${id}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const user = await getUserByIdService(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    await setCache(cacheKey, user, 60);
    res.json(user);
  } catch (err: any) {
    console.error('Error in getUserByIdController:', err);
    res.status(500).json({ message: 'An internal server error occurred.' });
  }
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

    if (user) {
      return res.status(200).json({ message: 'Update password success' });
    }

    throw new Error('Update password failed');
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

export const exportUsersController = async (req: Request, res: Response) => {
  try {
    const cacheKey = `users_export_${JSON.stringify(req.query)}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="users.csv"`);
      return res.send(cached);
    }

    // Ambil & validasi sortBy, sortDir, q, role
    const validColumns = ['id', 'name', 'username', 'role', 'created_at', 'updated_at'];
    let { sortBy, sortDir, q, role } = req.query as any;

    sortBy = validColumns.includes(sortBy) ? sortBy : 'id';
    sortDir = ['ASC', 'DESC'].includes(sortDir?.toUpperCase()) ? sortDir.toUpperCase() : 'ASC';

    // 💡 Perbaikan: Ambil limit dari query, dan gunakan batas maksimal
    const userLimit = parseInt(req.query.limit as string, 10);
    const limit = !isNaN(userLimit) && userLimit > 0 ? Math.min(userLimit, 5000) : 5000;

    // Ambil data dari service
    const result = await getUsersService({
      page: 1,
      limit,
      sortBy,
      sortDir,
      q,
      role,
    });

    const users = result.data.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      role: u.role,
      created_at: u.created_at,
      updated_at: u.updated_at,
    }));

    const parser = new Parser();
    const csv = parser.parse(users);

    await setCache(cacheKey, csv, 60);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="users.csv"`);
    res.send(csv);
  } catch (err: any) {
    console.error('Export CSV error:', err);
    res.status(500).json({ message: err.message });
  }
};
