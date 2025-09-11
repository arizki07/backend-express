import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db";

export class User extends Model {
  public id!: number;
  public name!: string;
  public username!: string;
  public password_hash!: string;
  public role!: "admin" | "user";
  public created_by!: number;
  public updated_by!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public deleted_at!: Date | null;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING(100), allowNull: false },
    username: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM("admin", "user"), allowNull: false },
    created_by: { type: DataTypes.INTEGER.UNSIGNED },
    updated_by: { type: DataTypes.INTEGER.UNSIGNED },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: "users",
    paranoid: true, // soft delete
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
  }
);
