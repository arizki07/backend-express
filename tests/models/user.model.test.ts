// tests/models/user.model.test.ts
import { sequelizeTest } from '../../src/config/test-db';
import { DataTypes } from 'sequelize';
import { User } from '../../src/models/user.model';

// Definisikan kembali model User dengan koneksi ke database pengujian
// Hal ini penting agar model tidak menggunakan koneksi database produksi
User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING(100), allowNull: false },
    username: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('admin', 'user'), allowNull: false },
    created_by: { type: DataTypes.INTEGER },
    updated_by: { type: DataTypes.INTEGER },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize: sequelizeTest, // Gunakan koneksi khusus untuk pengujian
    tableName: 'users',
    paranoid: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  },
);

describe('User Model', () => {
  // Hook untuk menyiapkan database sebelum semua tes dijalankan
  beforeAll(async () => {
    await sequelizeTest.sync({ force: true }); // force: true akan menghapus dan membuat ulang tabel
  });

  // Hook untuk membersihkan database setelah semua tes selesai
  afterAll(async () => {
    await sequelizeTest.close();
  });

  it('should create a new user successfully', async () => {
    const user = await User.create({
      name: 'John Doe',
      username: 'johndoe',
      password_hash: 'hashed_password_123',
      role: 'user',
    });
    expect(user).toBeDefined();
    expect(user.id).toBe(1);
    expect(user.name).toBe('John Doe');
  });

  it('should find a user by username', async () => {
    const foundUser = await User.findOne({
      where: { username: 'johndoe' },
    });
    expect(foundUser).toBeDefined();
    expect(foundUser?.username).toBe('johndoe');
  });

  it('should update a user successfully', async () => {
    const user = await User.findOne({ where: { username: 'johndoe' } });
    if (user) {
      user.name = 'Updated John Doe';
      await user.save();
      const updatedUser = await User.findByPk(user.id);
      expect(updatedUser?.name).toBe('Updated John Doe');
    }
  });

  it('should soft delete a user', async () => {
    const user = await User.findOne({ where: { username: 'johndoe' } });
    if (user) {
      await user.destroy();
      // Mencari pengguna yang telah dihapus (paranoid) akan menghasilkan null
      const deletedUser = await User.findOne({ where: { username: 'johndoe' } });
      expect(deletedUser).toBeNull();
      // Tapi kita bisa menemukan data yang dihapus dengan `paranoid: false`
      const foundWithDeleted = await User.findOne({
        where: { username: 'johndoe' },
        paranoid: false,
      });
      expect(foundWithDeleted).not.toBeNull();
    }
  });

  it('should prevent creating a user with a duplicate username', async () => {
    await User.create({
      name: 'Jane Doe',
      username: 'janedoe',
      password_hash: 'hashed_password_456',
      role: 'user',
    });
    // Mencoba membuat pengguna dengan nama pengguna yang sama
    await expect(
      User.create({
        name: 'Jane Doe 2',
        username: 'janedoe',
        password_hash: 'hashed_password_789',
        role: 'user',
      }),
    ).rejects.toThrow();
  });
});
