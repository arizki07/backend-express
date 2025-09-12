import { Request, Response, NextFunction } from 'express';
import { createAudit } from '../services/audit.service';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/jwt';
import { User } from '../models/user.model';
import bcrypt from 'bcrypt';

interface AuditOptions {
  action: string;
  entity: string;
}

const isSequelizeInstance = (v: any) => v && typeof v.toJSON === 'function';

const removeSensitive = <T = any>(data: T): Partial<T> | null => {
  if (!data) return null;

  const plain = isSequelizeInstance(data) ? (data as any).toJSON() : (data as any);

  if (!plain || typeof plain !== 'object') return plain as any;

  const { password_hash, password, confirm_password, token, refresh_token, ...rest } = plain;
  return rest as Partial<T>;
};

const hashPasswordField = async (data: any) => {
  if (!data || typeof data !== 'object') return null;
  const clone = { ...data };
  if (clone.password) {
    const salt = await bcrypt.genSalt(10);
    clone.password = await bcrypt.hash(clone.password, salt);
  }
  return clone;
};

const parseCaptured = (body: any) => {
  if (!body) return null;
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }
  return body;
};

async function writeAudit(req: Request, responseBodyCaptured: any, options: AuditOptions) {
  try {
    // actor id dari JWT
    let actorId = 0;
    try {
      const authHeader = req.headers['authorization'] || '';
      const token = typeof authHeader === 'string' ? authHeader.replace('Bearer ', '') : '';
      if (token) {
        const payload: any = jwt.verify(token, JWT_SECRET);
        actorId = payload?.id || 0;
      }
    } catch {
      actorId = 0;
    }

    // entity id
    let entityId: number | null = (req as any).res?.locals?.__audit?.entityId ?? null;
    if (!entityId && req.params?.id) entityId = parseInt(req.params.id, 10);
    if (!entityId && req.body?.id) entityId = req.body.id;

    // before (prefetched sebelum controller jalan)
    const before = (req as any).res?.locals?.__audit?.before ?? null;

    // after
    let after: any = null;
    const method = req.method.toUpperCase();
    const parsed = parseCaptured(responseBodyCaptured);

    if (method === 'POST') {
      after = parsed
        ? removeSensitive(parsed)
        : entityId
          ? removeSensitive(await User.findByPk(entityId))
          : null;
    } else if (method === 'PUT' || method === 'PATCH') {
      after = parsed
        ? removeSensitive(parsed)
        : entityId
          ? removeSensitive(await User.findByPk(entityId))
          : null;
    } else if (method === 'DELETE') {
      after = null;
    }

    if (after) {
      after = await hashPasswordField(after);
    }

    await createAudit(actorId || 0, options.entity, entityId || 0, options.action, before, after);
  } catch (err) {
    console.error('Audit log error:', err);
  }
}

export const autoAudit = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const method = (req.method || '').toUpperCase();
    const auditMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
    if (!auditMethods.has(method)) return next();

    let entityName = 'unknown';
    if (req.path.includes('/auth')) entityName = 'auth';
    else if (req.path.includes('/users')) entityName = 'user';

    const actionMap: { [k: string]: string } = {
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
    };

    const action = actionMap[method] || 'UNKNOWN';
    const options: AuditOptions = {
      action: `${action}_${entityName.toUpperCase()}`,
      entity: entityName,
    };

    res.locals.__audit = res.locals.__audit || {};

    // Prefetch BEFORE hanya untuk update/delete
    let idToFetch: number | null = null;
    if (req.params?.id) idToFetch = parseInt(req.params.id, 10);
    else if (req.body?.id) idToFetch = req.body.id;

    if ((method === 'PUT' || method === 'PATCH' || method === 'DELETE') && idToFetch) {
      try {
        const existing = await User.findByPk(idToFetch); // tanpa { raw: true }
        res.locals.__audit.before = removeSensitive(existing); // before yang benar
        res.locals.__audit.entityId = idToFetch;
      } catch (err) {
        console.error('Prefetch before error (audit):', err);
        res.locals.__audit.before = null;
        res.locals.__audit.entityId = idToFetch;
      }
    }

    // capture response body
    let capturedBody: any = undefined;
    const originalSend = res.send.bind(res);
    res.send = function (body: any) {
      capturedBody = body;
      return originalSend(body);
    };

    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      capturedBody = body;
      return originalJson(body);
    };

    res.once('finish', async () => {
      await writeAudit(req, capturedBody, options);
    });

    next();
  };
};
