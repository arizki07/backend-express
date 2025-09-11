// src/services/audit.service.ts
import { AuditLog } from '../models/audit_log.model';

export const createAudit = async (
  actorId: number,
  entity: string,
  entityId: number,
  action: string,
  before?: any,
  after?: any,
) => {
  await AuditLog.create({
    actor_id: actorId,
    entity,
    entity_id: entityId,
    action,
    before,
    after,
    created_at: new Date(),
  });
};
