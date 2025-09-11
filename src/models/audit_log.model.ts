import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db";

export class AuditLog extends Model {}

AuditLog.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    actor_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    entity: { type: DataTypes.STRING(50), allowNull: false },
    entity_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    action: { type: DataTypes.STRING(20), allowNull: false },
    before: { type: DataTypes.JSON, allowNull: true },
    after: { type: DataTypes.JSON, allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { sequelize, tableName: "audit_logs", timestamps: false }
);
