import app from './app';
import dotenv from 'dotenv';
import { sequelize } from './config/db';
dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    // Sinkronisasi model ke DB (development only!)
    // alter:true menyesuaikan tabel tanpa drop data
    await sequelize.sync({ alter: true });

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Database connection failed:', err);
  }
};

startServer();
