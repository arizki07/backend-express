import { Request, Response, NextFunction } from 'express';
import { createAudit } from '../services/audit.service';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/jwt';
import { User } from '../models/user.model';
import bcrypt from 'bcrypt';

interface AuditOptions {
  action: string;
  entity?: string; // default = 'user'
  getEntityId?: (req: Request) => number;
  getBefore?: (req: Request) => Promise<object | null>;
  getAfter?: (req: Request, res?: Response) => Promise<object | null>;
}

// Hapus field sensitif
const removeSensitive = (data: any) => {
  if (!data) return null;
  const { password_hash, ...rest } = data;
  return rest;
};

// Hash password jika ada di object
const hashPasswordField = async (data: any) => {
  if (!data) return null;
  const clone = { ...data };
  if (clone.password) {
    const salt = await bcrypt.genSalt(10);
    clone.password = await bcrypt.hash(clone.password, salt);
  }
  return clone;
};

export const auditLog = (optionsOrAction: AuditOptions | string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parsing options
      let options: AuditOptions;
      if (typeof optionsOrAction === 'string') {
        options = { action: optionsOrAction };
      } else {
        options = optionsOrAction;
      }

      // Ambil actor_id dari token
      const authHeader = req.headers['authorization'] || '';
      const token = authHeader.replace('Bearer ', '');
      let actorId: number | null = null;

      if (token) {
        try {
          const payload: any = jwt.verify(token, JWT_SECRET);
          actorId = payload.id;
        } catch {
          actorId = null; // login/refresh/logout bisa tanpa token
        }
      }

      // Tentukan entityId
      let entityId: number = 0;
      if (options.getEntityId) {
        entityId = options.getEntityId(req);
      } else if (req.body.id) {
        entityId = req.body.id;
      } else if (req.params.id) {
        entityId = parseInt(req.params.id, 10);
      }

      // Ambil before
      let before: object | null = null;
      if (options.getBefore) {
        before = removeSensitive(await options.getBefore(req));
      } else if (['PUT', 'PATCH', 'DELETE'].includes(req.method) && entityId) {
        const existing = await User.findByPk(entityId);
        before = removeSensitive(existing ? existing.toJSON() : null);
      }

      // Ambil after
      let after: object | null = null;
      if (options.getAfter) {
        const data = await options.getAfter(req, res);
        after = await hashPasswordField(removeSensitive(data));
      } else if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        if (entityId) {
          const newData = await User.findByPk(entityId);
          after = await hashPasswordField(removeSensitive(newData ? newData.toJSON() : req.body));
        } else {
          after = await hashPasswordField(removeSensitive(req.body));
        }
      }

      // Tentukan entity name
      let entityName = options.entity || 'user';
      if (entityId) {
        const user = await User.findByPk(entityId);
        if (user) entityName = user.name; // ambil name dari User
      } else if (!actorId) {
        entityName = 'unknown'; // login/logout
      }

      // Simpan audit log
      await createAudit(actorId || 0, entityName, entityId, options.action, before, after);
    } catch (err) {
      console.error('Audit log error:', err);
    } finally {
      next();
    }
  };
};
