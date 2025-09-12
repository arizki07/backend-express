// src/routes/route.ts
import { Router } from 'express';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { autoAudit } from '../middleware/audit.middleware';

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

import { loginSchema } from '../validators/auth.validator';
import {
  createUserSchema,
  updateUserSchema,
  updatePasswordSchema,
} from '../validators/user.validator';

const router = Router();

router.use(autoAudit());

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login berhasil
 */
router.post('/auth/login', validate(loginSchema), loginController);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh token
 *     responses:
 *       200:
 *         description: Token diperbarui
 */
router.post('/auth/refresh', refreshController);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout berhasil
 */
router.post('/auth/logout', authenticate, logoutController);

/**
 * @openapi
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: Ambil semua user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Daftar user
 */
router.get('/users', authenticate, authorize(['admin']), getUsersController);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Ambil user by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Data user
 */
router.get('/users/:id', authenticate, authorize(['admin']), getUserByIdController);

/**
 * @openapi
 * /users:
 *   post:
 *     tags: [Users]
 *     summary: Buat user baru
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUser'
 *     responses:
 *       201:
 *         description: User berhasil dibuat
 */
router.post(
  '/users',
  authenticate,
  authorize(['admin']),
  validate(createUserSchema),
  createUserController,
);

/**
 * @openapi
 * /users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUser'
 *     responses:
 *       200:
 *         description: User berhasil diupdate
 */
router.put(
  '/users/:id',
  authenticate,
  authorize(['admin']),
  validate(updateUserSchema),
  updateUserController,
);

/**
 * @openapi
 * /users/{id}/password:
 *   put:
 *     tags: [Users]
 *     summary: Update password user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password, confirm_password]
 *             properties:
 *               password:
 *                 type: string
 *               confirm_password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password berhasil diupdate
 */
router.put(
  '/users/:id/password',
  authenticate,
  authorize(['admin']),
  validate(updatePasswordSchema),
  updatePasswordController,
);

/**
 * @openapi
 * /users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Hapus user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: User berhasil dihapus
 */
router.delete('/users/:id', authenticate, authorize(['admin']), deleteUserController);

/**
 * @openapi
 * /users/export:
 *   get:
 *     tags: [Users]
 *     summary: Export data user ke CSV
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: File CSV
 */
router.get('/users/export', authenticate, authorize(['admin']), exportUserCSVController);

export default router;
