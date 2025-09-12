import { Op } from 'sequelize';
import { AuditLog } from '../models/audit_log.model';

interface GetAuditParams {
  page?: number;
  limit?: number;
  q?: string; // filter by entity
  sortBy?: 'created_at';
  sortDir?: 'asc' | 'desc';
  createdFrom?: string;
  createdTo?: string;
}

export const createAudit = async (
  actor_id: number,
  entity: string,
  entity_id: number,
  action: string,
  before: object | null = null,
  after: object | null = null,
) => {
  // Validasi data sebelum disimpan
  const cleanBefore = before ? removeSensitiveFields(before) : null;
  const cleanAfter = after ? removeSensitiveFields(after) : null;

  return await AuditLog.create({
    actor_id,
    entity,
    entity_id,
    action,
    before: cleanBefore,
    after: cleanAfter,
  });
};

// Helper function untuk menghapus field sensitif
const removeSensitiveFields = (data: object): object => {
  const sensitiveFields = [
    'password',
    'password_hash',
    'confirm_password',
    'token',
    'refresh_token',
  ];

  // Convert to any untuk menghindari error TypeScript
  const cleanedData: { [key: string]: any } = { ...(data as any) };

  sensitiveFields.forEach((field) => {
    if (cleanedData.hasOwnProperty(field)) {
      delete cleanedData[field];
    }
  });

  return cleanedData;
};

export const getAuditLogs = async (params: GetAuditParams) => {
  const {
    page = 1,
    limit = 10,
    q,
    sortBy = 'created_at',
    sortDir = 'desc',
    createdFrom,
    createdTo,
  } = params;

  const offset = (page - 1) * limit;

  const where: any = {};

  if (q) {
    where.entity = { [Op.like]: `%${q}%` };
  }

  if (createdFrom || createdTo) {
    where.created_at = {};
    if (createdFrom) where.created_at[Op.gte] = new Date(createdFrom);
    if (createdTo) where.created_at[Op.lte] = new Date(createdTo);
  }

  const { count: totalData, rows } = await AuditLog.findAndCountAll({
    where,
    limit,
    offset,
    order: [[sortBy, sortDir]],
  });

  const totalPage = Math.ceil(totalData / limit);

  return {
    data: rows,
    meta: {
      totalData,
      totalPage,
      currentPage: page,
      perPage: limit,
    },
  };
};
