// src/routes/api.ts
import { Router } from 'express';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';

// Controllers
import {
  loginController,
  refreshController,
  logoutController,
} from '../controllers/auth.controller';
import {
  getUsersController,
  createUserController,
  exportUserCSVController,
} from '../controllers/user.controller';

// Validators
import { loginSchema } from '../validators/auth.validator';
import { createUserSchema } from '../validators/user.validator';

const router = Router();

// --- AUTH ROUTES ---
router.post('/auth/login', validate(loginSchema), loginController);
router.post('/auth/refresh', refreshController);
router.post('/auth/logout', authenticate, logoutController);

// --- USER ROUTES ---
router.get('/users', authenticate, authorize(['admin']), getUsersController);
router.post(
  '/users',
  authenticate,
  authorize(['admin']),
  validate(createUserSchema),
  createUserController,
);
router.get('/users/export', authenticate, authorize(['admin']), exportUserCSVController);

export default router;
