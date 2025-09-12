import { AuditLog } from '../models/audit_log.model';

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
