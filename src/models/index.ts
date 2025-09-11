import { sequelize } from "../config/db";
import { User } from "./user.model";
import { AuditLog } from "./audit_log.model";

// Export semua model
export { User, AuditLog };

// Sync database (opsional: hanya untuk development)
export const syncDb = async () => {
  await sequelize.sync({ alter: true });
  console.log("Database synced");
};
