import { Router } from 'express';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { autoAudit } from '../middleware/audit.middleware';

// Controllers
import {
  loginController,
  refreshController,
  logoutController,
} from '../controllers/auth.controller';
import {
  getUsersController,
  getUserByIdController,
  createUserController,
  updateUserController,
  updatePasswordController,
  deleteUserController,
  exportUserCSVController,
} from '../controllers/user.controller';

// Validators
import { loginSchema } from '../validators/auth.validator';
import {
  createUserSchema,
  updateUserSchema,
  updatePasswordSchema,
} from '../validators/user.validator';

const router = Router();

// 🔥 Auto audit untuk semua routes
router.use(autoAudit());

// --- AUTH ROUTES ---
router.post('/auth/login', validate(loginSchema), loginController);
router.post('/auth/refresh', refreshController);
router.post('/auth/logout', authenticate, logoutController);

// --- USER ROUTES ---
router.get('/users', authenticate, authorize(['admin']), getUsersController);
router.get('/users/:id', authenticate, authorize(['admin']), getUserByIdController);

router.post(
  '/users',
  authenticate,
  authorize(['admin']),
  validate(createUserSchema),
  createUserController,
);

router.put(
  '/users/:id',
  authenticate,
  authorize(['admin']),
  validate(updateUserSchema),
  updateUserController,
);

router.put(
  '/users/:id/password',
  authenticate,
  authorize(['admin']),
  validate(updatePasswordSchema),
  updatePasswordController,
);

router.delete('/users/:id', authenticate, authorize(['admin']), deleteUserController);

router.get('/users/export', authenticate, authorize(['admin']), exportUserCSVController);

export default router;
