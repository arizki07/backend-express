// tests/config/test-db.ts
import { Sequelize } from 'sequelize';

// Konfigurasi Sequelize untuk database in-memory SQLite
const sequelizeTest = new Sequelize({
  dialect: 'sqlite',
  storage: ':memory:', // Menyimpan database di memori, bukan file
  logging: false, // Matikan logging SQL agar output tes lebih bersih
});

export { sequelizeTest };
