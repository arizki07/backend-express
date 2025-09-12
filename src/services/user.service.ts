import { query } from 'winston';
import { User } from '../models/user.model';
import { hashPassword } from '../utils/hash';
import { createAudit } from './audit.service';
import { Op } from 'sequelize';
import { Request } from 'express';

export const getUsersService = async (query: any) => {
  const { page = 1, limit = 10, q, role, createdFrom, createdTo, sortBy, sortDir } = query;

  const offset = (+page - 1) * +limit;
  const where: any = { deleted_at: null };

  // 🔎 Filter q (cari di name & username)
  if (q) {
    where[Op.or] = [{ name: { [Op.like]: `%${q}%` } }, { username: { [Op.like]: `%${q}%` } }];
  }

  // 🔎 Filter role (hanya admin atau user)
  if (role === 'admin' || role === 'user') {
    where.role = role;
  }

  // 🔎 Filter created_at range
  if (createdFrom || createdTo) {
    where.created_at = {};
    if (createdFrom) where.created_at[Op.gte] = new Date(createdFrom as string);
    if (createdTo) where.created_at[Op.lte] = new Date(createdTo as string);
  }

  // 🔎 Sorting default
  const orderBy = sortBy && typeof sortBy === 'string' && sortBy.trim() !== '' ? sortBy : 'id';
  const direction =
    sortDir && ['ASC', 'DESC'].includes((sortDir as string).toUpperCase())
      ? (sortDir as string).toUpperCase()
      : 'ASC';

  const { rows, count } = await User.findAndCountAll({
    where,
    limit: +limit,
    offset,
    order: [[orderBy, direction]],
  });

  return {
    data: rows,
    meta: {
      totalData: count,
      totalPage: Math.ceil(count / +limit),
      currentPage: +page,
      perPage: +limit,
    },
  };
};

export const getUserByIdService = async (id: number) => {
  return await User.findOne({ where: { id, deleted_at: null } });
};

export const createUserService = async (data: any, actorId: number) => {
  const password_hash = await hashPassword(data.password);
  const user = await User.create({
    ...data,
    password_hash,
    created_by: actorId,
    updated_by: actorId,
  });
  return user;
};

export const updateUserService = async (id: number, data: any, actorId: number, req?: Request) => {
  const user = await User.findByPk(id);
  if (!user) throw new Error('User not found');

  // simpan BEFORE sebelum update (pakai toJSON biar ga ke-overwrite)
  if (req) {
    (req as any).res.locals.__audit = (req as any).res.locals.__audit || {};
    (req as any).res.locals.__audit.before = user.toJSON();
    (req as any).res.locals.__audit.entityId = id;
  }

  await user.update({
    ...data,
    updated_by: actorId,
  });

  return user;
};

// fungsi update password
export const updatePasswordService = async (
  id: number,
  password: string,
  actorId: number,
  req?: Request,
) => {
  const user = await User.findByPk(id);
  if (!user) throw new Error('User not found');

  // simpan BEFORE
  if (req) {
    req.res!.locals.__audit = req.res!.locals.__audit || {};
    req.res!.locals.__audit.before = user.toJSON();
    req.res!.locals.__audit.entityId = id;
  }

  const password_hash = await hashPassword(password);
  await user.update({ password_hash, updated_by: actorId });

  return user;
};

export const deleteUserService = async (id: number, actorId: number, req?: Request) => {
  const user = await User.findByPk(id);
  if (!user) throw new Error('User not found');

  // simpan BEFORE
  if (req) {
    req.res!.locals.__audit = req.res!.locals.__audit || {};
    req.res!.locals.__audit.before = user.toJSON();
    req.res!.locals.__audit.entityId = id;
  }

  await user.update({ deleted_at: new Date(), updated_by: actorId });

  return user;
};
