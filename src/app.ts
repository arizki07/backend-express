// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { limiter } from './middleware/rateLimiter.middleware';
import { requestIdMiddleware } from './config/logger';
import apiRoutes from './routes/route'; // <-- gabungan auth + user
import { setupSwagger } from './config/swagger';

const app = express();

// Middleware global
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(limiter);
app.use(requestIdMiddleware);

// Semua route di-handle oleh satu router dengan prefix /api
app.use('/api', apiRoutes);
setupSwagger(app);
// Health check
app.get('/health', (req, res) => res.json({ status: 'OK' }));

export default app;
