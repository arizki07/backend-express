import { Router } from 'express';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { auditLog } from '../middleware/audit.middleware';
import { User } from '../models/user.model';

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
import { createUserSchema, updateUserSchema } from '../validators/user.validator';

const router = Router();

// --- AUTH ROUTES ---
router.post(
  '/auth/login',
  validate(loginSchema),
  auditLog({
    action: 'LOGIN',
    entity: 'unknown',
    getAfter: async (req) => req.body,
  }),
  loginController,
);

router.post(
  '/auth/refresh',
  auditLog({
    action: 'REFRESH',
    entity: 'unknown',
    getAfter: async (req) => req.body,
  }),
  refreshController,
);

router.post(
  '/auth/logout',
  authenticate,
  auditLog({
    action: 'LOGOUT',
    entity: 'unknown',
    getAfter: async (req) => req.body,
  }),
  logoutController,
);

// --- USER ROUTES ---
router.get(
  '/users',
  authenticate,
  authorize(['admin']),
  auditLog({ action: 'GET_USERS', entity: 'user', getAfter: async () => null }),
  getUsersController,
);

router.post(
  '/users',
  authenticate,
  authorize(['admin']),
  validate(createUserSchema),
  auditLog({ action: 'CREATE_USER', entity: 'user', getAfter: async (req) => req.body }),
  createUserController,
);

// router.put(
//   '/users/:id',
//   authenticate,
//   authorize(['admin']),
//   validate(updateUserSchema),
//   auditLog({
//     action: 'UPDATE_USER',
//     entity: 'user',
//     getEntityId: (req) => parseInt(req.params.id, 10),
//     getBefore: async (req) => {
//       const user = await User.findByPk(req.params.id);
//       return user ? user.toJSON() : null;
//     },
//     getAfter: async (req) => {
//       const user = await User.findByPk(req.params.id);
//       return user ? user.toJSON() : null;
//     },
//   }),
//   updateUserController,
// );

// router.delete(
//   '/users/:id',
//   authenticate,
//   authorize(['admin']),
//   auditLog({
//     action: 'DELETE_USER',
//     entity: 'user',
//     getEntityId: (req) => parseInt(req.params.id, 10),
//     getBefore: async (req) => {
//       const user = await User.findByPk(req.params.id);
//       return user ? user.toJSON() : null;
//     },
//     getAfter: async () => null,
//   }),
//   deleteUserController,
// );

router.get(
  '/users/export',
  authenticate,
  authorize(['admin']),
  auditLog({ action: 'EXPORT_USERS', entity: 'user', getAfter: async () => null }),
  exportUserCSVController,
);

export default router;
