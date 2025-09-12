// tests/models/audit_log.model.test.ts
import { sequelizeTest } from '../../src/config/test-db';
import { DataTypes } from 'sequelize';
import { AuditLog } from '../../src/models/audit_log.model';

// Definisikan kembali model AuditLog dengan koneksi ke database pengujian
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
  { sequelize: sequelizeTest, tableName: 'audit_logs', timestamps: false },
);

describe('AuditLog Model', () => {
  // Setup database sebelum setiap tes
  beforeAll(async () => {
    // Sinkronisasi ulang tabel AuditLogs saja
    await AuditLog.sync({ force: true });
  });

  // Tutup koneksi setelah semua tes selesai
  afterAll(async () => {
    await sequelizeTest.close();
  });

  // Tes skenario sukses: Membuat entri log baru
  it('should create a new audit log successfully', async () => {
    const log = await AuditLog.create({
      actor_id: 1,
      entity: 'user',
      entity_id: 1,
      action: 'create',
      before: {},
      after: { username: 'testuser' },
    });

    // Pastikan log berhasil dibuat dan datanya sesuai
    expect(log).toBeDefined();
    expect(log.id).toBe(1);
    expect(log.entity).toBe('user');
    expect(log.action).toBe('create');
    expect(log.after).toEqual({ username: 'testuser' });
  });

  // Tes skenario gagal: Membuat log dengan data yang tidak valid
  it('should not create a log without required fields', async () => {
    await expect(
      // Mencoba membuat log tanpa field 'entity'
      AuditLog.create({
        actor_id: 1,
        entity_id: 1,
        action: 'create',
      }),
    ).rejects.toThrow();
  });
});
