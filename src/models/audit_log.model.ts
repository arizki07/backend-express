import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';

// Declare the properties on the class for TypeScript
export class AuditLog extends Model {
  public id!: number;
  public actor_id!: number;
  public entity!: string;
  public entity_id!: number;
  public action!: string;
  public before!: object;
  public after!: object;
  public created_at!: Date;
}

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
  { sequelize, tableName: 'audit_logs', timestamps: false },
);
