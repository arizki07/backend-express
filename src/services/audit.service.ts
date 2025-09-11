import { AuditLog } from '../models/audit_log.model';

export const createAudit = async (
  actor_id: number,
  entity: string,
  entity_id: number,
  action: string,
  before: object | null = null,
  after: object | null = null,
) => {
  return await AuditLog.create({
    actor_id,
    entity,
    entity_id,
    action,
    before,
    after,
  });
};
