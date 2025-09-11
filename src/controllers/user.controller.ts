import { Request, Response } from 'express';
import { User } from '../models/user.model';
import { getCache, setCache } from '../utils/redisCache';
import { createUserService } from '../services/user.service';
import { exportCSV } from '../utils/csvExport';
import { createAudit } from '../services/audit.service';

export const getUsersController = async (req: Request, res: Response) => {
  const { page = 1, limit = 10, q, role, sortBy = 'id', sortDir = 'ASC' } = req.query;
  const cacheKey = `users_${page}_${limit}_${q}_${role}_${sortBy}_${sortDir}`;
  const cached = await getCache(cacheKey);
  if (cached) return res.json(cached);

  const offset = (+page - 1) * +limit;
  const where: any = { deleted_at: null };
  if (q) where.name = { $like: `%${q}%` };
  if (role) where.role = role;

  const { rows, count } = await User.findAndCountAll({
    where,
    limit: +limit,
    offset,
    order: [[sortBy as string, sortDir as string]],
  });
  const result = {
    data: rows,
    meta: {
      totalData: count,
      totalPage: Math.ceil(count / +limit),
      currentPage: +page,
      perPage: +limit,
    },
  };
  await setCache(cacheKey, result, 60);

  // Audit log view users
  await createAudit((req as any).user.id, 'user', 0, 'VIEW_LIST');

  res.json(result);
};

export const createUserController = async (req: Request, res: Response) => {
  try {
    const actorId = (req as any).user.id;
    const user = await createUserService(req.body, actorId);

    // Audit log create user
    await createAudit(actorId, 'user', user.id, 'CREATE', null, user);

    res.json(user);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const exportUserCSVController = async (req: Request, res: Response) => {
  const users = await User.findAll({ where: { deleted_at: null } });
  const csv = exportCSV(
    users.map((u) => u.toJSON()),
    ['id', 'name', 'username', 'role', 'created_at'],
    'users.csv',
  );

  // Audit log export
  await createAudit((req as any).user.id, 'user', 0, 'EXPORT_CSV');

  res.header('Content-Type', 'text/csv');
  res.attachment('users.csv');
  res.send(csv);
};
